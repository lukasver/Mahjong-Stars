import { createHash } from 'node:crypto';
import { env } from '@/common/config/env';

/**
 * Hashes a JWT token using HMAC-SHA256 with a secret key
 * @param jwt - The JWT token to hash
 * @returns The hashed JWT token
 */
export const hashJwt = (jwt: string): string => {
  const hash = createHash('sha256');
  hash.update(jwt + env.JWT_SECRET);
  return hash.digest('hex');
};

/**
 * Compares a plain JWT token with a hashed JWT token
 * @param plainJwt - The plain JWT token to compare
 * @param hashedJwt - The hashed JWT token to compare against
 * @returns True if the tokens match, false otherwise
 */
export const compareJwt = (plainJwt: string, hashedJwt: string): boolean => {
  const hashedPlainJwt = hashJwt(plainJwt);
  return hashedPlainJwt === hashedJwt;
};

/**
 * Validates if a JWT token hash is valid
 * @param hashedJwt - The hashed JWT token to validate
 * @returns True if the hash is valid (64 characters hex), false otherwise
 */
export const isValidJwtHash = (hashedJwt: string): boolean => {
  return /^[a-f0-9]{64}$/i.test(hashedJwt);
};
