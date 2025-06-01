// src/app/api/products/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { MongoClient, ObjectId } from 'mongodb';
import { ProductParams, RouteParams } from '@/types/api';
import { Product } from '@/types/product';

// GET: Get a single product by id, _id, or name (case-insensitive)
export async function GET(req: NextRequest, { params }: RouteParams<ProductParams>) {
  const { productId } = params;
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

    let rawProduct = null;
    // Try by ObjectId
    if (ObjectId.isValid(productId)) {
      rawProduct = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    }
    // Try by string id
    if (!rawProduct) {
      rawProduct = await db.collection('products').findOne({ id: productId });
    }
    // Try by name (case-insensitive)
    if (!rawProduct) {
      rawProduct = await db.collection('products').findOne({ name: { $regex: `^${productId}$`, $options: 'i' } });
    }
    if (!rawProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    
    const product: Product = {
      id: rawProduct._id.toString(),
      _id: rawProduct._id.toString(),
      name: rawProduct.name,
      description: rawProduct.description,
      price: rawProduct.price,
      imageUrl: rawProduct.imageUrl,
      category: rawProduct.category,
      aiHint: rawProduct.aiHint,
      available: rawProduct.available
    };
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
