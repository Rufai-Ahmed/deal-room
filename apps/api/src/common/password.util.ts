import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const scryptAsync = (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });

// Memory-hard parameters from RFC 7914. maxmem has to be raised explicitly
// because 128 * N * r * p exceeds node's 32MB default.
const COST = 32768;
const BLOCK_SIZE = 8;
const PARALLELISATION = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

const derive = (password: string, salt: Buffer): Promise<Buffer> =>
  scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELISATION,
    maxmem: MAX_MEMORY,
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELISATION}$${salt.toString('base64')}$${key.toString('base64')}`;
};

export const verifyPassword = async (
  hash: string,
  password: string,
): Promise<boolean> => {
  const [scheme, , , , salt, key] = hash.split('$');
  if (scheme !== 'scrypt' || !salt || !key) {
    return false;
  }

  const expected = Buffer.from(key, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'));

  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
};
