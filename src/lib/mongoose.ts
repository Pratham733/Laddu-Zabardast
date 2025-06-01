//src/lib/mongoose.ts
import mongoose from 'mongoose';

export const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined.");
  }

  // Clean and validate MongoDB URI
  const cleanUri = mongoUri.trim().replace(/^["']|["']$/g, '');
  if (!cleanUri.startsWith('mongodb://') && !cleanUri.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MongoDB URI format. Must start with mongodb:// or mongodb+srv://');
  }

  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(cleanUri, {
      tls: true,
      connectTimeoutMS: 60000, // 60 second connection timeout
      socketTimeoutMS: 60000, // 60 second socket timeout
      serverSelectionTimeoutMS: 60000, // 60 second server selection timeout
      heartbeatFrequencyMS: 10000, // Reduced heartbeat frequency      maxPoolSize: 50, // Increased from default
      minPoolSize: 10, // Increased from default
      retryWrites: true,
      retryReads: true,
      w: 'majority', // Ensure write consistency
    });

    // Keep this log for connection status
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    // Keep this log for connection errors    console.error("❌ Error connecting to MongoDB:", error);
    throw error; // Re-throw the error to be handled by the API route
  }
}
};
