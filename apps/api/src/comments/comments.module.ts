import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SharingModule } from '../sharing/sharing.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [ConfigModule, SharingModule, AnalyticsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
