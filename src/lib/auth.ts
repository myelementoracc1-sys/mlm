import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fast-forward-jwt-secret-key-change-in-prod-12345';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  memberId?: string;
  memberCode?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function generateApiKey(): { rawKey: string; keyHash: string; prefix: string } {
  const rawKey = `ff_live_${crypto.randomBytes(24).toString('hex')}`;
  const prefix = rawKey.substring(0, 12);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  return { rawKey, keyHash, prefix };
}

export async function validateApiKey(rawKey: string): Promise<boolean> {
  if (!rawKey) return false;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  });
  if (!apiKey || !apiKey.isActive) return false;

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return true;
}
