import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DocumentsModule } from '../documents/documents.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ViewSessionService } from './view-session.service';
import { ViewTrackingService } from './view-tracking.service';

@Module({
  imports: [ConfigModule, JwtModule.register({}), DocumentsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ViewTrackingService, ViewSessionService],
  exports: [ViewTrackingService, ViewSessionService],
})
export class AnalyticsModule {}
