import { createHash, randomBytes } from 'node:crypto';

export const generateShareToken = (): string =>
  randomBytes(16).toString('base64url');

/// Viewer IPs are only ever stored hashed. Unique-viewer counts still work,
/// but the raw address is never persisted.
export const hashIp = (ip: string, salt: string): string =>
  createHash('sha256').update(`${salt}:${ip}`).digest('hex');
