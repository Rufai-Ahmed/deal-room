import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { STORAGE_DRIVER, type StorageDriver, type UploadTarget } from './storage.types';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_DRIVER) private readonly driver: StorageDriver,
  ) {}

  buildFileKey(ownerId: string, fileName: string): string {
    const extension = extname(fileName).toLowerCase().slice(0, 12);
    return `documents/${ownerId}/${randomUUID()}${extension}`;
  }

  createUploadTarget(fileKey: string, mimeType: string): Promise<UploadTarget> {
    return this.driver.createUploadTarget(fileKey, mimeType);
  }

  createDownloadUrl(fileKey: string, expiresInSeconds = 300): Promise<string> {
    return this.driver.createDownloadUrl(fileKey, expiresInSeconds);
  }

  delete(fileKey: string): Promise<void> {
    return this.driver.delete(fileKey);
  }
}
