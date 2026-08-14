export interface DocumentSummary {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number | null;
  createdAt: string;
  shareLinkCount: number;
  totalViews: number;
  uniqueViewers: number;
  lastViewedAt: string | null;
}

export interface DocumentUploadTicket {
  uploadUrl: string;
  fileKey: string;
  method: 'PUT' | 'POST';
  headers: Record<string, string>;
}

export interface RequestUploadInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface CreateDocumentInput {
  name: string;
  fileKey: string;
  mimeType: string;
  sizeBytes: number;
  pageCount?: number;
}

export interface RenameDocumentInput {
  name: string;
}

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
] as const;

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
