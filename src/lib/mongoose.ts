//src/lib/mongoose.ts
import mongoose from 'mongoose';

export const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined.");
  }

  if (mongoose.connection.readyState >= 1) return;  try {    await mongoose.connect(mongoUri, {
      tls: true,
      connectTimeoutMS: 60000, // 60 second connection timeout
      socketTimeoutMS: 60000, // 60 second socket timeout
      serverSelectionTimeoutMS: 60000, // 60 second server selection timeout
      heartbeatFrequencyMS: 10000, // Reduced heartbeat frequency
      maxPoolSize: 50, // Increased from default
      minPoolSize: 10, // Increased from default
      retryWrites: true,
      retryReads: true,
      w: 'majority', // Ensure write consistency
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
