import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  imageUrl: string;
  aiHint?: string;
  available: boolean;  // Added available field
  // Add other fields as needed
}

const ProductSchema: Schema<IProduct> = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  aiHint: { type: String },
  available: { type: Boolean, default: true },  // Added available field with default true
  // Add other fields as needed
});

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
