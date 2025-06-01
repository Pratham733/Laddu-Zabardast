// backend/model/Order.ts
import mongoose, { Document, Model, Schema } from "mongoose";

interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
}

interface IShippingDetails {
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  shippingDetails: IShippingDetails;
  items: IOrderItem[];
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  orderStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shippingDetails: {
      email: { type: String, required: true },
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        imageUrl: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, default: "pending" },
    paymentMethod: { type: String, required: true },
    orderStatus: { type: String, default: "processing" },
  },
  { timestamps: true }
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export default Order;
