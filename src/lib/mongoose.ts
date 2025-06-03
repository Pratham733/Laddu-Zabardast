import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Ensure this is called only once in your application

export const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined.");
  }

  // Clean and validate MongoDB URI
  let cleanUri = mongoUri.trim();
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
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 60000,
      heartbeatFrequencyMS: 10000,
      maxPoolSize: 50,
      minPoolSize: 10,
      retryWrites: true,
      retryReads: true,
      w: 'majority',
    });

    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    throw error;
  }
};