import { StorageService } from './storage.service';
import type { StorageDriver } from './storage.types';

const service = new StorageService({} as StorageDriver);

describe('StorageService.ownsFileKey', () => {
  const owner = 'user_1';

  it('accepts a key it generated for that owner', () => {
    const key = service.buildFileKey(owner, 'deck.pdf');
    expect(service.ownsFileKey(owner, key)).toBe(true);
  });

  it('rejects a key belonging to another founder', () => {
    const theirs = service.buildFileKey('user_2', 'deck.pdf');
    expect(service.ownsFileKey(owner, theirs)).toBe(false);
  });

  it('rejects a key that only looks like a prefix match', () => {
    expect(service.ownsFileKey(owner, 'documents/user_10/file.pdf')).toBe(false);
    expect(service.ownsFileKey(owner, 'documents/user_1extra/file.pdf')).toBe(
      false,
    );
  });

  it('rejects traversal attempts', () => {
    expect(
      service.ownsFileKey(owner, `documents/${owner}/../user_2/file.pdf`),
    ).toBe(false);
  });

  it('rejects an unprefixed key', () => {
    expect(service.ownsFileKey(owner, 'file.pdf')).toBe(false);
    expect(service.ownsFileKey(owner, '')).toBe(false);
  });
});
