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
  streetAddress: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id?: string;
  _id?: string;
  userId?: string;
  email?: string;
  items: OrderItem[];
  shippingDetails: ShippingDetails;
  totalAmount: number;
  paymentStatus: any;
  paymentMethod?: 'cod' | 'card' | 'upi' | 'cash';
  orderStatus?: any;
  status?: string;
  date?: string;
  createdAt?: string;
}

export interface PaymentStatus {
  status: 'pending' | 'paid' | 'failed' | 'completed';
  message: string;
}

export interface OrderStatus {
  status: 'processing' | 'shipped' | 'delivered';
  message: string;
}

export interface SimplifiedOrder {
  id: string;
  date: string;
  totalAmount: number;
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

export interface OrderDetails {
  orderId: string;
  orderStatus: OrderStatus;
}

export interface OrderStatusUpdate {
  orderId: string;
  orderStatus: OrderStatus;
}
