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
	var pages [][]byte

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

	writeItemsHeader := func(y int) {
		fmt.Fprintf(&stream, "BT\n/F1 12 Tf\n50 %d Td\n(Ordered Items:) Tj\nET\n", y)
		fmt.Fprintf(&stream, "BT\n/F1 10 Tf\n50 %d Td\n(Item Name                                   Qty       Price (INR)     Subtotal (INR)) Tj\nET\n", y-15)
	}
	writeItemsHeader(535)

	y := 505
	writeItemLine := func(x int, line string) {
		if y < 115 {
			pages = append(pages, bytes.Clone(stream.Bytes()))
			stream.Reset()
			fmt.Fprintf(&stream, "BT\n/F1 12 Tf\n50 730 Td\n(Invoice %s continued) Tj\nET\n", sanitizePDFText(ord.ID))
			writeItemsHeader(700)
			y = 670
		}
		fmt.Fprintf(&stream, "BT\n/F1 10 Tf\n%d %d Td\n(%s) Tj\nET\n", x, y, sanitizePDFText(line))
		y -= 18
	}
	for _, item := range ord.Items {
		subtotal := float64(item.Quantity) * item.Price
		writeItemLine(50, fmt.Sprintf("%-38s x%-4d    Rs. %-10.2f  Rs. %.2f", item.Name, item.Quantity, item.Price, subtotal))
		if item.Box != nil {
			for _, laddu := range item.Box.Items {
				writeItemLine(65, fmt.Sprintf("%d x %s per box", laddu.Quantity, laddu.Name))
			}
		}
	}

	// Total Amount
	stream.WriteString(fmt.Sprintf("BT\n/F1 14 Tf\n50 %d Td\n(Total Amount: Rs. %.2f) Tj\nET\n", y-20, ord.TotalAmount))
	stream.WriteString(fmt.Sprintf("BT\n/F1 9 Tf\n50 %d Td\n(Thank you for ordering with Laddu Zabardast! For questions, contact support@ladduzabardast.com) Tj\nET\n", y-50))

	pages = append(pages, stream.Bytes())

	var pdf bytes.Buffer
	pdf.WriteString("%PDF-1.4\n")
	offsets := make([]int, 4+2*len(pages))
	writeObject := func(id int, format string, args ...any) {
		offsets[id] = pdf.Len()
		fmt.Fprintf(&pdf, "%d 0 obj\n", id)
		fmt.Fprintf(&pdf, format, args...)
		pdf.WriteString("\nendobj\n")
	}

	var kids strings.Builder
	for i := range pages {
		fmt.Fprintf(&kids, "%d 0 R ", 4+2*i)
	}
	writeObject(1, "<< /Type /Catalog /Pages 2 0 R >>")
	writeObject(2, "<< /Type /Pages /Kids [%s] /Count %d >>", kids.String(), len(pages))
	writeObject(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
	for i, page := range pages {
		id := 4 + 2*i
		writeObject(id, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents %d 0 R >>", id+1)
		writeObject(id+1, "<< /Length %d >>\nstream\n%sendstream", len(page), page)
	}

	xrefOffset := pdf.Len()
	fmt.Fprintf(&pdf, "xref\n0 %d\n0000000000 65535 f \n", len(offsets))
	for _, offset := range offsets[1:] {
		fmt.Fprintf(&pdf, "%010d 00000 n \n", offset)
	}
	fmt.Fprintf(&pdf, "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", len(offsets), xrefOffset)
	return pdf.Bytes()
}
