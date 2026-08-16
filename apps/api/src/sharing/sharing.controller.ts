import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  DEFAULT_PAGE_SIZE,
  type Page,
  type ShareLinkSummary,
} from '@dealroom/shared';
import { CurrentUser, type RequestUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PageQueryDto } from '../common/page-query.dto';
import { CreateShareLinkDto, UpdateShareLinkDto } from './dto/share.dto';
import { SharingService } from './sharing.service';

@ApiTags('share-links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SharingController {
  constructor(private readonly sharing: SharingService) {}

  @Get('documents/:documentId/share-links')
  list(
    @CurrentUser() user: RequestUser,
    @Param('documentId') documentId: string,
    @Query() query: PageQueryDto,
  ): Promise<Page<ShareLinkSummary>> {
    return this.sharing.listForDocument(user.id, documentId, {
      cursor: query.cursor,
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
    });
  }

  @Post('documents/:documentId/share-links')
  create(
    @CurrentUser() user: RequestUser,
    @Param('documentId') documentId: string,
    @Body() dto: CreateShareLinkDto,
  ): Promise<ShareLinkSummary> {
    return this.sharing.create(user.id, documentId, dto);
  }

  @Patch('share-links/:id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateShareLinkDto,
  ): Promise<ShareLinkSummary> {
    return this.sharing.update(user.id, id, dto);
  }

  @Delete('share-links/:id')
  @HttpCode(204)
  revoke(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.sharing.revoke(user.id, id);
  }
}
