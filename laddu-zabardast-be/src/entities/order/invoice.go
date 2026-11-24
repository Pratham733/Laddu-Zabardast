package order

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readconcern"
	"go.mongodb.org/mongo-driver/v2/mongo/writeconcern"
)

const maxDailyInvoiceSerial = 999999

// The store issues invoices on the Asia/Kolkata calendar, regardless of the host's time zone.
var invoiceZone = time.FixedZone("IST", 5*60*60+30*60)

type issuedInvoice struct {
	OrderID      string    `bson:"_id"`
	Day          string    `bson:"day"`
	Serial       int       `bson:"serial"`
	IssuedAt     time.Time `bson:"issuedAt"`
	CustomerName string    `bson:"customerName,omitempty"`
	TotalAmount  float64   `bson:"totalAmount,omitempty"`
	PDF          []byte    `bson:"pdf,omitempty"`
}

func (i issuedInvoice) number() string {
	return fmt.Sprintf("%s%06d", i.Day, i.Serial)
}

func invoiceCollection() *mongo.Collection {
	base := db.GetCollection(db.DefaultDB, "issuedInvoices")
	return base.Database().Collection(base.Name(), options.Collection().
		SetWriteConcern(writeconcern.Majority()).SetReadConcern(readconcern.Majority()))
}

func EnsureInvoiceIndex(ctx context.Context) error {
	_, err := invoiceCollection().Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "day", Value: 1}, {Key: "serial", Value: -1}},
		Options: options.Index().SetName("invoice_day_serial_unique").SetUnique(true),
	})
	return err
}

func issueInvoice(ctx context.Context, ord Order, clock func() time.Time) (issuedInvoice, error) {
	invoices := invoiceCollection()
	for {
		var existing issuedInvoice
		err := invoices.FindOne(ctx, bson.M{"_id": ord.ID}).Decode(&existing)
		if err == nil {
			return archiveLegacyInvoice(ctx, existing, ord)
		}
		if !errors.Is(err, mongo.ErrNoDocuments) {
			return issuedInvoice{}, err
		}

		now := clock()
		day := now.In(invoiceZone).Format("20060102")
		var latest issuedInvoice
		err = invoices.FindOne(ctx, bson.M{"day": day}, options.FindOne().SetProjection(bson.M{"serial": 1}).SetSort(bson.D{{Key: "serial", Value: -1}})).Decode(&latest)
		if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
			return issuedInvoice{}, err
		}
		if latest.Serial >= maxDailyInvoiceSerial {
			return issuedInvoice{}, errors.New("daily invoice sequence exhausted")
		}

		next := issuedInvoice{OrderID: ord.ID, Day: day, Serial: latest.Serial + 1, IssuedAt: now.UTC()}
		next.archive(ord)
		_, err = invoices.InsertOne(ctx, next)
		if err == nil {
			return next, nil
		}
		// One durable insert claims both the order and serial. A loser retries
		// against the winning write without consuming a number.
		if !mongo.IsDuplicateKeyError(err) {
			return issuedInvoice{}, err
		}
	}
}

func (i *issuedInvoice) archive(ord Order) {
	i.CustomerName = invoiceCustomerName(ord)
	i.TotalAmount = ord.TotalAmount
	i.PDF = generatePDFBytes(ord, *i)
}

func archiveLegacyInvoice(ctx context.Context, existing issuedInvoice, ord Order) (issuedInvoice, error) {
	if len(existing.PDF) > 0 {
		return existing, nil
	}
	existing.archive(ord)
	coll := invoiceCollection()
	result, err := coll.UpdateOne(ctx, bson.M{"_id": existing.OrderID, "pdf": bson.M{"$exists": false}}, bson.M{"$set": bson.M{
		"pdf": existing.PDF, "customerName": existing.CustomerName, "totalAmount": existing.TotalAmount,
	}})
	if err == nil && result.MatchedCount == 0 {
		// Another request archived the same invoice. Use those exact bytes for every copy.
		err = coll.FindOne(ctx, bson.M{"_id": existing.OrderID}).Decode(&existing)
	}
	return existing, err
}
