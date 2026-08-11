import { createHmac, timingSafeEqual } from 'crypto';

const ALG = 'HS256';

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function parseExpiresIn(expiresIn: string | number): number {
  if (typeof expiresIn === 'number') {
    return Math.floor(expiresIn);
  }
  const match = /^(\d+)\s*(s|m|h|d|w)?$/i.exec(expiresIn.trim());
  if (!match) {
    return 86400;
  }
  const value = parseInt(match[1], 10);
  const unit = (match[2] || 's').toLowerCase();
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
  return value * (multipliers[unit] || 1);
}

function signature(data: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(data).digest();
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export interface JwtSignOptions {
  subject?: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  expiresIn?: string | number;
  issuer?: string;
  audience?: string;
  jti?: string;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti?: string;
}

export function signJwt(
  payload: JwtPayload,
  secret: string,
): string {
  const header = { alg: ALG, typ: 'JWT' };
  const headerSegment = base64UrlEncode(JSON.stringify(header));
  const payloadSegment = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerSegment}.${payloadSegment}`;
  const sig = signature(data, secret).toString('base64url');
  return `${data}.${sig}`;
}

export function createJwtToken(
  secret: string,
  claims: {
    sub: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    expiresIn?: string | number;
    issuer?: string;
    audience?: string;
    jti?: string;
  },
): string {
  const now = Math.floor(Date.now() / 1000);
  const ttl = parseExpiresIn(claims.expiresIn ?? 86400);
  const payload: JwtPayload = {
    sub: claims.sub,
    email: claims.email,
    roles: claims.roles ?? [],
    permissions: claims.permissions ?? [],
    iat: now,
    exp: now + ttl,
    iss: claims.issuer ?? 'bist-elite-ai',
    aud: claims.audience ?? 'bist-elite-ai',
    jti: claims.jti,
  };
  return signJwt(payload, secret);
}

export interface JwtVerifyResult {
  payload: JwtPayload;
}

export function verifyJwt(token: string, secret: string, expectedAudience?: string): JwtVerifyResult | null {
  if (!token || !secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerSegment, payloadSegment, signatureSegment] = parts;

  let header: { alg?: string };
  try {
    header = JSON.parse(base64UrlDecode(headerSegment)) as { alg?: string };
  } catch {
    return null;
  }

  if (!header || header.alg !== ALG) return null;

  const data = `${headerSegment}.${payloadSegment}`;
  const expectedSig = Buffer.from(signatureSegment, 'base64url');
  const actualSig = signature(data, secret);

  if (!safeEqual(expectedSig, actualSig)) return null;

  let payload: JwtPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadSegment)) as JwtPayload;
  } catch {
    return null;
  }

  if (!payload || typeof payload.exp !== 'number') return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return null;

  if (expectedAudience && payload.aud !== expectedAudience) return null;

  return { payload };
}
