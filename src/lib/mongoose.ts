//src/lib/mongoose.ts
import mongoose from 'mongoose';

export const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined.");
  }

  if (mongoose.connection.readyState >= 1) return;

  try {    await mongoose.connect(mongoUri, {
      tls: true, // Use TLS instead of ssl
      connectTimeoutMS: 5000, // 5 second connection timeout
      socketTimeoutMS: 5000, // 5 second socket timeout
      serverSelectionTimeoutMS: 5000, // 5 second server selection timeout
      heartbeatFrequencyMS: 2000, // More frequent heartbeats
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
    });

    // Keep this log for connection status
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    // Keep this log for connection errors
    console.error("❌ Error connecting to MongoDB:", error);
  }
};
