import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from '../analytics/analytics.module';
import { DocumentsModule } from '../documents/documents.module';
import { StorageModule } from '../storage/storage.module';
import { ShareAccessController } from './share-access.controller';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';

@Module({
  imports: [ConfigModule, DocumentsModule, StorageModule, AnalyticsModule],
  controllers: [SharingController, ShareAccessController],
  providers: [SharingService],
  exports: [SharingService],
})
export class SharingModule {}
