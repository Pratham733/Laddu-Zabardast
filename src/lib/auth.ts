
// src/lib/auth.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { compare } from "bcryptjs";
import { MongoClient } from "mongodb";
import { JWT } from "next-auth/jwt";
import { Session, User } from "next-auth";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const client: MongoClient = await clientPromise;
          const db = client.db(process.env.MONGODB_DB_NAME);
          const user = await db.collection("users").findOne({ email: credentials.email });

          if (!user) return null;

          const isValid = await compare(credentials.password, user.password);
          if (!isValid) return null;

          return {
            id: user._id.toString(),
            name: user.name || "",
            email: user.email,
            role: user.role || "user",
          } as User & { role: string };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User & { role?: string } }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
