// src/models/cart.ts
import mongoose, { Schema, Document } from 'mongoose';

interface ICart extends Document {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

const CartSchema: Schema<ICart> = new Schema(
  {
    userId: { type: String, required: true },
    items: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Cart = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);

export default Cart;
