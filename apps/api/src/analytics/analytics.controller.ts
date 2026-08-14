import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActivityItem, DocumentAnalytics } from '@dealroom/shared';
import { CurrentUser, RequestUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { HeartbeatDto } from './dto/analytics.dto';
import { ViewSessionService } from './view-session.service';
import { ViewTrackingService } from './view-tracking.service';

@ApiTags('analytics')
@Controller()
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly tracking: ViewTrackingService,
    private readonly sessions: ViewSessionService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('documents/:id/analytics')
  forDocument(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<DocumentAnalytics> {
    return this.analytics.forDocument(user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('activity')
  activity(@CurrentUser() user: RequestUser): Promise<ActivityItem[]> {
    return this.analytics.activityFeed(user.id);
  }

  @Post('analytics/heartbeat')
  @HttpCode(204)
  async heartbeat(@Body() dto: HeartbeatDto): Promise<void> {
    const session = this.sessions.verify(dto.viewSessionToken);
    await this.tracking.heartbeat(session.viewId, dto.durationMs, dto.pages);
  }
}
