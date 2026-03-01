/**
 * In-memory data store — replaces DynamoDB for local development.
 * All data is reset when the server restarts.
 */
import { v4 as uuidv4 } from 'uuid';

// ── Types ────────────────────────────────────────────────────────────────────

export interface User {
  userId: string;
  email: string;
  password: string; // plain text for local dev only
  createdAt: string;
}

export interface Session {
  sessionId: string;
  userId: string;
  artStyleChoice: string;
  status: 'active' | 'completed' | 'expired';
  iterationCount: number;
  maxIterations: number;
  latestImageUrl: string | null;
  latestJobStatus: 'idle' | 'processing' | 'completed' | 'failed' | null;
  latestJobError: string | null;
  expiresAt: number;
  createdAt: string;
  messages: Message[];
}

export interface Message {
  messageId: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string | null;
  imageUrl: string | null;
  mythology: string | null;
  iterationNumber: number | null;
  createdAt: string;
}

export interface CartItem {
  itemId: string;
  userId: string;
  productId: string | null;
  sessionId: string | null;
  type: 'pre-designed' | 'custom';
  name: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  printPlacement: string | null;
  designImageUrl: string | null;
  imageUrl: string | null;
  addedAt: string;
}

export interface Order {
  orderId: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
}

export interface Product {
  productId: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  category: string;
  tags: string[];
  variants: Array<{ size: string; color: string; stockCount: number }>;
  createdAt: string;
}

// ── In-memory stores ─────────────────────────────────────────────────────────

const users = new Map<string, User>();        // email → User
const sessions = new Map<string, Session>();  // sessionId → Session
const carts = new Map<string, CartItem[]>();  // userId → CartItem[]
const orders = new Map<string, Order[]>();    // userId → Order[]
const products = new Map<string, Product>(); // productId → Product

// ── Seed a default local user (auto-login available) ─────────────────────────
const DEFAULT_USER: User = {
  userId: 'local-user-001',
  email: 'dev@epicweave.local',
  password: 'password123',
  createdAt: new Date().toISOString(),
};
users.set(DEFAULT_USER.email, DEFAULT_USER);

// ── Seed catalog products — IDs must match frontend/app/products/page.tsx ────
// The frontend hardcodes productId values like 'greek-1', 'hindu-2' etc.
// The local server must use the same IDs or cart adds will 404.
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const ALL_COLORS = [
  'White', 'Black', 'Navy', 'Royal Blue', 'Forest Green', 'Red',
  'Maroon', 'Purple', 'Charcoal', 'Orange', 'Pink', 'Teal',
  'Yellow', 'Sky Blue', 'Lavender', 'Olive',
];
const allVariants = ALL_SIZES.flatMap(size =>
  ALL_COLORS.map(color => ({ size, color, stockCount: 20 }))
);

const SAMPLE_PRODUCTS: Product[] = [
  {
    productId: 'greek-1',
    name: 'Zeus — God of Thunder',
    description: 'Zeus wielding his iconic thunderbolts atop Mount Olympus, rendered in bold modern art.',
    basePrice: 29.99,
    imageUrl: '/TestImg/Greek1.png',
    category: 'mythology',
    tags: ['greek', 'zeus', 'thunder', 'olympus'],
    variants: allVariants,
    createdAt: new Date().toISOString(),
  },
  {
    productId: 'greek-2',
    name: 'Athena — Goddess of Wisdom',
    description: 'Athena in full battle regalia, combining wisdom and war in a vibrant anime-inspired style.',
    basePrice: 29.99,
    imageUrl: '/TestImg/Greek2.png',
    category: 'mythology',
    tags: ['greek', 'athena', 'wisdom', 'warrior'],
    variants: allVariants,
    createdAt: new Date().toISOString(),
  },
  {
    productId: 'greek-3',
    name: 'Poseidon — Lord of the Seas',
    description: 'Poseidon commanding the ocean depths with his legendary trident.',
    basePrice: 29.99,
    imageUrl: '/TestImg/Greek3.png',
    category: 'mythology',
    tags: ['greek', 'poseidon', 'ocean', 'trident'],
    variants: allVariants,
    createdAt: new Date().toISOString(),
  },
  {
    productId: 'hindu-1',
    name: 'Shiva — The Destroyer',
    description: 'Lord Shiva in deep cosmic meditation, surrounded by flames and sacred energy.',
    basePrice: 29.99,
    imageUrl: '/TestImg/Hindu1.png',
    category: 'mythology',
    tags: ['hindu', 'shiva', 'meditation', 'cosmic'],
    variants: allVariants,
    createdAt: new Date().toISOString(),
  },
  {
    productId: 'hindu-2',
    name: 'Ganesha — Remover of Obstacles',
    description: 'Lord Ganesha bestowing blessings, beautifully illustrated in vibrant anime style.',
    basePrice: 29.99,
    imageUrl: '/TestImg/Hindu2.png',
    category: 'mythology',
    tags: ['hindu', 'ganesha', 'blessings', 'prosperity'],
    variants: allVariants,
    createdAt: new Date().toISOString(),
  },
  {
    productId: 'hindu-3',
    name: 'Durga — Goddess of Triumph',
    description: 'Goddess Durga in her triumphant form, radiating power and divine strength.',
    basePrice: 29.99,
    imageUrl: '/TestImg/Hindu3.png',
    category: 'mythology',
    tags: ['hindu', 'durga', 'power', 'triumph'],
    variants: allVariants,
    createdAt: new Date().toISOString(),
  },
];

