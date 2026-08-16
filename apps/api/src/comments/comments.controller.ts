import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  DEFAULT_PAGE_SIZE,
  type CommentView,
  type Page,
} from '@dealroom/shared';
import { CurrentUser, type RequestUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PageQueryDto } from '../common/page-query.dto';
import { CommentsService } from './comments.service';
import { CreateCommentDto, PostViewerCommentDto } from './dto/comment.dto';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('share-links/:id/comments')
  listForOwner(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query() query: PageQueryDto,
  ): Promise<Page<CommentView>> {
    return this.comments.listForOwner(user.id, id, {
      cursor: query.cursor,
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('share-links/:id/comments')
  replyAsOwner(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentView> {
    return this.comments.replyAsOwner(user.id, id, dto);
  }

  @Get('share/:token/comments')
  listForViewer(
    @Param('token') token: string,
    @Query('vs') viewSessionToken: string | undefined,
    @Query() query: PageQueryDto,
  ): Promise<Page<CommentView>> {
    return this.comments.listForViewer(token, viewSessionToken, {
      cursor: query.cursor,
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
    });
  }

  @Post('share/:token/comments')
  postAsViewer(
    @Param('token') token: string,
    @Body() dto: PostViewerCommentDto,
  ): Promise<CommentView> {
    return this.comments.postAsViewer(token, dto);
  }
}
