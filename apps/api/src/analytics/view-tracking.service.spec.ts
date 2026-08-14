import { ViewTrackingService } from './view-tracking.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ViewSessionService } from './view-session.service';

const config = {
  get: () => 'salt',
} as never;

const sessions = { issue: () => 'token' } as unknown as ViewSessionService;

interface Recorded {
  durationMs: number;
  pages: { page: number; durationMs: number }[];
}

const buildService = (openedAt: Date, existingDurationMs: number) => {
  const recorded: Recorded = { durationMs: 0, pages: [] };

  const prisma = {
    documentView: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ openedAt, durationMs: existingDurationMs }),
      update: jest.fn().mockImplementation(({ data }) => {
        recorded.durationMs = data.durationMs;
        return Promise.resolve({});
      }),
    },
    pageView: {
      upsert: jest.fn().mockImplementation(({ create }) => {
        recorded.pages.push({ page: create.page, durationMs: create.durationMs });
        return Promise.resolve({});
      }),
    },
  } as unknown as PrismaService;

  return {
    service: new ViewTrackingService(prisma, config, sessions),
    recorded,
    prisma,
  };
};

describe('ViewTrackingService.heartbeat', () => {
  it('records a plausible reading time', async () => {
    const openedAt = new Date(Date.now() - 120_000);
    const { service, recorded } = buildService(openedAt, 0);

    await service.heartbeat('view_1', 90_000, [{ page: 1, durationMs: 60_000 }]);

    expect(recorded.durationMs).toBe(90_000);
    expect(recorded.pages).toEqual([{ page: 1, durationMs: 60_000 }]);
  });

  it('clamps a duration longer than the view has existed', async () => {
    const openedAt = new Date(Date.now() - 10_000);
    const { service, recorded } = buildService(openedAt, 0);

    await service.heartbeat('view_1', 999_999_999, []);

    expect(recorded.durationMs).toBeLessThanOrEqual(11_000);
  });

  it('never lets a later heartbeat reduce the recorded time', async () => {
    const openedAt = new Date(Date.now() - 600_000);
    const { service, recorded } = buildService(openedAt, 300_000);

    await service.heartbeat('view_1', 5_000, []);

    expect(recorded.durationMs).toBe(300_000);
  });

  it('ignores negative durations and out of range pages', async () => {
    const openedAt = new Date(Date.now() - 60_000);
    const { service, recorded } = buildService(openedAt, 0);

    await service.heartbeat('view_1', -5_000, [
      { page: 0, durationMs: 1_000 },
      { page: -3, durationMs: 1_000 },
      { page: 2, durationMs: 4_000 },
    ]);

    expect(recorded.durationMs).toBe(0);
    expect(recorded.pages).toEqual([{ page: 2, durationMs: 4_000 }]);
  });

  it('does nothing when the view no longer exists', async () => {
    const prisma = {
      documentView: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
      pageView: { upsert: jest.fn() },
    } as unknown as PrismaService;

    const service = new ViewTrackingService(prisma, config, sessions);
    await service.heartbeat('missing', 1_000, [{ page: 1, durationMs: 500 }]);

    expect(prisma.documentView.update).not.toHaveBeenCalled();
    expect(prisma.pageView.upsert).not.toHaveBeenCalled();
  });
});