SAMPLE_PRODUCTS.forEach(p => products.set(p.productId, p));

// ── User helpers ──────────────────────────────────────────────────────────────

export const db = {
  // Users
  getUserByEmail: (email: string) => users.get(email) ?? null,
  getUserById: (userId: string) => {
    for (const u of users.values()) if (u.userId === userId) return u;
    return null;
  },
  createUser: (email: string, password: string): User => {
    const user: User = { userId: uuidv4(), email, password, createdAt: new Date().toISOString() };
    users.set(email, user);
    return user;
  },

  // Sessions
  createSession: (userId: string, artStyleChoice: string): Session => {
    const session: Session = {
      sessionId: uuidv4(),
      userId,
      artStyleChoice,
      status: 'active',
      iterationCount: 0,
      maxIterations: 5,
      latestImageUrl: null,
      latestJobStatus: 'idle',
      latestJobError: null,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      createdAt: new Date().toISOString(),
      messages: [],
    };
    sessions.set(session.sessionId, session);
    return session;
  },
  getSession: (sessionId: string) => sessions.get(sessionId) ?? null,
  updateSession: (sessionId: string, patch: Partial<Session>) => {
    const s = sessions.get(sessionId);
    if (!s) return null;
    Object.assign(s, patch);
    return s;
  },
  addMessage: (sessionId: string, msg: Omit<Message, 'messageId' | 'sessionId' | 'createdAt'>): Message => {
    const s = sessions.get(sessionId)!;
    const message: Message = {
      ...msg,
      messageId: uuidv4(),
      sessionId,
      createdAt: new Date().toISOString(),
    };
    s.messages.push(message);
    return message;
  },

  // Cart
  getCart: (userId: string): CartItem[] => carts.get(userId) ?? [],
  addToCart: (userId: string, item: Omit<CartItem, 'itemId' | 'userId' | 'addedAt'>): CartItem => {
    const cart = carts.get(userId) ?? [];
    const newItem: CartItem = { ...item, itemId: uuidv4(), userId, addedAt: new Date().toISOString() };
    cart.push(newItem);
    carts.set(userId, cart);
    return newItem;
  },
  updateCartItem: (userId: string, itemId: string, quantity: number): CartItem | null => {
    const cart = carts.get(userId) ?? [];
    if (quantity === 0) {
      carts.set(userId, cart.filter(i => i.itemId !== itemId));
      return null;
    }
    const item = cart.find(i => i.itemId === itemId);
    if (!item) return null;
    item.quantity = quantity;
    return item;
  },
  removeCartItem: (userId: string, itemId: string) => {
    const cart = carts.get(userId) ?? [];
    carts.set(userId, cart.filter(i => i.itemId !== itemId));
  },
  clearCart: (userId: string) => carts.set(userId, []),

  // Orders
  createOrder: (userId: string, items: CartItem[], shippingAddress: Order['shippingAddress']): Order => {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    const shippingCost = Math.round((5.99 + Math.max(0, itemCount - 1) * 2) * 100) / 100;
    const order: Order = {
      orderId: `ORD-${uuidv4().slice(0, 8).toUpperCase()}`,
      userId, items, subtotal: Math.round(subtotal * 100) / 100,
      shippingCost, total: Math.round((subtotal + shippingCost) * 100) / 100,
      status: 'pending', shippingAddress, createdAt: new Date().toISOString(),
    };
    const userOrders = orders.get(userId) ?? [];
    userOrders.push(order);
    orders.set(userId, userOrders);
    return order;
  },
  getOrders: (userId: string) => orders.get(userId) ?? [],
  getOrder: (userId: string, orderId: string) =>
    (orders.get(userId) ?? []).find(o => o.orderId === orderId) ?? null,

  // Products
  listProducts: () => Array.from(products.values()),
  getProduct: (productId: string) => products.get(productId) ?? null,
};
