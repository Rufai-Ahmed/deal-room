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
import { CommentView } from '@dealroom/shared';
import { CurrentUser, RequestUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
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
  ): Promise<CommentView[]> {
    return this.comments.listForOwner(user.id, id);
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
  ): Promise<CommentView[]> {
    return this.comments.listForViewer(token, viewSessionToken);
  }

  @Post('share/:token/comments')
  postAsViewer(
    @Param('token') token: string,
    @Body() dto: PostViewerCommentDto,
  ): Promise<CommentView> {
    return this.comments.postAsViewer(token, dto);
  }
}
