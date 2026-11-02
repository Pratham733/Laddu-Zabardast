import type { Order, OrderItem, ShippingDetails, OrderHistory } from '../models/order';

export interface GetOrdersResponse {
  orders: Order[];
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

export interface OrderUpdateResponse {
  message: string;
}

export interface OrderDeleteResponse {
  message: string;
}

export interface OrderStatusResponse {
  message: string;
}
