import { createHash, randomBytes } from 'node:crypto';

export const generateShareToken = (): string =>
  randomBytes(16).toString('base64url');

export const hashIp = (ip: string, salt: string): string =>
  createHash('sha256').update(`${salt}:${ip}`).digest('hex');
