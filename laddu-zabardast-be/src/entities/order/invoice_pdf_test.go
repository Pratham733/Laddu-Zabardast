package order

import (
	"bytes"
	"compress/zlib"
	"io"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/Pratham733/laddu-zabardast-be/src/entities/box"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
)

func TestInvoiceDateAndNumber(t *testing.T) {
	before := time.Date(2026, 11, 18, 18, 29, 59, 0, time.UTC)
	after := before.Add(time.Second)
	for _, test := range []struct {
		issued time.Time
		serial int
		want   string
	}{{before, 42, "20261118000042"}, {after, 1, "20261119000001"}} {
		invoice := issuedInvoice{Day: test.issued.In(invoiceZone).Format("20060102"), Serial: test.serial, IssuedAt: test.issued}
		if got := invoice.number(); got != test.want {
			t.Fatalf("invoice number %s, want %s", got, test.want)
		}
	}
}

func TestInvoicePDFLongOrder(t *testing.T) {
	invoice := issuedInvoice{Day: "20261119", Serial: 1, IssuedAt: time.Date(2026, 11, 19, 0, 0, 0, 0, time.UTC)}
	ord := Order{
		ID:              "example-order",
		ShippingDetails: ShippingDetails{Name: "Júlia (test)", Address: strings.Repeat("Meadow View ", 25)},
		PaymentMethod:   "cod", PaymentStatus: "pending", TotalAmount: 8324.60,
		Items: []OrderItem{
			{Name: "Besan Laddu", Sweetener: product.Honey, Quantity: 2, Price: 100},
			{Name: "Custom Laddu Box", Quantity: 1, Price: 500, Box: &box.Selection{
				Size: 9, Items: []box.Component{{Name: "Coconut Laddu", Quantity: 9}},
			}},
		},
	}
	for i := 0; i < 85; i++ {
		ord.Items = append(ord.Items, OrderItem{Name: strings.Repeat("W", 70), Quantity: 1, Price: 82})
	}
	pdf := generatePDFBytes(ord, invoice)
	if !bytes.HasPrefix(pdf, []byte("%PDF-1.4")) || len(pdf) > 45_000 {
		t.Fatalf("expected a compact PDF, got %d bytes", len(pdf))
	}
	var text bytes.Buffer
	for _, header := range regexp.MustCompile(`<< /Filter /FlateDecode /Length [0-9]+ >>
stream
`).FindAllIndex(pdf, -1) {
		decoded, err := zlib.NewReader(bytes.NewReader(pdf[header[1]:]))
		if err != nil {
			t.Fatal(err)
		}
		_, err = io.Copy(&text, decoded)
		_ = decoded.Close()
		if err != nil {
			t.Fatal(err)
		}
	}
	for _, marker := range []string{"20261119000001", `J\372lia \(test\)`, "Honey", "9 x Coconut Laddu per box", "Cash on delivery", "8,324.60", "Page 2 of"} {
		if !bytes.Contains(text.Bytes(), []byte(marker)) {
			t.Errorf("PDF is missing %q", marker)
		}
	}
	if bytes.Count(text.Bytes(), []byte("(Description of Goods / Services)")) < 2 {
		t.Error("no repeated item header on later pages")
	}
}
