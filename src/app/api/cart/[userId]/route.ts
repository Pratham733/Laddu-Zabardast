// src/app/api/cart/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Cart from '@/models/cart';
import { connectToDatabase } from '@/lib/mongoose';
import mongoose, { Document } from 'mongoose';
import type { Product } from '@/types/product';
import type { CartParams, RouteParams } from '@/types/api';

// Import Product mongoose model
import ProductModel from '@/model/Product';

interface CartItem {
  productId: string;
  quantity: number;
}

interface CartItemWithDetails {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  aiHint: string;
  quantity: number;
}

interface MongoProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: 'laddu' | 'pickle';
  aiHint?: string;
  available?: boolean;
}

export async function GET(req: NextRequest, context: RouteParams<CartParams>) {
  try {
    await connectToDatabase();
    
    // Get and validate userId from params
    const params = await context.params;
    const validatedUserId = params.userId;

    if (!validatedUserId || validatedUserId.trim() === '') {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Verify MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(validatedUserId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    const cart = await Cart.findOne({ userId: validatedUserId }).maxTimeMS(5000);

  if (!cart || !cart.items || cart.items.length === 0) {
    return NextResponse.json({ items: [] });  }  

  // Convert productIds to mongoose ObjectIds
  const productIds = cart.items.map((item: CartItem) => new mongoose.Types.ObjectId(item.productId));

  // Fetch products and convert to Product type
  const rawProducts = await ProductModel.find({ _id: { $in: productIds } }).lean();
  const products: Product[] = (rawProducts as unknown as MongoProduct[]).map(p => ({
    id: p._id.toString(),
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.imageUrl,
    category: p.category,
    aiHint: p.aiHint,
    available: p.available
  }));

  // Map product details to cart items with quantity
  const itemsWithDetails = cart.items
    .map((item: CartItem) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        aiHint: product.aiHint,
        quantity: item.quantity,
      };
    })
    .filter((item: unknown): item is CartItemWithDetails => item !== null);
  return NextResponse.json({ items: itemsWithDetails });
  } catch (error: any) {
    console.error('[Cart API Error]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: RouteParams<CartParams>) {
  try {
    await connectToDatabase();
    
    // Get and validate userId from params
    const params = await context.params;
    const validatedUserId = params.userId;

    if (!validatedUserId || validatedUserId.trim() === '') {
      return NextResponse.json({ error: "User ID is required and must be valid" }, { status: 400 });
    }

    // Verify MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(validatedUserId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

  // Validate body.items exists and is an array
  if (!body.items || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Items array is required" }, { status: 400 });
  }
  const cart = await Cart.findOneAndUpdate(
    { userId: validatedUserId },
    { userId: validatedUserId, items: body.items },
    { upsert: true, new: true }
  );    return NextResponse.json(cart);
  } catch (error: any) {
    console.error('[Cart API Error]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
