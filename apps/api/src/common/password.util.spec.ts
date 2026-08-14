import { hashPassword, verifyPassword } from './password.util';

describe('password hashing', () => {
  it('accepts the correct password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(
      verifyPassword(hash, 'correct horse battery staple'),
    ).resolves.toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(verifyPassword(hash, 'Correct horse battery staple')).resolves.toBe(
      false,
    );
  });

  it('salts each hash so identical passwords do not collide', async () => {
    const [first, second] = await Promise.all([
      hashPassword('same password'),
      hashPassword('same password'),
    ]);
    expect(first).not.toEqual(second);
  });

  it('rejects a malformed or foreign hash instead of throwing', async () => {
    await expect(verifyPassword('not-a-hash', 'anything')).resolves.toBe(false);
    await expect(
      verifyPassword('$2b$10$abcdefghijklmnopqrstuv', 'anything'),
    ).resolves.toBe(false);
  });

  it('normalises unicode so the same typed password verifies', async () => {
    const composed = 'passwör d';
    const decomposed = composed.normalize('NFD');
    const hash = await hashPassword(composed);
    await expect(verifyPassword(hash, decomposed)).resolves.toBe(true);
  });
});
