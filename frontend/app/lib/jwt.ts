/**
 * JWT token utilities
 * Centralized utilities for handling JWT tokens
 */

import logger from './logger';

/**
 * Parse a JWT token and extract its payload
 * @param token - JWT token to parse
 * @returns Decoded payload object or null if invalid
 */
export function parseJwt(token: string): any | null {
  try {
    // Token format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64 decode the payload
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    logger.error('Error parsing JWT token:', error);
    return null;
  }
}

/**
 * Get token expiration time in milliseconds
 * @param token - JWT token
 * @returns Expiration time in milliseconds or null if invalid
 */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = parseJwt(token);
    // JWT exp claim is in seconds, convert to milliseconds
    return payload?.exp ? payload.exp * 1000 : null;
  } catch (error) {
    logger.error('Error getting token expiry:', error);
    return null;
  }
}

/**
 * Check if token is expired
 * @param expiresAt - Token expiration timestamp
 * @returns True if token is expired, false otherwise
 */
export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
}

/**
 * Check if token will expire soon (within specified minutes)
 * @param expiresAt - Token expiration timestamp
 * @param minutes - Minutes threshold (default: 2)
 * @returns True if token will expire within the specified minutes
 */
export function willExpireSoon(
  expiresAt: number | null, 
  minutes: number = 2
): boolean {
  if (!expiresAt) return false;
  return Date.now() > expiresAt - minutes * 60 * 1000;
}

/**
 * Safely mask a token for logging (shows first 6 and last 4 chars)
 * @param token - Token to mask
 * @returns Masked token string
 */
export function maskToken(token: string | null): string {
  if (!token) return 'null';
  if (token.length <= 10) return '***'; // Don't reveal very short tokens
  
  const firstPart = token.substring(0, 6);
  const lastPart = token.substring(token.length - 4);
  return `${firstPart}...${lastPart}`;
}