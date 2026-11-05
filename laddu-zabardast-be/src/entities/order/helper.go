package order

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func getCollection() *mongo.Collection {
	return db.GetCollection(db.DefaultDB, CollectionOrders)
}

func sanitizePDFText(text string) string {
	text = strings.ReplaceAll(text, "\\", "\\\\")
	text = strings.ReplaceAll(text, "(", "\\(")
	text = strings.ReplaceAll(text, ")", "\\)")
	return text
}

func generatePDFBytes(ord Order) []byte {
	var stream bytes.Buffer

	// Title
	stream.WriteString("BT\n/F1 18 Tf\n50 730 Td\n(Laddu Zabardast - Tax Invoice) Tj\nET\n")

	// Order metadata
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 690 Td\n(Order ID: %s) Tj\nET\n", sanitizePDFText(ord.ID)))
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 675 Td\n(Date: %s) Tj\nET\n", sanitizePDFText(ord.Date)))
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 660 Td\n(Order Status: %s    |    Payment: %s (%s)) Tj\nET\n",
		sanitizePDFText(ord.OrderStatus), sanitizePDFText(ord.PaymentStatus), sanitizePDFText(ord.PaymentMethod)))

	// Customer Info
	stream.WriteString("BT\n/F1 12 Tf\n50 630 Td\n(Customer & Shipping Details:) Tj\nET\n")
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 615 Td\n(Name: %s) Tj\nET\n", sanitizePDFText(ord.ShippingDetails.Name)))
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 600 Td\n(Email: %s) Tj\nET\n", sanitizePDFText(ord.ShippingDetails.Email)))
	if ord.ShippingDetails.Phone != "" {
		stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 585 Td\n(Phone: %s) Tj\nET\n", sanitizePDFText(ord.ShippingDetails.Phone)))
	}
	addrLine := ord.ShippingDetails.Address
	if addrLine == "" {
		addrLine = ord.ShippingDetails.Street
	}
	fullAddr := fmt.Sprintf("%s, %s, %s - %s, %s",
		addrLine, ord.ShippingDetails.City, ord.ShippingDetails.State,
		ord.ShippingDetails.PostalCode, ord.ShippingDetails.Country)
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 570 Td\n(Address: %s) Tj\nET\n", sanitizePDFText(fullAddr)))

	// Items header
	stream.WriteString("BT\n/F1 12 Tf\n50 535 Td\n(Ordered Items:) Tj\nET\n")
	stream.WriteString("BT\n/F1 10 Tf\n50 520 Td\n(Item Name                                   Qty       Price (INR)     Subtotal (INR)) Tj\nET\n")

	y := 505
	for _, item := range ord.Items {
		subtotal := float64(item.Quantity) * item.Price
		line := fmt.Sprintf("%-38s x%-4d    Rs. %-10.2f  Rs. %.2f",
			item.Name, item.Quantity, item.Price, subtotal)
		stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 %d Td\n(%s) Tj\nET\n", y, sanitizePDFText(line)))
		y -= 18
		if y < 100 {
			break
		}
	}

	// Total Amount
	stream.WriteString(fmt.Sprintf("BT\n/F1 14 Tf\n50 %d Td\n(Total Amount: Rs. %.2f) Tj\nET\n", y-20, ord.TotalAmount))
	stream.WriteString(fmt.Sprintf("BT\n/F1 9 Tf\n50 %d Td\n(Thank you for ordering with Laddu Zabardast! For questions, contact support@ladduzabardast.com) Tj\nET\n", y-50))

	streamBytes := stream.Bytes()

	var pdf bytes.Buffer
	pdf.WriteString("%PDF-1.4\n")
	var offsets [6]int

	offsets[1] = pdf.Len()
	pdf.WriteString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

	offsets[2] = pdf.Len()
	pdf.WriteString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")

	offsets[3] = pdf.Len()
	pdf.WriteString("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n")

	offsets[4] = pdf.Len()
	pdf.WriteString("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

	offsets[5] = pdf.Len()
	pdf.WriteString(fmt.Sprintf("5 0 obj\n<< /Length %d >>\nstream\n%sendstream\nendobj\n", len(streamBytes), streamBytes))

	xrefOffset := pdf.Len()
	pdf.WriteString("xref\n0 6\n0000000000 65535 f \n")
	for i := 1; i <= 5; i++ {
		pdf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[i]))
	}

	pdf.WriteString(fmt.Sprintf("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", xrefOffset))

	return pdf.Bytes()
}
