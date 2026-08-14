import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { SharedDocumentView } from '@dealroom/shared';
import type { Request, Response } from 'express';
import { ViewSessionService } from '../analytics/view-session.service';
import { ViewTrackingService } from '../analytics/view-tracking.service';
import { AppConfig } from '../config/app-config';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { IdentifyViewerDto } from './dto/share.dto';
import { SharingService } from './sharing.service';

type ResolvedLink = Awaited<ReturnType<SharingService['resolveActive']>>;

@ApiTags('share')
@Controller()
export class ShareAccessController {
  constructor(
    private readonly sharing: SharingService,
    private readonly tracking: ViewTrackingService,
    private readonly sessions: ViewSessionService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Get('s/:token')
  async open(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const webUrl = this.config.get('webUrl', { infer: true });

    let link: ResolvedLink;
    try {
      link = await this.sharing.resolveActive(token);
    } catch (error) {
      const status = (error as { response?: { status?: string } }).response
        ?.status;
      res.redirect(302, `${webUrl}/view/${token}?state=${status ?? 'missing'}`);
      return;
    }

    const recorded = await this.tracking.recordOpen(link.id, req);
    if (!recorded.isBot && !link.requireEmail) {
      this.notifyOwner(link, link.recipientName ?? 'Someone');
    }

    res.redirect(
      302,
      `${webUrl}/view/${token}#vs=${encodeURIComponent(recorded.viewSessionToken)}`,
    );
  }

  @Get('share/:token')
  async detail(
    @Param('token') token: string,
    @Query('vs') viewSessionToken: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SharedDocumentView> {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const link = await this.sharing.resolveActive(token);

    const session = this.sessions.tryVerify(viewSessionToken);
    let viewId = session?.shareLinkId === link.id ? session.viewId : null;
    let sessionToken = viewId ? (viewSessionToken as string) : null;

    if (!viewId) {
      const recorded = await this.tracking.recordOpen(link.id, req);
      viewId = recorded.viewId;
      sessionToken = recorded.viewSessionToken;
      if (!recorded.isBot && !link.requireEmail) {
        this.notifyOwner(link, link.recipientName ?? 'Someone');
      }
    }

    const view = await this.prisma.documentView.findUnique({
      where: { id: viewId },
      select: { viewerEmail: true },
    });

    const identified = !link.requireEmail || Boolean(view?.viewerEmail);

    return this.toSharedView(link, identified, sessionToken);
  }

  @Post('share/:token/identify')
  async identify(
    @Param('token') token: string,
    @Body() dto: IdentifyViewerDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SharedDocumentView> {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const link = await this.sharing.resolveActive(token);

    const session = this.sessions.tryVerify(dto.viewSessionToken);
    let viewId = session?.shareLinkId === link.id ? session.viewId : null;
    let sessionToken = viewId ? (dto.viewSessionToken as string) : null;

    if (!viewId) {
      const recorded = await this.tracking.recordOpen(link.id, req);
      viewId = recorded.viewId;
      sessionToken = recorded.viewSessionToken;
    }

    await this.tracking.identifyViewer(viewId, dto.email, dto.name);
    this.notifyOwner(link, dto.name?.trim() || dto.email);

    return this.toSharedView(link, true, sessionToken);
  }

  private async toSharedView(
    link: ResolvedLink,
    identified: boolean,
    viewSessionToken: string | null,
  ): Promise<SharedDocumentView> {
    return {
      documentName: link.document.name,
      mimeType: link.document.mimeType,
      pageCount: link.document.pageCount,
      allowDownload: link.allowDownload,
      requireEmail: link.requireEmail,
      identified,
      fileUrl: identified
        ? await this.storage.createDownloadUrl(link.document.fileKey, 900)
        : null,
      viewSessionToken,
      ownerName: link.document.owner.name,
    };
  }

  private notifyOwner(link: ResolvedLink, viewerLabel: string): void {
    this.notifications.documentOpened({
      to: link.document.owner.email,
      founderName: link.document.owner.name,
      documentName: link.document.name,
      viewerLabel,
      recipientName: link.recipientName,
      openedAt: new Date(),
      documentUrl: `${this.config.get('webUrl', { infer: true })}/documents/${link.document.id}`,
    });
  }
}
