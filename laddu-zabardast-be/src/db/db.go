package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

var Client *mongo.Client

// Connect establishes a connection to MongoDB Atlas using the provided URI.
func Connect(uri string) (*mongo.Client, error) {
	if uri == "" {
		return nil, fmt.Errorf("mongodb URI is empty")
	}

	// Use the SetServerAPIOptions() method to set the version of the Stable API on the client
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(uri).SetServerAPIOptions(serverAPI)

	// Create a new client and connect to the server
	client, err := mongo.Connect(opts)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Send a ping to confirm a successful connection
	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		client.Disconnect(ctx)
		return nil, err
	}

	Client = client
	fmt.Println("Pinged your deployment. You successfully connected to MongoDB!")
	return client, nil
}

// GetCollection returns a handle to the specified collection in the database.
func GetCollection(dbName, colName string) *mongo.Collection {
	if Client == nil {
		log.Fatal("Database client is not initialized. Call Connect first.")
	}
	return Client.Database(dbName).Collection(colName)
}
