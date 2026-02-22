// Common types for Lambda handlers

export interface APIResponse {
  statusCode: number;
  headers: {
    'Content-Type': string;
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Credentials': boolean;
  };
  body: string;
}

export interface User {
  userId: string;
  email: string;
  name?: string;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  productId: string;
  name: string;
  description: string;
  mythology: 'hindu' | 'greek';
  artStyle: 'modern' | 'anime';
  basePrice: number;
  imageUrl: string;
  category: string;
  createdAt: string;
}

export interface CartItem {
  itemId: string;
  userId: string;
  productId?: string;
  sessionId?: string;
  type: 'pre-designed' | 'custom';
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  printPlacement?: 'front' | 'back' | 'both';
  designImageUrl?: string;
}

export interface DesignSession {
  sessionId: string;
  userId: string;
  status: 'active' | 'completed' | 'expired';
  artStyleChoice: 'modern' | 'anime';
  iterationCount: number;
  maxIterations: number;
  expiresAt: number; // Unix timestamp for TTL
  createdAt: string;
}

export interface Order {
  orderId: string;
  userId: string;
  status: 'paid' | 'processing' | 'shipped' | 'delivered' | 'refunded';
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: Address;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export const SUCCESS_RESPONSE = (data: any): APIResponse => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(data),
});

export const ERROR_RESPONSE = (statusCode: number, message: string): APIResponse => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify({ error: message }),
});
