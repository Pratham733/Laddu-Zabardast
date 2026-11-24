package order

import (
	"archive/zip"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var invoiceSort = bson.D{{Key: "day", Value: -1}, {Key: "serial", Value: -1}}

func invoiceMonth(month string) (bson.M, error) {
	start, err := time.ParseInLocation("2006-01", month, invoiceZone)
	if err != nil || start.Format("2006-01") != month || start.Year() < 1900 || start.Year() >= 9999 {
		return nil, errors.New("use an invoice month in YYYY-MM format")
	}
	return bson.M{"day": bson.M{"$gte": start.Format("20060102"), "$lt": start.AddDate(0, 1, 0).Format("20060102")}}, nil
}

type invoiceHistoryRow struct {
	OrderID      string    `json:"orderId"`
	Number       string    `json:"number"`
	IssuedAt     time.Time `json:"issuedAt"`
	CustomerName string    `json:"customerName"`
	TotalAmount  float64   `json:"totalAmount"`
}

func listAdminInvoices(w http.ResponseWriter, r *http.Request) {
	month := r.URL.Query().Get("month")
	if month == "" {
		month = time.Now().In(invoiceZone).Format("2006-01")
	}
	filter, err := invoiceMonth(month)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	rows, err := invoiceHistory(r.Context(), filter)
	if err != nil {
		log.Printf("list invoice history: %v", err)
		http.Error(w, "Could not load invoice history", http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Cache-Control", "private, no-store")
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(struct {
		Month    string              `json:"month"`
		Invoices []invoiceHistoryRow `json:"invoices"`
	}{month, rows})
}

func invoiceHistory(ctx context.Context, filter bson.M) ([]invoiceHistoryRow, error) {
	cursor, err := invoiceCollection().Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$sort", Value: invoiceSort}},
		{{Key: "$project", Value: bson.M{
			"day": 1, "serial": 1, "issuedAt": 1, "customerName": 1, "totalAmount": 1,
			"archived": bson.M{"$eq": bson.A{bson.M{"$type": "$pdf"}, "binData"}},
		}}},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	rows := []invoiceHistoryRow{}
	for cursor.Next(ctx) {
		var entry struct {
			Invoice  issuedInvoice `bson:",inline"`
			Archived bool          `bson:"archived"`
		}
		if err := cursor.Decode(&entry); err != nil {
			return nil, err
		}
		if !entry.Archived {
			var ord Order
			err := getCollection().FindOne(ctx, bson.M{"_id": entry.Invoice.OrderID},
				options.FindOne().SetProjection(bson.M{"shippingDetails.name": 1, "totalAmount": 1})).Decode(&ord)
			if errors.Is(err, mongo.ErrNoDocuments) {
				continue // A legacy number still exists, but its order was removed before PDFs were archived.
			}
			if err != nil {
				return nil, err
			}
			entry.Invoice.CustomerName = invoiceCustomerName(ord)
			entry.Invoice.TotalAmount = ord.TotalAmount
		}
		rows = append(rows, invoiceHistoryRow{entry.Invoice.OrderID, entry.Invoice.number(), entry.Invoice.IssuedAt, entry.Invoice.CustomerName, entry.Invoice.TotalAmount})
	}
	return rows, cursor.Err()
}

type invoiceExport struct {
	Month    string   `json:"month"`
	All      bool     `json:"all"`
	OrderIDs []string `json:"orderIds"`
}

func exportAdminInvoices(w http.ResponseWriter, r *http.Request) {
	var req invoiceExport
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 2<<20)).Decode(&req); err != nil {
		http.Error(w, "Invalid invoice selection", http.StatusBadRequest)
		return
	}
	filter, err := invoiceMonth(req.Month)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.All {
		if len(req.OrderIDs) != 0 {
			http.Error(w, "Select either all invoices or specific invoices", http.StatusBadRequest)
			return
		}
	} else {
		if len(req.OrderIDs) == 0 {
			http.Error(w, "Select at least one invoice", http.StatusBadRequest)
			return
		}
		filter["_id"] = bson.M{"$in": req.OrderIDs}
	}
	file, err := os.CreateTemp("", "lz-invoices-*.zip")
	if err != nil {
		http.Error(w, "Could not prepare the invoice archive", http.StatusServiceUnavailable)
		return
	}
	defer os.Remove(file.Name())
	defer file.Close()

	count, err := writeInvoiceArchive(r.Context(), file, filter)
	if err != nil {
		log.Printf("export invoice history: %v", err)
		http.Error(w, "Could not prepare the invoice archive", http.StatusServiceUnavailable)
		return
	}
	selected := make(map[string]struct{}, len(req.OrderIDs))
	for _, id := range req.OrderIDs {
		selected[id] = struct{}{}
	}
	if count == 0 || (!req.All && count != len(selected)) {
		http.Error(w, "Some selected invoices are unavailable in this month. Refresh the list and try again.", http.StatusNotFound)
		return
	}
	stat, err := file.Stat()
	if err != nil {
		http.Error(w, "Could not read the invoice archive", http.StatusServiceUnavailable)
		return
	}
	if _, err = file.Seek(0, io.SeekStart); err != nil {
		http.Error(w, "Could not read the invoice archive", http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Cache-Control", "private, no-store")
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Disposition")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="invoices-%s.zip"`, req.Month))
	w.Header().Set("Content-Length", fmt.Sprint(stat.Size()))
	_, _ = io.Copy(w, file)
}

func writeInvoiceArchive(ctx context.Context, destination io.Writer, filter bson.M) (int, error) {
	cursor, err := invoiceCollection().Find(ctx, filter, options.Find().SetSort(invoiceSort).SetBatchSize(16))
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)
	archive := zip.NewWriter(destination)
	count := 0
	for cursor.Next(ctx) {
		var invoice issuedInvoice
		if err := cursor.Decode(&invoice); err != nil {
			return 0, err
		}
		if len(invoice.PDF) == 0 {
			var ord Order
			err := getCollection().FindOne(ctx, bson.M{"_id": invoice.OrderID}).Decode(&ord)
			if errors.Is(err, mongo.ErrNoDocuments) {
				continue
			}
			if err != nil {
				return 0, err
			}
			invoice, err = archiveLegacyInvoice(ctx, invoice, ord)
			if err != nil {
				return 0, err
			}
		}
		entry, err := archive.CreateHeader(&zip.FileHeader{Name: invoiceFilename(invoice), Method: zip.Store})
		if err != nil {
			return 0, err
		}
		if _, err = entry.Write(invoice.PDF); err != nil {
			return 0, err
		}
		count++
	}
	if err := cursor.Err(); err != nil {
		return 0, err
	}
	return count, archive.Close()
}

func invoiceFilename(invoice issuedInvoice) string {
	return "invoice-" + invoice.number() + ".pdf"
}
