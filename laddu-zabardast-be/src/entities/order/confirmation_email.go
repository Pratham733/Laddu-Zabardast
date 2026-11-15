package order

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type confirmationEmail struct {
	Kind          string     `bson:"kind"`
	To            string     `bson:"to"`
	NextAttemptAt *time.Time `bson:"nextAttemptAt,omitempty"`
	Lease         string     `bson:"lease,omitempty"`
	Attempts      int        `bson:"attempts,omitempty"`
	SentAt        *time.Time `bson:"sentAt,omitempty"`
}

func StartConfirmationEmails(ctx context.Context) error {
	settings, err := loadSMTPSettings()
	if err != nil {
		return err
	}
	if settings == nil {
		log.Print("Order confirmation email is disabled. Set ORDER_SMTP_HOST or configure the local SMTP settings file to enable delivery.")
		return nil
	}
	indexCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	_, err = getCollection().Indexes().CreateOne(indexCtx, mongo.IndexModel{
		Keys:    bson.D{{Key: "confirmationEmails.nextAttemptAt", Value: 1}},
		Options: options.Index().SetSparse(true).SetName("order_confirmation_queue"),
	})
	if err != nil {
		return fmt.Errorf("initialize order email queue: %w", err)
	}
	go runConfirmationEmails(ctx, settings)
	return nil
}

func newConfirmationEmails(customer string, now time.Time) []confirmationEmail {
	admin := orderAdminEmail()
	if !isMailbox(admin) {
		return nil
	}
	return []confirmationEmail{
		{Kind: "customer", To: customer, NextAttemptAt: &now},
		{Kind: "admin", To: admin, NextAttemptAt: &now},
	}
}

func runConfirmationEmails(ctx context.Context, settings *smtpSettings) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for ctx.Err() == nil {
		delivered, err := sendNextConfirmation(ctx, settings)
		if err != nil {
			log.Printf("Order email queue: %v", err)
		}
		if delivered && err == nil {
			continue
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func sendNextConfirmation(ctx context.Context, settings *smtpSettings) (bool, error) {
	col := getCollection()
	lease := uuid.NewString()
	claimCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	now := time.Now().UTC()
	var ord Order
	err := col.FindOneAndUpdate(claimCtx,
		bson.M{"confirmationEmails.nextAttemptAt": bson.M{"$lte": now}},
		bson.M{
			"$set": bson.M{"confirmationEmails.$.nextAttemptAt": now.Add(time.Minute), "confirmationEmails.$.lease": lease},
			"$inc": bson.M{"confirmationEmails.$.attempts": 1},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&ord)
	if err == mongo.ErrNoDocuments {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	for _, notice := range ord.ConfirmationEmails {
		if notice.Lease != lease {
			continue
		}
		subject, body := confirmationMessage(ord, notice)
		messageID := fmt.Sprintf("%s.%s@%s", ord.ID, notice.Kind, settings.senderDomain)
		sendErr := settings.send(ctx, notice.To, messageID, subject, body)

		markCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		updates := bson.M{"$unset": bson.M{"confirmationEmails.$.lease": ""}}
		if sendErr == nil {
			updates["$set"] = bson.M{"confirmationEmails.$.sentAt": time.Now().UTC()}
			updates["$unset"].(bson.M)["confirmationEmails.$.nextAttemptAt"] = ""
		} else {
			delay := time.Duration(1<<min(max(0, notice.Attempts-1), 7)) * 30 * time.Second
			updates["$set"] = bson.M{"confirmationEmails.$.nextAttemptAt": time.Now().UTC().Add(delay)}
		}
		_, markErr := col.UpdateOne(markCtx, bson.M{"_id": ord.ID, "confirmationEmails.lease": lease}, updates)
		if markErr != nil {
			return false, markErr
		}
		if sendErr != nil {
			return false, fmt.Errorf("%s confirmation for order %s failed (%T); retry scheduled", notice.Kind, ord.ID, sendErr)
		}
		return true, nil
	}
	return false, fmt.Errorf("order %s confirmation lease was missing", ord.ID)
}

func confirmationMessage(ord Order, notice confirmationEmail) (string, string) {
	var body strings.Builder
	subject := "Laddu Zabardast order confirmed"
	if notice.Kind == "admin" {
		subject = "New Laddu Zabardast order"
		shipping := ord.ShippingDetails
		address := shipping.Address
		if address == "" {
			address = shipping.Street
		}
		fmt.Fprintf(&body, "Customer: %s\nEmail: %s\nPhone: %s\nShip to: %s, %s %s, %s\n\n",
			shipping.Name, shipping.Email, shipping.Phone, address, shipping.City, shipping.PostalCode, shipping.Country)
	} else {
		fmt.Fprintf(&body, "Hi %s,\n\nThanks for your order. We’ll get it ready for you.\n\n", ord.ShippingDetails.Name)
	}
	fmt.Fprintf(&body, "Order: %s\n\n", ord.ID)
	for _, item := range ord.Items {
		fmt.Fprintf(&body, "%d x %s - INR %.2f\n", item.Quantity, item.Name, float64(item.Quantity)*item.Price)
		if item.Box != nil {
			for _, laddu := range item.Box.Items {
				fmt.Fprintf(&body, "  %d x %s per box\n", laddu.Quantity, laddu.Name)
			}
		}
	}
	method := ord.PaymentMethod
	if method == "cod" || method == "cash" {
		method = "Cash on delivery"
	}
	fmt.Fprintf(&body, "\nTotal: INR %.2f\nPayment method: %s\nPayment status: %s\n", ord.TotalAmount, method, ord.PaymentStatus)
	if ord.Instructions != "" {
		fmt.Fprintf(&body, "\nOrder instructions:\n%s\n", ord.Instructions)
	}
	return subject + " – " + ord.ID, body.String()
}
