import { NextRequest } from 'next/server';

// Define base params for Next.js API routes
export type RouteParams<T> = {
  params: T;
  req: NextRequest;
};

export type AddressParams = {
  index: string;
};

export type CartParams = {
  userId: string;
};

export type ProductParams = {
  productId: string;
};

export type ReviewParams = {
  reviewId: string;
};