import { createHmac, timingSafeEqual } from 'node:crypto';

export const signLocalKey = (
  fileKey: string,
  expiresAt: number,
  secret: string,
): string =>
  createHmac('sha256', secret)
    .update(`${fileKey}:${expiresAt}`)
    .digest('base64url');

export const verifyLocalSignature = (
  fileKey: string,
  expiresAt: number,
  signature: string,
  secret: string,
): boolean => {
  if (Number.isNaN(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expected = Buffer.from(signLocalKey(fileKey, expiresAt, secret));
  const provided = Buffer.from(signature);

  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
};
