/**
 * Local auth middleware — no Cognito, no JWT verification.
 * Uses a simple token format: "local:<userId>:<email>"
 * The /auth/login and /auth/register endpoints issue these tokens.
 */
import { Request, Response, NextFunction } from 'express';
import { db } from './db';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Make a local token from a user record.
 */
export function makeToken(userId: string, email: string): string {
  return Buffer.from(`local:${userId}:${email}`).toString('base64');
}

/**
 * Parse a local token — returns null if invalid.
 */
export function parseToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [prefix, userId, email] = decoded.split(':');
    if (prefix !== 'local' || !userId || !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

/**
 * Express middleware: requires a valid local token.
 * Attaches userId + userEmail to the request.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const parsed = parseToken(token);

  if (!parsed) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Verify user still exists in db
  const user = db.getUserById(parsed.userId);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  req.userId = parsed.userId;
  req.userEmail = parsed.email;
  next();
}

/**
 * Optional auth — attaches user if token is valid, continues even without.
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const parsed = parseToken(authHeader.slice(7));
    if (parsed) {
      req.userId = parsed.userId;
      req.userEmail = parsed.email;
    }
  }
  next();
}
