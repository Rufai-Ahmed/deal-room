import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommentView } from '@dealroom/shared';
import { ViewSessionService } from '../analytics/view-session.service';
import { AppConfig } from '../config/app-config';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SharingService } from '../sharing/sharing.service';
import { CreateCommentDto, PostViewerCommentDto } from './dto/comment.dto';

type CommentRecord = {
  id: string;
  body: string;
  page: number | null;
  authorUserId: string | null;
  authorEmail: string | null;
  authorName: string | null;
  createdAt: Date;
};

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharing: SharingService,
    private readonly sessions: ViewSessionService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async listForOwner(
    ownerId: string,
    shareLinkId: string,
  ): Promise<CommentView[]> {
    await this.assertOwnsLink(ownerId, shareLinkId);
    return this.list(shareLinkId);
  }

  async replyAsOwner(
    ownerId: string,
    shareLinkId: string,
    dto: CreateCommentDto,
  ): Promise<CommentView> {
    const link = await this.assertOwnsLink(ownerId, shareLinkId);
    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      select: { name: true },
    });

    const comment = await this.prisma.comment.create({
      data: {
        shareLinkId,
        body: dto.body.trim(),
        page: dto.page ?? null,
        authorUserId: ownerId,
        authorName: owner.name,
      },
    });

    if (link.recipientEmail) {
      this.notifications.newComment({
        to: link.recipientEmail,
        recipientName: link.recipientName ?? 'there',
        documentName: link.document.name,
        authorLabel: owner.name,
        body: comment.body,
        url: `${this.config.get('webUrl', { infer: true })}/view/${link.token}`,
      });
    }

    return this.toView(comment);
  }

  async listForViewer(
    token: string,
    viewSessionToken: string | undefined,
  ): Promise<CommentView[]> {
    const link = await this.sharing.resolveActive(token);
    const session = this.sessions.tryVerify(viewSessionToken);
    if (session?.shareLinkId !== link.id) {
      return [];
    }
    return this.list(link.id);
  }

  async postAsViewer(
    token: string,
    dto: PostViewerCommentDto,
  ): Promise<CommentView> {
    const link = await this.sharing.resolveActive(token);
    const session = this.sessions.verify(dto.viewSessionToken);

    if (session.shareLinkId !== link.id) {
      throw new ForbiddenException('This session does not belong to the link');
    }

    const view = await this.prisma.documentView.findUnique({
      where: { id: session.viewId },
      select: { viewerEmail: true, viewerName: true },
    });

    if (link.requireEmail && !view?.viewerEmail) {
      throw new BadRequestException(
        'Identify yourself before commenting on this document',
      );
    }

    const authorName =
      view?.viewerName ?? view?.viewerEmail ?? link.recipientName ?? 'Viewer';

    const comment = await this.prisma.comment.create({
      data: {
        shareLinkId: link.id,
        body: dto.body.trim(),
        page: dto.page ?? null,
        authorEmail: view?.viewerEmail ?? null,
        authorName,
      },
    });

    this.notifications.newComment({
      to: link.document.owner.email,
      recipientName: link.document.owner.name,
      documentName: link.document.name,
      authorLabel: authorName,
      body: comment.body,
      url: `${this.config.get('webUrl', { infer: true })}/documents/${link.document.id}`,
    });

    return this.toView(comment);
  }

  private async list(shareLinkId: string): Promise<CommentView[]> {
    const comments = await this.prisma.comment.findMany({
      where: { shareLinkId },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((comment) => this.toView(comment));
  }

  private async assertOwnsLink(ownerId: string, shareLinkId: string) {
    const link = await this.prisma.shareLink.findUnique({
      where: { id: shareLinkId },
      include: {
        document: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!link) {
      throw new NotFoundException('Share link not found');
    }
    if (link.document.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this share link');
    }

    return link;
  }

  private toView(comment: CommentRecord): CommentView {
    return {
      id: comment.id,
      body: comment.body,
      page: comment.page,
      authorName: comment.authorName ?? 'Viewer',
      authorEmail: comment.authorEmail,
      fromOwner: Boolean(comment.authorUserId),
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
