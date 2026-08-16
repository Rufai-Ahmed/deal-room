import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  DocumentSummary,
  DocumentUploadTicket,
  Page,
} from '@dealroom/shared';
import { paginate } from '../common/paginate';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  CreateDocumentDto,
  RenameDocumentDto,
  RequestUploadDto,
} from './dto/document.dto';

interface ViewStatsRow {
  documentId: string;
  totalViews: bigint;
  uniqueViewers: bigint;
  lastViewedAt: Date | null;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async requestUpload(
    ownerId: string,
    dto: RequestUploadDto,
  ): Promise<DocumentUploadTicket> {
    const fileKey = this.storage.buildFileKey(ownerId, dto.fileName);
    const target = await this.storage.createUploadTarget(fileKey, dto.mimeType);

    return { ...target, fileKey };
  }

  async create(
    ownerId: string,
    dto: CreateDocumentDto,
  ): Promise<DocumentSummary> {
    const document = await this.prisma.document.create({
      data: {
        ownerId,
        name: dto.name.trim(),
        fileKey: dto.fileKey,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        pageCount: dto.pageCount ?? null,
      },
    });

    return {
      id: document.id,
      name: document.name,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      pageCount: document.pageCount,
      createdAt: document.createdAt.toISOString(),
      shareLinkCount: 0,
      totalViews: 0,
      uniqueViewers: 0,
      lastViewedAt: null,
    };
  }

  async list(
    ownerId: string,
    options: { cursor?: string; limit: number },
  ): Promise<Page<DocumentSummary>> {
    const rows = await this.prisma.document.findMany({
      where: { ownerId, archivedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      include: { _count: { select: { shareLinks: true } } },
    });

    const page = paginate(rows, options.limit, (row) => row.id);

    if (page.items.length === 0) {
      return { items: [], nextCursor: null };
    }

    const stats = await this.viewStatsFor(page.items.map((doc) => doc.id));

    return {
      items: page.items.map((doc) => this.toSummary(doc, stats.get(doc.id))),
      nextCursor: page.nextCursor,
    };
  }

  async summaryFor(
    ownerId: string,
    documentId: string,
  ): Promise<DocumentSummary> {
    await this.findOwned(ownerId, documentId);

    const doc = await this.prisma.document.findUniqueOrThrow({
      where: { id: documentId },
      include: { _count: { select: { shareLinks: true } } },
    });

    const stats = await this.viewStatsFor([documentId]);

    return this.toSummary(doc, stats.get(documentId));
  }

  private toSummary(
    doc: {
      id: string;
      name: string;
      mimeType: string;
      sizeBytes: number;
      pageCount: number | null;
      createdAt: Date;
      _count: { shareLinks: number };
    },
    stat?: { totalViews: number; uniqueViewers: number; lastViewedAt: string | null },
  ): DocumentSummary {
    return {
      id: doc.id,
      name: doc.name,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      pageCount: doc.pageCount,
      createdAt: doc.createdAt.toISOString(),
      shareLinkCount: doc._count.shareLinks,
      totalViews: stat?.totalViews ?? 0,
      uniqueViewers: stat?.uniqueViewers ?? 0,
      lastViewedAt: stat?.lastViewedAt ?? null,
    };
  }

  async findOwned(ownerId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, ownerId, archivedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async rename(
    ownerId: string,
    documentId: string,
    dto: RenameDocumentDto,
  ): Promise<DocumentSummary> {
    await this.findOwned(ownerId, documentId);
    await this.prisma.document.update({
      where: { id: documentId },
      data: { name: dto.name.trim() },
    });

    const summary = await this.summaryFor(ownerId, documentId);

    return summary;
  }

  async archive(ownerId: string, documentId: string): Promise<void> {
    const document = await this.findOwned(ownerId, documentId);
    await this.prisma.document.update({
      where: { id: document.id },
      data: { archivedAt: new Date() },
    });
  }

  async downloadUrl(ownerId: string, documentId: string): Promise<string> {
    const document = await this.findOwned(ownerId, documentId);
    return this.storage.createDownloadUrl(document.fileKey);
  }

  private async viewStatsFor(
    documentIds: string[],
  ): Promise<
    Map<string, { totalViews: number; uniqueViewers: number; lastViewedAt: string | null }>
  > {
    const rows = await this.prisma.$queryRaw<ViewStatsRow[]>`
      SELECT s."documentId"                                        AS "documentId",
             COUNT(v.id)                                           AS "totalViews",
             COUNT(DISTINCT COALESCE(v."viewerEmail", v."ipHash")) AS "uniqueViewers",
             MAX(v."openedAt")                                     AS "lastViewedAt"
      FROM "share_links" s
      JOIN "document_views" v ON v."shareLinkId" = s.id AND v."isBot" = false
      WHERE s."documentId" = ANY(${documentIds})
      GROUP BY s."documentId"
    `;

    return new Map(
      rows.map((row) => [
        row.documentId,
        {
          totalViews: Number(row.totalViews),
          uniqueViewers: Number(row.uniqueViewers),
          lastViewedAt: row.lastViewedAt?.toISOString() ?? null,
        },
      ]),
    );
  }
}
