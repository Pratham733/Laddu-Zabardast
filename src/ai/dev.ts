// Flows will be imported for their side effects in this file.
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function insertTestUser(client: MongoClient) {
  try {
    const dbName = process.env.MONGODB_DB_NAME || "ladduzabardast";
    const db = client.db(dbName);
    const users = db.collection("users");

    const sampleEmail = "test@example.com";
    const samplePassword = "password123";

    const userExists = await users.findOne({ email: sampleEmail });

    if (!userExists) {
      const hashedPassword = await bcrypt.hash(samplePassword, 10);
      await users.insertOne({
        email: sampleEmail,
        username: "Test User",
        password: hashedPassword,
        isAdmin: false,
        createdAt: new Date(),
      });
      console.log(`[Dev] Test user '${sampleEmail}' added.`);
    } else {
      console.log(`[Dev] Test user '${sampleEmail}' already exists.`);
    }
  } catch (err: any) {
    console.error("[Dev] Error inserting test user:", err.message);
  }
}
