//src/lib/mongodb.ts
import { MongoClient, type MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MONGODB_URI to your environment variables');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  ssl: true,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  keepAlive: true,
  heartbeatFrequencyMS: 2000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    console.log("[MongoDB Lib] Creating new MongoDB client connection (development)...");
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().then(async (client) => {
      console.log("[MongoDB Lib] Connected to MongoDB (development)");
      const { insertTestUser } = await import('@/ai/dev');
      await insertTestUser(client);
      return client;
    });
  } else {
    // console.log("[MongoDB Lib] Reusing existing MongoDB client connection (development).");
    global._mongoClientPromise.then(async (client) => {
      const { insertTestUser } = await import('@/ai/dev');
      await insertTestUser(client);
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  console.log("[MongoDB Lib] Creating new MongoDB client connection (production)...");
  client = new MongoClient(uri, options);
  clientPromise = client.connect().then((client) => {
    console.log("[MongoDB Lib] Connected to MongoDB (production)");
    return client;
  });
}

export default clientPromise;
