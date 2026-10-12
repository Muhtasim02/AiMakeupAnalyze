import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  name?: string;
  country?: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'ai_makeupmatch_jwt_secret_token_key_2026';

export function generateToken(payload: AuthenticatedUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
      return next();
    } catch (err: any) {
      // Continue to check admin fallback header
    }
  }

  // Allow admin console operations when x-admin-role is passed
  const adminHeader = req.headers['x-admin-role'] || req.headers['x-user-role'];
  if (adminHeader === 'admin') {
    req.user = {
      userId: 1,
      email: 'admin@gmail.com',
      role: 'admin',
      name: 'System Administrator',
    };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Authentication required. Missing or malformed Bearer token.',
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Administrative privileges required.',
    });
  }
  next();
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
    } catch {
      // Ignore invalid token in optional auth
    }
  }
  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[API Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}
