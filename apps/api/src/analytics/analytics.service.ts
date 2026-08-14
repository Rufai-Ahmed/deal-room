import { Injectable } from '@nestjs/common';
import type {
  ActivityItem,
  DocumentAnalytics,
  PageEngagement,
  ViewEvent,
} from '@dealroom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';

type ViewWithRelations = {
  id: string;
  shareLinkId: string;
  openedAt: Date;
  lastSeenAt: Date;
  durationMs: number;
  viewerEmail: string | null;
  viewerName: string | null;
  ipHash: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  isBot: boolean;
  botReason: string | null;
  pageViews: { page: number; durationMs: number }[];
  shareLink: { recipientName: string | null };
};

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
  ) {}

  async forDocument(
    ownerId: string,
    documentId: string,
  ): Promise<DocumentAnalytics> {
    await this.documents.findOwned(ownerId, documentId);

    const views = (await this.prisma.documentView.findMany({
      where: { shareLink: { documentId } },
      orderBy: { openedAt: 'desc' },
      include: {
        pageViews: { orderBy: { page: 'asc' } },
        shareLink: { select: { recipientName: true } },
      },
    })) as ViewWithRelations[];

    const human = views.filter((view) => !view.isBot);
    const totalDurationMs = human.reduce(
      (total, view) => total + view.durationMs,
      0,
    );

    return {
      documentId,
      totalViews: human.length,
      uniqueViewers: this.countUniqueViewers(human),
      totalDurationMs,
      averageDurationMs: human.length
        ? Math.round(totalDurationMs / human.length)
        : 0,
      firstViewedAt: human.at(-1)?.openedAt.toISOString() ?? null,
      lastViewedAt: human.at(0)?.openedAt.toISOString() ?? null,
      botHits: views.length - human.length,
      pageEngagement: this.aggregatePages(human),
      views: views.map((view) => this.toViewEvent(view)),
    };
  }

  async activityFeed(ownerId: string, limit = 25): Promise<ActivityItem[]> {
    const [views, comments] = await Promise.all([
      this.prisma.documentView.findMany({
        where: { isBot: false, shareLink: { document: { ownerId } } },
        orderBy: { openedAt: 'desc' },
        take: limit,
        include: {
          shareLink: {
            select: {
              id: true,
              recipientName: true,
              document: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.comment.findMany({
        where: { shareLink: { document: { ownerId } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          shareLink: {
            select: {
              id: true,
              recipientName: true,
              document: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    const items: ActivityItem[] = [
      ...views.map((view) => ({
        id: `view:${view.id}`,
        type: 'view' as const,
        documentId: view.shareLink.document.id,
        documentName: view.shareLink.document.name,
        shareLinkId: view.shareLink.id,
        recipientName: view.shareLink.recipientName,
        viewerLabel:
          view.viewerName ??
          view.viewerEmail ??
          view.shareLink.recipientName ??
          'Anonymous viewer',
        occurredAt: view.openedAt.toISOString(),
        detail: view.durationMs > 0 ? this.formatDuration(view.durationMs) : null,
      })),
      ...comments.map((comment) => ({
        id: `comment:${comment.id}`,
        type: 'comment' as const,
        documentId: comment.shareLink.document.id,
        documentName: comment.shareLink.document.name,
        shareLinkId: comment.shareLink.id,
        recipientName: comment.shareLink.recipientName,
        viewerLabel: comment.authorName ?? comment.authorEmail ?? 'Anonymous',
        occurredAt: comment.createdAt.toISOString(),
        detail: comment.body.slice(0, 140),
      })),
    ];

    return items
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, limit);
  }

  private countUniqueViewers(views: ViewWithRelations[]): number {
    const keys = views.map(
      (view) => view.viewerEmail ?? view.ipHash ?? view.id,
    );
    return new Set(keys).size;
  }

  private aggregatePages(views: ViewWithRelations[]): PageEngagement[] {
    const totals = new Map<number, number>();

    for (const view of views) {
      for (const page of view.pageViews) {
        totals.set(page.page, (totals.get(page.page) ?? 0) + page.durationMs);
      }
    }

    return [...totals.entries()]
      .map(([page, durationMs]) => ({ page, durationMs }))
      .sort((a, b) => a.page - b.page);
  }

  private toViewEvent(view: ViewWithRelations): ViewEvent {
    return {
      id: view.id,
      shareLinkId: view.shareLinkId,
      recipientName: view.shareLink.recipientName,
      openedAt: view.openedAt.toISOString(),
      lastSeenAt: view.lastSeenAt.toISOString(),
      durationMs: view.durationMs,
      viewerEmail: view.viewerEmail,
      device: view.device,
      browser: view.browser,
      os: view.os,
      country: view.country,
      isBot: view.isBot,
      botReason: view.botReason,
      pages: view.pageViews.map((page) => ({
        page: page.page,
        durationMs: page.durationMs,
      })),
    };
  }

  private formatDuration(ms: number): string {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
}
