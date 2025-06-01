// src/model/Review.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  pinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
