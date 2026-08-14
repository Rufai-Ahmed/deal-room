import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PageEngagement } from '@dealroom/shared';
import type { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import { hashIp } from '../common/crypto.util';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';
import { detectBot } from './bot-detection';
import { ViewSessionService } from './view-session.service';

export interface RecordedView {
  viewId: string;
  viewSessionToken: string;
  isBot: boolean;
}

@Injectable()
export class ViewTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly sessions: ViewSessionService,
  ) {}

  async recordOpen(shareLinkId: string, req: Request): Promise<RecordedView> {
    const userAgent = req.get('user-agent') ?? undefined;
    const verdict = detectBot(userAgent);
    const agent = new UAParser(userAgent).getResult();

    const view = await this.prisma.documentView.create({
      data: {
        shareLinkId,
        ipHash: this.hashedIp(req),
        userAgent: userAgent ?? null,
        referrer: req.get('referer') ?? null,
        isBot: verdict.isBot,
        botReason: verdict.reason,
        device: agent.device.type ?? 'desktop',
        browser: agent.browser.name ?? null,
        os: agent.os.name ?? null,
        country: this.country(req),
      },
    });

    return {
      viewId: view.id,
      viewSessionToken: this.sessions.issue({ viewId: view.id, shareLinkId }),
      isBot: verdict.isBot,
    };
  }

  async identifyViewer(
    viewId: string,
    email: string,
    name?: string,
  ): Promise<void> {
    await this.prisma.documentView.update({
      where: { id: viewId },
      data: {
        viewerEmail: email.toLowerCase().trim(),
        viewerName: name?.trim() || null,
      },
    });
  }

  async heartbeat(
    viewId: string,
    durationMs: number,
    pages: PageEngagement[],
  ): Promise<void> {
    const view = await this.prisma.documentView.findUnique({
      where: { id: viewId },
      select: { openedAt: true, durationMs: true },
    });

    if (!view) {
      return;
    }

    const ceiling = Date.now() - view.openedAt.getTime();
    const duration = Math.max(
      view.durationMs,
      Math.min(Math.max(durationMs, 0), ceiling),
    );

    await this.prisma.documentView.update({
      where: { id: viewId },
      data: { durationMs: duration, lastSeenAt: new Date() },
    });

    await Promise.all(
      pages
        .filter((page) => page.page > 0 && page.durationMs >= 0)
        .map((page) =>
          this.prisma.pageView.upsert({
            where: { viewId_page: { viewId, page: page.page } },
            create: {
              viewId,
              page: page.page,
              durationMs: Math.min(page.durationMs, ceiling),
            },
            update: { durationMs: Math.min(page.durationMs, ceiling) },
          }),
        ),
    );
  }

  private hashedIp(req: Request): string | null {
    const forwarded = req.get('x-forwarded-for')?.split(',')[0]?.trim();
    const ip = forwarded || req.ip;
    if (!ip) {
      return null;
    }
    return hashIp(ip, this.config.get('ipHashSalt', { infer: true }));
  }

  private country(req: Request): string | null {
    return (
      req.get('x-vercel-ip-country') ?? req.get('cf-ipcountry') ?? null
    );
  }
}
