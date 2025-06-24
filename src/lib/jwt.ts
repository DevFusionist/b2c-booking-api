import jwt, { SignOptions } from "jsonwebtoken";
import { LRUCache } from "lru-cache";

// Custom error classes for better error handling
export class TokenBlacklistedError extends Error {
  constructor(message: string = "Token has been revoked") {
    super(message);
    this.name = "TokenBlacklistedError";
  }
}

export class RefreshTokenBlacklistedError extends Error {
  constructor(message: string = "Refresh token has been revoked") {
    super(message);
    this.name = "RefreshTokenBlacklistedError";
  }
}

// LRU Cache for blacklisted access tokens
const blacklistedTokens = new LRUCache<string, boolean>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours TTL
});

// LRU Cache for blacklisted refresh tokens
const blacklistedRefreshTokens = new LRUCache<string, boolean>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days TTL (matching refresh token expiry)
});

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

/**
 * Generate access token with configurable expiry
 */
export function generateAccessToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "15m";

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }

  const options: SignOptions = {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret as jwt.Secret, options);
}

/**
 * Generate refresh token with configurable expiry
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not defined");
  }

  const options: SignOptions = {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret as jwt.Secret, options);
}

/**
 * Verify access token and check if it's blacklisted
 */
export function verifyAccessToken(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }

  // Check if token is blacklisted
  if (blacklistedTokens.has(token)) {
    throw new TokenBlacklistedError();
  }

  return jwt.verify(token, secret as jwt.Secret) as JWTPayload;
}

/**
 * Verify refresh token and check if it's blacklisted
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not defined");
  }

  // Check if refresh token is blacklisted
  if (blacklistedRefreshTokens.has(token)) {
    throw new RefreshTokenBlacklistedError();
  }

  return jwt.verify(token, secret as jwt.Secret) as RefreshTokenPayload;
}

/**
 * Blacklist an access token (for logout)
 */
export function blacklistToken(token: string): void {
  blacklistedTokens.set(token, true);
}

/**
 * Blacklist a refresh token (for logout or refresh)
 */
export function blacklistRefreshToken(token: string): void {
  blacklistedRefreshTokens.set(token, true);
}

/**
 * Generate a new token pair (access + refresh)
 */
export function generateTokenPair(
  userId: string,
  email: string
): {
  accessToken: string;
  refreshToken: string;
} {
  const tokenId = Math.random().toString(36).substring(2);

  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken({ userId, tokenId });

  return { accessToken, refreshToken };
}

/**
 * Check if an access token is blacklisted
 */
export function isTokenBlacklisted(token: string): boolean {
  return blacklistedTokens.has(token);
}

/**
 * Check if a refresh token is blacklisted
 */
export function isRefreshTokenBlacklisted(token: string): boolean {
  return blacklistedRefreshTokens.has(token);
}

/**
 * Blacklist both access and refresh tokens (for logout)
 */
export function blacklistTokenPair(
  accessToken: string,
  refreshToken: string
): void {
  if (accessToken && accessToken.trim()) {
    blacklistToken(accessToken);
  }
  if (refreshToken && refreshToken.trim()) {
    blacklistRefreshToken(refreshToken);
  }
}

/**
 * Get blacklist statistics (for monitoring)
 */
export function getBlacklistStats(): {
  accessTokens: number;
  refreshTokens: number;
} {
  return {
    accessTokens: blacklistedTokens.size,
    refreshTokens: blacklistedRefreshTokens.size,
  };
}
