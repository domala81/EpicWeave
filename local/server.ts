/**
 * EpicWeave — Local Development API Server
 *
 * Runs on http://localhost:3001
 * Replaces AWS API Gateway + Lambda + DynamoDB + Cognito + SQS for local dev.
 * - Auth  : simple base64 token (no Cognito)
 * - DB    : in-memory (no DynamoDB)
 * - Images: DALL-E via OpenAI SDK directly (no SQS worker)
 * - Fee   : always bypassed (no Stripe)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
// Load .env.local from the project root (parent of local/)
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env.local') });
dotenv.config({ path: path.join(rootDir, '.env') });
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

import { db } from './db';
import { requireAuth, optionalAuth, makeToken, AuthenticatedRequest } from './auth';
import { validateAndEnhancePrompt, generateDesignImage } from './openai';

const app = express();
const PORT = parseInt(process.env.LOCAL_API_PORT ?? '3001', 10);

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'local', timestamp: new Date().toISOString() });
});

// =============================================================================
// AUTH — /auth/register, /auth/login, /auth/me
// =============================================================================

app.post('/auth/register', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  if (db.getUserByEmail(email)) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const user = db.createUser(email, password);
  const token = makeToken(user.userId, user.email);
  res.status(201).json({ token, userId: user.userId, email: user.email });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  const user = db.getUserByEmail(email);
  if (!user || user.password !== password) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const token = makeToken(user.userId, user.email);
  res.json({ token, userId: user.userId, email: user.email });
});

app.get('/auth/me', requireAuth as express.RequestHandler, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  res.json({ userId: authReq.userId, email: authReq.userEmail });
});

// =============================================================================
// PRODUCTS — /products, /products/:productId
// =============================================================================

app.get('/products', optionalAuth as express.RequestHandler, (_req, res) => {
  const products = db.listProducts();
  res.json({ products, total: products.length });
});

app.get('/products/:productId', optionalAuth as express.RequestHandler, (req, res) => {
  const product = db.getProduct(req.params.productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json({ product });
});

// =============================================================================
// AI DESIGN SESSIONS
// =============================================================================

// POST /sessions/create
app.post('/sessions/create', requireAuth as express.RequestHandler, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { artStyleChoice } = req.body as { artStyleChoice?: string };

  if (!artStyleChoice) {
    res.status(400).json({ error: 'artStyleChoice is required' });
    return;
  }

  // Fee is ALWAYS bypassed in local mode — no Stripe
  const session = db.createSession(authReq.userId!, artStyleChoice);

  res.status(201).json({
    sessionId: session.sessionId,
    status: session.status,
    artStyleChoice: session.artStyleChoice,
    iterationCount: session.iterationCount,
    maxIterations: session.maxIterations,
    expiresAt: session.expiresAt,
    paymentBypassed: true,
  });
});

// GET /sessions/:sessionId/status
app.get('/sessions/:sessionId/status', requireAuth as express.RequestHandler, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const session = db.getSession(req.params.sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  if (session.userId !== authReq.userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  // Auto-expire
  if (session.status === 'active' && Date.now() > session.expiresAt) {
    db.updateSession(session.sessionId, { status: 'expired' });
    session.status = 'expired';
  }

  res.json(session);
});

// POST /sessions/:sessionId/generate  ← calls DALL-E synchronously
app.post('/sessions/:sessionId/generate', requireAuth as express.RequestHandler, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const session = db.getSession(req.params.sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  if (session.userId !== authReq.userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  if (session.status !== 'active') {
    res.status(400).json({ error: `Session is ${session.status}` });
    return;
  }
  if (Date.now() > session.expiresAt) {
    db.updateSession(session.sessionId, { status: 'expired' });
    res.status(400).json({ error: 'Session has expired' });
    return;
  }
  if (session.iterationCount >= session.maxIterations) {
    res.status(400).json({ error: 'Maximum iterations reached' });
    return;
  }
  if (session.latestJobStatus === 'processing') {
    res.status(400).json({ error: 'A generation is already in progress' });
    return;
  }

  const { prompt } = req.body as { prompt?: string };
  if (!prompt?.trim()) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  // Validate + enhance prompt (same rules as Lambda)
  const validation = validateAndEnhancePrompt(prompt.trim(), session.artStyleChoice as 'modern' | 'anime');
  if (!validation.valid) {
    res.status(400).json({ error: validation.reason });
    return;
  }

  // Add user message
  const newIterationCount = session.iterationCount + 1;
  const userMsg = db.addMessage(session.sessionId, {
    role: 'user',
    content: prompt.trim(),
    imageUrl: null,
    mythology: validation.detectedMythology ?? null,
    iterationNumber: newIterationCount,
  });

  // Mark processing
  db.updateSession(session.sessionId, {
    iterationCount: newIterationCount,
    latestJobStatus: 'processing',
    latestJobError: null,
  });

  // Acknowledge immediately — generation happens async in background
  res.json({
    messageId: userMsg.messageId,
    iterationCount: newIterationCount,
    message: 'Generation started',
  });

  // Generate image in background (no blocking the response)
  setImmediate(async () => {
    try {
      console.log(`[OpenAI] Generating image for session ${session.sessionId}, prompt: "${prompt.trim()}"`);
      const imageUrl = await generateDesignImage(validation.enhancedPrompt!);

      // Add assistant message with image
      db.addMessage(session.sessionId, {
        role: 'assistant',
        content: null,
        imageUrl,
        mythology: validation.detectedMythology ?? null,
        iterationNumber: newIterationCount,
      });

      db.updateSession(session.sessionId, {
        latestImageUrl: imageUrl,
        latestJobStatus: 'completed',
        latestJobError: null,
        status: newIterationCount >= session.maxIterations ? 'completed' : 'active',
      });

      console.log(`[OpenAI] ✅ Image generated for session ${session.sessionId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      console.error(`[OpenAI] ❌ Generation failed for session ${session.sessionId}:`, msg);
      db.updateSession(session.sessionId, {
        latestJobStatus: 'failed',
        latestJobError: msg,
      });
    }
  });
});

// =============================================================================
// CART — /cart, /cart/items, /cart/custom-items
// =============================================================================

app.get('/cart', requireAuth as express.RequestHandler, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const items = db.getCart(authReq.userId!);
  const subtotal = Math.round(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) * 100) / 100;
  res.json({ items, subtotal, itemCount: items.length });
});

app.post('/cart/items', requireAuth as express.RequestHandler, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { productId, size, color, quantity = 1, printPlacement } = req.body as {
    productId?: string; size?: string; color?: string; quantity?: number; printPlacement?: string;
  };

  if (!productId || !size || !color) {
    res.status(400).json({ error: 'productId, size, and color are required' });
    return;
  }

  const product = db.getProduct(productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const variant = product.variants.find(v => v.size === size && v.color === color);
  if (!variant || variant.stockCount < 1) {
    res.status(400).json({ error: 'Selected variant is out of stock' });
    return;
  }

  const item = db.addToCart(authReq.userId!, {
    productId, sessionId: null, type: 'pre-designed',
    name: product.name, size, color, quantity,
    unitPrice: product.basePrice,
    printPlacement: printPlacement ?? 'front',
    designImageUrl: null, imageUrl: product.imageUrl,
  });

  res.status(201).json({ item });
});

app.post('/cart/custom-items', requireAuth as express.RequestHandler, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { sessionId, designImageUrl, size, color, printPlacement, name, unitPrice } = req.body as {
    sessionId?: string; designImageUrl?: string; size?: string; color?: string;
    printPlacement?: string; name?: string; unitPrice?: number;
  };

  if (!sessionId || !designImageUrl || !size || !color) {
    res.status(400).json({ error: 'sessionId, designImageUrl, size, and color are required' });
    return;
  }

  const item = db.addToCart(authReq.userId!, {
    productId: null, sessionId, type: 'custom',
    name: name ?? 'Custom AI Design', size, color, quantity: 1,
    unitPrice: unitPrice ?? 29.99,
    printPlacement: printPlacement ?? 'front',
    designImageUrl, imageUrl: designImageUrl,
  });

  res.status(201).json({ item });
});

app.patch('/cart/items/:itemId', requireAuth as express.RequestHandler, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { quantity } = req.body as { quantity?: number };
  if (quantity === undefined || quantity < 0) {
    res.status(400).json({ error: 'quantity must be >= 0' });
    return;
  }
  const updated = db.updateCartItem(authReq.userId!, req.params.itemId, quantity);
  if (quantity === 0) {
    res.json({ message: 'Item removed' });
    return;
  }
  if (!updated) {
    res.status(404).json({ error: 'Cart item not found' });
    return;
  }
  res.json({ item: updated });
});

app.delete('/cart/items/:itemId', requireAuth as express.RequestHandler, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  db.removeCartItem(authReq.userId!, req.params.itemId);
  res.json({ message: 'Item removed' });
});

// =============================================================================
// ORDERS — /orders
// =============================================================================

app.post('/orders', requireAuth as express.RequestHandler, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { shippingAddress } = req.body as {
    shippingAddress?: { street: string; city: string; state: string; zipCode: string; country: string };
  };

  if (!shippingAddress?.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
    res.status(400).json({ error: 'Complete shipping address is required' });
    return;
  }

  const cartItems = db.getCart(authReq.userId!);
  if (cartItems.length === 0) {
    res.status(400).json({ error: 'Cart is empty' });
    return;
  }

  const order = db.createOrder(authReq.userId!, cartItems, shippingAddress);
  db.clearCart(authReq.userId!);

  res.status(201).json({
    orderId: order.orderId,
    status: order.status,
    total: order.total,
    message: 'Order placed successfully (local mode — no real payment)',
    order: {
      ...order,
      tax: 0,
      itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
      items: order.items.map(i => ({
        ...i,
        lineTotal: Math.round(i.unitPrice * i.quantity * 100) / 100,
      })),
    },
  });
});

app.get('/orders', requireAuth as express.RequestHandler, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userOrders = db.getOrders(authReq.userId!);
  res.json({ orders: userOrders });
});

app.get('/orders/:orderId', requireAuth as express.RequestHandler, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const order = db.getOrder(authReq.userId!, req.params.orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json({
    order: {
      ...order,
      tax: 0,
      itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
      items: order.items.map(i => ({
        ...i,
        lineTotal: Math.round(i.unitPrice * i.quantity * 100) / 100,
      })),
    },
  });
});

// =============================================================================
// ADMIN CONFIG (stub — returns empty for local dev)
// =============================================================================

app.get('/admin/config', requireAuth as express.RequestHandler, (_req, res) => {
  res.json({
    grouped: {
      'local-dev': [
        { name: 'mode', value: 'local', description: 'Running in local dev mode' },
        { name: 'skip_session_fee', value: 'true', description: 'Session fee always bypassed locally' },
        { name: 'openai_model', value: 'dall-e-3', description: 'Image generation model' },
      ],
    },
  });
});

// =============================================================================
// START
// =============================================================================

app.listen(PORT, () => {
  const openaiKey = process.env.OPENAI_API_KEY;
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   EpicWeave — Local Dev Server               ║');
  console.log(`  ║   http://localhost:${PORT}                      ║`);
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log('  ║  ✅  No AWS required                         ║');
  console.log('  ║  ✅  Session fee bypassed (no Stripe)        ║');
  console.log(`  ║  ${openaiKey ? '✅' : '❌'}  OpenAI API key ${openaiKey ? 'loaded' : 'MISSING — set OPENAI_API_KEY'}${openaiKey ? '              ' : ''}  ║`);
  console.log('  ║                                              ║');
  console.log('  ║  Default login:                              ║');
  console.log('  ║    email   : dev@epicweave.local             ║');
  console.log('  ║    password: password123                     ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});

export default app;
