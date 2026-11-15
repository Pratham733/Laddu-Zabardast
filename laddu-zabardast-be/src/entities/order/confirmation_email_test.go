package order

import (
	"bytes"
	"io"
	"mime/quotedprintable"
	"net/mail"
	"strings"
	"testing"

	"github.com/Pratham733/laddu-zabardast-be/src/entities/box"
)

func TestCheckoutInstructionsOptional(t *testing.T) {
	req := CreateOrderRequestPacket{
		ShippingDetails: ShippingDetailsPacket{Name: "Customer", Email: "customer@example.test", City: "Pune"},
		Items:           []OrderItemPacket{{ProductID: "besan", Quantity: 1}},
		TotalAmount:     120,
	}
	for _, instructions := range []string{"", strings.Repeat("🍬", 500)} {
		req.Instructions = instructions
		if err := validateCreateOrderReq(req); err != nil {
			t.Fatalf("valid optional instructions rejected: %v", err)
		}
	}
	req.Instructions = strings.Repeat("🍬", 501)
	if err := validateCreateOrderReq(req); err == nil {
		t.Fatal("overlong instructions accepted")
	}
}

func TestConfirmationMessageIncludesInstructionsAndBoxContents(t *testing.T) {
	ord := Order{
		ID: "fixture-order", PaymentMethod: "cod", PaymentStatus: "pending", TotalAmount: 1080,
		Instructions:    "Wrap separately.\nGift message: नमस्ते",
		ShippingDetails: ShippingDetails{Name: "Customer", Address: "Fixture Lane"},
		Items: []OrderItem{{
			Name: "Custom Laddu Box (9)", Quantity: 1, Price: 1080,
			Box: &box.Selection{Size: 9, Items: []box.Component{{Name: "Besan Laddu", Quantity: 9}}},
		}},
	}
	for _, kind := range []string{"customer", "admin"} {
		t.Run(kind, func(t *testing.T) {
			recipient := kind + "@example.test"
			subject, body := confirmationMessage(ord, confirmationEmail{Kind: kind, To: recipient})
			message, err := mail.ReadMessage(bytes.NewReader(formatMessage("orders@example.test", recipient, "fixture@example.test", subject, body)))
			if err != nil {
				t.Fatal(err)
			}
			addresses, err := message.Header.AddressList("To")
			if err != nil || len(addresses) != 1 || addresses[0].Address != recipient {
				t.Fatalf("expected one recipient %s, got %v, %v", recipient, addresses, err)
			}
			decoded, err := io.ReadAll(quotedprintable.NewReader(message.Body))
			if err != nil {
				t.Fatal(err)
			}
			for _, content := range []string{"fixture-order", "9 x Besan Laddu per box", "Cash on delivery", "Gift message: नमस्ते"} {
				if !bytes.Contains(decoded, []byte(content)) {
					t.Errorf("message omitted %q", content)
				}
			}
			if got := bytes.Contains(decoded, []byte("Fixture Lane")); got != (kind == "admin") {
				t.Errorf("shipping address present = %t for %s", got, kind)
			}
		})
	}
}
