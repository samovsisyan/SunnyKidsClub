import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from './http.js';

export const COOKIE_NAME = 'skc_session';
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

export interface AdminClaims {
  sub: string;
  email: string;
}

export function signSession(res: Response, claims: AdminClaims) {
  const token = jwt.sign(claims, config.jwtSecret, { expiresIn: Math.floor(MAX_AGE_MS / 1000) });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'strict',
    maxAge: MAX_AGE_MS,
    path: '/',
  });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function readSession(req: Request): AdminClaims | null {
  const token = req.cookies?.[COOKIE_NAME] ?? (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret) as AdminClaims;
  } catch {
    return null;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminClaims;
    }
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const claims = readSession(req);
  if (!claims) return next(new HttpError(401, 'Անհրաժեշտ է մուտք գործել'));
  req.admin = claims;
  next();
}
