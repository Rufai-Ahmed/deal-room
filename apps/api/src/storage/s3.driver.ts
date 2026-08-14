import { GetObjectCommand, PutObjectCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfig } from '../config/app-config';
import { StorageDriver, UploadTarget } from './storage.types';

export class S3StorageDriver implements StorageDriver {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: AppConfig['storage']['s3']) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      forcePathStyle: Boolean(config.endpoint),
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async createUploadTarget(
    fileKey: string,
    mimeType: string,
  ): Promise<UploadTarget> {
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        ContentType: mimeType,
      }),
      { expiresIn: 600 },
    );

    return {
      uploadUrl,
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
    };
  }

  createDownloadUrl(fileKey: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: fileKey }),
      { expiresIn: expiresInSeconds },
    );
  }

  async delete(fileKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: fileKey }),
    );
  }
}
