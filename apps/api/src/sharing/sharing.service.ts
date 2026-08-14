import {
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ShareLinkStatus, ShareLinkSummary } from '@dealroom/shared';
import { generateShareToken } from '../common/crypto.util';
import { AppConfig } from '../config/app-config';
import { DocumentsService } from '../documents/documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareLinkDto, UpdateShareLinkDto } from './dto/share.dto';

interface LinkStats {
  totalViews: number;
  uniqueViewers: number;
  lastViewedAt: string | null;
  totalDurationMs: number;
}

@Injectable()
export class SharingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async create(
    ownerId: string,
    documentId: string,
    dto: CreateShareLinkDto,
  ): Promise<ShareLinkSummary> {
    await this.documents.findOwned(ownerId, documentId);

    const link = await this.prisma.shareLink.create({
      data: {
        documentId,
        token: generateShareToken(),
        recipientName: dto.recipientName?.trim() || null,
        recipientEmail: dto.recipientEmail?.toLowerCase().trim() || null,
        requireEmail: dto.requireEmail ?? true,
        allowDownload: dto.allowDownload ?? false,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return this.toSummary(link, {
      totalViews: 0,
      uniqueViewers: 0,
      lastViewedAt: null,
      totalDurationMs: 0,
    }, 0);
  }

  async listForDocument(
    ownerId: string,
    documentId: string,
  ): Promise<ShareLinkSummary[]> {
    await this.documents.findOwned(ownerId, documentId);

    const links = await this.prisma.shareLink.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { comments: true } } },
    });

    const stats = await this.statsFor(links.map((link) => link.id));

    return links.map((link) =>
      this.toSummary(
        link,
        stats.get(link.id) ?? {
          totalViews: 0,
          uniqueViewers: 0,
          lastViewedAt: null,
          totalDurationMs: 0,
        },
        link._count.comments,
      ),
    );
  }

  async update(
    ownerId: string,
    shareLinkId: string,
    dto: UpdateShareLinkDto,
  ): Promise<ShareLinkSummary> {
    const link = await this.findOwnedLink(ownerId, shareLinkId);

    await this.prisma.shareLink.update({
      where: { id: link.id },
      data: {
        recipientName: dto.recipientName?.trim() ?? link.recipientName,
        recipientEmail:
          dto.recipientEmail?.toLowerCase().trim() ?? link.recipientEmail,
        requireEmail: dto.requireEmail ?? link.requireEmail,
        allowDownload: dto.allowDownload ?? link.allowDownload,
        expiresAt:
          dto.expiresAt === undefined
            ? link.expiresAt
            : dto.expiresAt
              ? new Date(dto.expiresAt)
              : null,
      },
    });

    const [summary] = await this.listForDocument(
      ownerId,
      link.documentId,
    ).then((links) => links.filter((item) => item.id === shareLinkId));

    return summary;
  }

  async revoke(ownerId: string, shareLinkId: string): Promise<void> {
    const link = await this.findOwnedLink(ownerId, shareLinkId);
    if (link.revokedAt) {
      return;
    }

    await this.prisma.shareLink.update({
      where: { id: link.id },
      data: { revokedAt: new Date() },
    });
  }

  /// Resolves a public token. Anything other than an active link raises 410 so
  /// the viewer can be told the link is closed rather than that it never existed.
  async resolveActive(token: string) {
    const link = await this.prisma.shareLink.findUnique({
      where: { token },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            fileKey: true,
            pageCount: true,
            archivedAt: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!link || link.document.archivedAt) {
      throw new NotFoundException('This link does not exist');
    }

    const status = this.statusOf(link);
    if (status !== 'active') {
      throw new HttpException({ status, message: `This link has been ${status}` }, 410);
    }

    return link;
  }

  statusOf(link: {
    revokedAt: Date | null;
    expiresAt: Date | null;
  }): ShareLinkStatus {
    if (link.revokedAt) {
      return 'revoked';
    }
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      return 'expired';
    }
    return 'active';
  }

  private async findOwnedLink(ownerId: string, shareLinkId: string) {
    const link = await this.prisma.shareLink.findUnique({
      where: { id: shareLinkId },
      include: { document: { select: { ownerId: true } } },
    });

    if (!link) {
      throw new NotFoundException('Share link not found');
    }
    if (link.document.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this share link');
    }

    return link;
  }

  private async statsFor(
    shareLinkIds: string[],
  ): Promise<Map<string, LinkStats>> {
    if (shareLinkIds.length === 0) {
      return new Map();
    }

    const views = await this.prisma.documentView.findMany({
      where: { shareLinkId: { in: shareLinkIds }, isBot: false },
      select: {
        shareLinkId: true,
        viewerEmail: true,
        ipHash: true,
        openedAt: true,
        durationMs: true,
        id: true,
      },
    });

    const accumulator = new Map<
      string,
      { total: number; viewers: Set<string>; last: Date | null; duration: number }
    >();

    for (const view of views) {
      const entry = accumulator.get(view.shareLinkId) ?? {
        total: 0,
        viewers: new Set<string>(),
        last: null,
        duration: 0,
      };

      entry.total += 1;
      entry.viewers.add(view.viewerEmail ?? view.ipHash ?? view.id);
      entry.duration += view.durationMs;
      if (!entry.last || view.openedAt > entry.last) {
        entry.last = view.openedAt;
      }

      accumulator.set(view.shareLinkId, entry);
    }

    return new Map(
      [...accumulator.entries()].map(([id, entry]) => [
        id,
        {
          totalViews: entry.total,
          uniqueViewers: entry.viewers.size,
          lastViewedAt: entry.last?.toISOString() ?? null,
          totalDurationMs: entry.duration,
        },
      ]),
    );
  }

  private toSummary(
    link: {
      id: string;
      token: string;
      recipientName: string | null;
      recipientEmail: string | null;
      requireEmail: boolean;
      allowDownload: boolean;
      expiresAt: Date | null;
      revokedAt: Date | null;
      createdAt: Date;
    },
    stats: LinkStats,
    commentCount: number,
  ): ShareLinkSummary {
    return {
      id: link.id,
      token: link.token,
      url: `${this.config.get('webUrl', { infer: true })}/s/${link.token}`,
      recipientName: link.recipientName,
      recipientEmail: link.recipientEmail,
      requireEmail: link.requireEmail,
      allowDownload: link.allowDownload,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      revokedAt: link.revokedAt?.toISOString() ?? null,
      createdAt: link.createdAt.toISOString(),
      status: this.statusOf(link),
      ...stats,
      commentCount,
    };
  }
}
