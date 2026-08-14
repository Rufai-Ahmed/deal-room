import { mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { signLocalKey } from './local-signature';
import { StorageDriver, UploadTarget } from './storage.types';

/// Development driver. Files land on local disk and are served back through
/// signed URLs so the viewer path behaves the same as it does against S3.
export class LocalStorageDriver implements StorageDriver {
  constructor(
    private readonly rootDir: string,
    private readonly apiUrl: string,
    private readonly secret: string,
  ) {}

  absolutePathFor(fileKey: string): string {
    const root = resolve(this.rootDir);
    const target = resolve(join(root, fileKey));
    if (!target.startsWith(`${root}/`)) {
      throw new Error('Resolved file path escapes the storage root');
    }
    return target;
  }

  async ensureDirectoryFor(fileKey: string): Promise<string> {
    const path = this.absolutePathFor(fileKey);
    await mkdir(dirname(path), { recursive: true });
    return path;
  }

  async createUploadTarget(
    fileKey: string,
    mimeType: string,
  ): Promise<UploadTarget> {
    return {
      uploadUrl: this.signedUrl(fileKey, 600),
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
    };
  }

  async createDownloadUrl(
    fileKey: string,
    expiresInSeconds: number,
  ): Promise<string> {
    return this.signedUrl(fileKey, expiresInSeconds);
  }

  async delete(fileKey: string): Promise<void> {
    await rm(this.absolutePathFor(fileKey), { force: true });
  }

  private signedUrl(fileKey: string, expiresInSeconds: number): string {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const signature = signLocalKey(fileKey, expiresAt, this.secret);
    const params = new URLSearchParams({
      key: fileKey,
      exp: String(expiresAt),
      sig: signature,
    });
    return `${this.apiUrl}/api/storage/local?${params.toString()}`;
  }
}
