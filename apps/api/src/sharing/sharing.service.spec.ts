import { ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { SharingService } from './sharing.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { DocumentsService } from '../documents/documents.service';

const config = {
  get: () => 'https://dealroom.example',
} as never;

const buildService = (prisma: unknown, documents: unknown = {}) =>
  new SharingService(
    prisma as PrismaService,
    documents as DocumentsService,
    config,
  );

const activeDocument = {
  id: 'doc_1',
  name: 'Series A deck',
  mimeType: 'application/pdf',
  fileKey: 'documents/u1/deck.pdf',
  pageCount: 12,
  archivedAt: null,
  owner: { id: 'user_1', name: 'Ada', email: 'ada@example.com' },
};

describe('SharingService.statusOf', () => {
  const service = buildService({});

  it('is active while neither revoked nor expired', () => {
    expect(service.statusOf({ revokedAt: null, expiresAt: null })).toBe('active');
  });

  it('is active when the expiry is still in the future', () => {
    const tomorrow = new Date(Date.now() + 86_400_000);
    expect(service.statusOf({ revokedAt: null, expiresAt: tomorrow })).toBe(
      'active',
    );
  });

  it('is expired once the expiry has passed', () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    expect(service.statusOf({ revokedAt: null, expiresAt: yesterday })).toBe(
      'expired',
    );
  });

  it('reports revoked ahead of expired when both apply', () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(service.statusOf({ revokedAt: past, expiresAt: past })).toBe(
      'revoked',
    );
  });
});

describe('SharingService.resolveActive', () => {
  const withLink = (link: unknown) =>
    buildService({ shareLink: { findUnique: jest.fn().mockResolvedValue(link) } });

  it('returns the link when it is active', async () => {
    const link = {
      id: 'link_1',
      revokedAt: null,
      expiresAt: null,
      document: activeDocument,
    };
    await expect(withLink(link).resolveActive('token')).resolves.toBe(link);
  });

  it('404s an unknown token rather than leaking that it once existed', async () => {
    await expect(withLink(null).resolveActive('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('404s when the underlying document was archived', async () => {
    const link = {
      id: 'link_1',
      revokedAt: null,
      expiresAt: null,
      document: { ...activeDocument, archivedAt: new Date() },
    };
    await expect(withLink(link).resolveActive('token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('410s a revoked link so the viewer can be told it closed', async () => {
    const link = {
      id: 'link_1',
      revokedAt: new Date(),
      expiresAt: null,
      document: activeDocument,
    };

    const error = (await withLink(link)
      .resolveActive('token')
      .catch((thrown) => thrown)) as HttpException;

    expect(error.getStatus()).toBe(410);
    expect(error.getResponse()).toMatchObject({ status: 'revoked' });
  });

  it('410s an expired link', async () => {
    const link = {
      id: 'link_1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      document: activeDocument,
    };

    const error = (await withLink(link)
      .resolveActive('token')
      .catch((thrown) => thrown)) as HttpException;

    expect(error.getStatus()).toBe(410);
    expect(error.getResponse()).toMatchObject({ status: 'expired' });
  });
});

describe('SharingService ownership', () => {
  it('refuses to revoke a link belonging to another founder', async () => {
    const service = buildService({
      shareLink: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'link_1',
          revokedAt: null,
          document: { ownerId: 'someone_else' },
        }),
        update: jest.fn(),
      },
    });

    await expect(service.revoke('user_1', 'link_1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('does not re-stamp a link that was already revoked', async () => {
    const update = jest.fn();
    const service = buildService({
      shareLink: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'link_1',
          revokedAt: new Date(),
          document: { ownerId: 'user_1' },
        }),
        update,
      },
    });

    await service.revoke('user_1', 'link_1');
    expect(update).not.toHaveBeenCalled();
  });
});
