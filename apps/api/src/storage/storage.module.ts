import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/app-config';
import { LocalStorageDriver } from './local.driver';
import { S3StorageDriver } from './s3.driver';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { STORAGE_DRIVER } from './storage.types';

const usingLocalDriver = (process.env.STORAGE_DRIVER ?? 'local') !== 's3';

@Module({
  imports: [ConfigModule],
  controllers: usingLocalDriver ? [StorageController] : [],
  providers: [
    StorageService,
    {
      provide: STORAGE_DRIVER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const storage = config.get('storage', { infer: true });
        if (storage.driver === 's3') {
          return new S3StorageDriver(storage.s3);
        }
        return new LocalStorageDriver(
          storage.localDir,
          config.get('apiUrl', { infer: true }),
          config.get('jwt', { infer: true }).secret,
        );
      },
    },
    {
      provide: 'LOCAL_STORAGE_SECRET',
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) =>
        config.get('jwt', { infer: true }).secret,
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
