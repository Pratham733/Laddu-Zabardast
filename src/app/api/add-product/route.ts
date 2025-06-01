//src/app/api/add-product/route.ts
import clientPromise from "@/lib/mongodb";
import { MongoClient } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { rateLimitApi } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  // Apply rate limiting
  try {
    const rateLimit = await rateLimitApi(req);
    if (!rateLimit.success) {
      console.warn(`[Add Product API] Rate limit exceeded for IP ${rateLimit.ip}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too many product creation attempts. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            'Retry-After': rateLimit.retryAfter?.toString() || '60',
            'Content-Type': 'application/json'
          } 
        }
      );
    }
  } catch (error) {
    console.error('[Add Product API] Rate limiting error:', error);
    // Continue processing if rate limiting fails
  }

  try {
    const client: MongoClient = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const product = await req.json();

    await db.collection("products").insertOne(product);

    return NextResponse.json({ message: "Product added successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);

    const products = await db.collection("products").find({}).toArray();

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }
    const update = await req.json();
    const result = await db.collection('products').updateOne(
      { _id: typeof id === 'string' ? new (await import('mongodb')).ObjectId(id) : id },
      { $set: update }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Product updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    const result = await db.collection('products').deleteOne({
      _id: typeof id === 'string' ? new (await import('mongodb')).ObjectId(id) : id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch updated products list after deletion
    const products = await db.collection("products").find({}).toArray();
    return NextResponse.json({ message: 'Product deleted successfully', products }, { status: 200 });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
