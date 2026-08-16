import { Injectable } from '@nestjs/common';
import type {
  ActivityItem,
  DocumentAnalytics,
  Page,
  PageEngagement,
  ViewEvent,
} from '@dealroom/shared';
import { paginate } from '../common/paginate';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';

interface TotalsRow {
  totalViews: bigint;
  uniqueViewers: bigint;
  totalDurationMs: bigint;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  botHits: bigint;
}

interface PageEngagementRow {
  page: number;
  durationMs: bigint;
}

type ViewWithRelations = {
  id: string;
  shareLinkId: string;
  openedAt: Date;
  lastSeenAt: Date;
  durationMs: number;
  viewerEmail: string | null;
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

    const [totals, pages] = await Promise.all([
      this.totalsFor(documentId),
      this.pageEngagementFor(documentId),
    ]);

    const totalViews = Number(totals.totalViews);
    const totalDurationMs = Number(totals.totalDurationMs);

    return {
      documentId,
      totalViews,
      uniqueViewers: Number(totals.uniqueViewers),
      totalDurationMs,
      averageDurationMs: totalViews
        ? Math.round(totalDurationMs / totalViews)
        : 0,
      firstViewedAt: totals.firstViewedAt?.toISOString() ?? null,
      lastViewedAt: totals.lastViewedAt?.toISOString() ?? null,
      botHits: Number(totals.botHits),
      pageEngagement: pages,
    };
  }

  async viewsForDocument(
    ownerId: string,
    documentId: string,
    options: { cursor?: string; limit: number; includeBots: boolean },
  ): Promise<Page<ViewEvent>> {
    await this.documents.findOwned(ownerId, documentId);

    const rows = (await this.prisma.documentView.findMany({
      where: {
        shareLink: { documentId },
        ...(options.includeBots ? {} : { isBot: false }),
      },
      orderBy: [{ openedAt: 'desc' }, { id: 'desc' }],
      take: options.limit + 1,
      ...(options.cursor
        ? { cursor: { id: options.cursor }, skip: 1 }
        : {}),
      include: {
        pageViews: { orderBy: { page: 'asc' } },
        shareLink: { select: { recipientName: true } },
      },
    })) as ViewWithRelations[];

    const page = paginate(rows, options.limit, (row) => row.id);

    return {
      items: page.items.map((view) => this.toViewEvent(view)),
      nextCursor: page.nextCursor,
    };
  }

  async activityFeed(
    ownerId: string,
    options: { cursor?: string; limit: number },
  ): Promise<Page<ActivityItem>> {
    const before = options.cursor ? new Date(options.cursor) : undefined;
    const take = options.limit + 1;

    const shareLinkShape = {
      select: {
        id: true,
        recipientName: true,
        document: { select: { id: true, name: true } },
      },
    } as const;

    const [views, comments] = await Promise.all([
      this.prisma.documentView.findMany({
        where: {
          isBot: false,
          shareLink: { document: { ownerId } },
          ...(before ? { openedAt: { lt: before } } : {}),
        },
        orderBy: { openedAt: 'desc' },
        take,
        include: { shareLink: shareLinkShape },
      }),
      this.prisma.comment.findMany({
        where: {
          shareLink: { document: { ownerId } },
          ...(before ? { createdAt: { lt: before } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take,
        include: { shareLink: shareLinkShape },
      }),
    ]);

    const merged: ActivityItem[] = [
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
        detail:
          view.durationMs > 0 ? this.formatDuration(view.durationMs) : null,
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
    ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    return paginate(merged, options.limit, (item) => item.occurredAt);
  }

  private async totalsFor(documentId: string): Promise<TotalsRow> {
    const [row] = await this.prisma.$queryRaw<TotalsRow[]>`
      SELECT
        COUNT(v.id) FILTER (WHERE v."isBot" = false)                     AS "totalViews",
        COUNT(DISTINCT COALESCE(v."viewerEmail", v."ipHash", v.id))
          FILTER (WHERE v."isBot" = false)                               AS "uniqueViewers",
        COALESCE(SUM(v."durationMs") FILTER (WHERE v."isBot" = false), 0) AS "totalDurationMs",
        MIN(v."openedAt") FILTER (WHERE v."isBot" = false)               AS "firstViewedAt",
        MAX(v."openedAt") FILTER (WHERE v."isBot" = false)               AS "lastViewedAt",
        COUNT(v.id) FILTER (WHERE v."isBot" = true)                      AS "botHits"
      FROM "share_links" s
      LEFT JOIN "document_views" v ON v."shareLinkId" = s.id
      WHERE s."documentId" = ${documentId}
    `;

    return (
      row ?? {
        totalViews: 0n,
        uniqueViewers: 0n,
        totalDurationMs: 0n,
        firstViewedAt: null,
        lastViewedAt: null,
        botHits: 0n,
      }
    );
  }

  private async pageEngagementFor(
    documentId: string,
  ): Promise<PageEngagement[]> {
    const rows = await this.prisma.$queryRaw<PageEngagementRow[]>`
      SELECT p.page AS "page", SUM(p."durationMs") AS "durationMs"
      FROM "share_links" s
      JOIN "document_views" v ON v."shareLinkId" = s.id AND v."isBot" = false
      JOIN "page_views" p ON p."viewId" = v.id
      WHERE s."documentId" = ${documentId}
      GROUP BY p.page
      ORDER BY p.page ASC
    `;

    return rows.map((row) => ({
      page: row.page,
      durationMs: Number(row.durationMs),
    }));
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
