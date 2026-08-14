export interface UploadTarget {
  uploadUrl: string;
  method: 'PUT' | 'POST';
  headers: Record<string, string>;
}

export interface StorageDriver {
  createUploadTarget(fileKey: string, mimeType: string): Promise<UploadTarget>;
  createDownloadUrl(fileKey: string, expiresInSeconds: number): Promise<string>;
  delete(fileKey: string): Promise<void>;
}

export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');
