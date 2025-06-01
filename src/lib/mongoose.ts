//src/lib/mongoose.ts
import mongoose from 'mongoose';

export const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined.");
  }
  // Clean and validate MongoDB URI
  let cleanUri = mongoUri.trim();
  // Remove any surrounding quotes and comments
  cleanUri = cleanUri.replace(/^["']|["']$/g, '').split('#')[0].trim();
  
  try {
    const url = new URL(cleanUri);
    if (!url.protocol.match(/^mongodb(\+srv)?:$/)) {
      throw new Error('Invalid protocol');
    }
  } catch (error) {
    console.error('MongoDB URI Parse Error:', error);
    throw new Error('Invalid MongoDB URI format. Please check your connection string.');
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
    // Keep this log for connection errors    console.error("❌ Error connecting to MongoDB:", error);    throw error; // Re-throw the error to be handled by the API route
  }
};
