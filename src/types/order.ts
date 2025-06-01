// src/types/order.ts

export interface OrderItem {
  id?: string; 
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface ShippingDetails {
  name: string;
  email: string;
  address: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  // ✅ Add these
  streetAddress: string; // ✅ Add this
  postalCode: string;   // ✅ Add this
  country: string;      // ✅ Add this
}


export interface Order {
  _id?: string;
  userId: string;
  items: OrderItem[];
  shippingDetails: ShippingDetails;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'completed';
  paymentMethod: 'cod' | 'card' | 'upi' | 'cash';
  orderStatus: 'processing' | 'shipped' | 'delivered';
  createdAt?: string;
}


export interface SimplifiedOrder {
  id: string;
  date: string;
  // total: number;
  totalAmount: number
  status: string;
  items: number;
}
export interface OrderConfirmation {
  orderId: string;
  items: OrderItem[];
  total: number;

  shippingDetails: ShippingDetails;
}
export interface OrderHistory {
  id: string;
  date: string;
  total: number;
  status: string;
  items: OrderItem[];
}
export interface OrderHistoryResponse {
  orders: OrderHistory[];
}
export interface OrderConfirmationResponse {
  orderId: string;
  items: OrderItem[];
  total: number;
  shippingDetails: ShippingDetails;
}
export interface OrderDetailsResponse {
  order: Order;
}
export interface OrderErrorResponse {
  error: string;
}
export interface OrderSuccessResponse {
  message: string;
}
export interface OrderCreateResponse {
  orderId: string;
}
export interface OrderCreateErrorResponse {
  error: string;
}
export interface OrderCreateSuccessResponse {
  message: string;
  orderId: string;
}
export interface OrderUpdateResponse {
  message: string;
}
export interface OrderUpdateErrorResponse {
  error: string;
}
export interface OrderUpdateSuccessResponse {
  message: string;
}

export interface OrderDeleteResponse {
  message: string;
}

export interface OrderDeleteErrorResponse {
  error: string;
}
export interface OrderDeleteSuccessResponse {
  message: string;
}

export interface OrderStatusUpdateResponse {
  message: string;
}
export interface OrderStatusUpdateErrorResponse {
  error: string;
}
export interface OrderStatusUpdateSuccessResponse {
  message: string;
}
export interface OrderStatus {
  orderId: string;
  status: 'processing' | 'shipped' | 'delivered';
}
export interface OrderStatusResponse {
  message: string;
}
export interface OrderStatusErrorResponse {
  error: string;
}
export interface OrderStatusSuccessResponse {
  message: string;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: 'processing' | 'shipped' | 'delivered';
}
export interface OrderStatusUpdateResponse {
  message: string;
}
