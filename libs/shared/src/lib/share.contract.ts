export type ShareLinkStatus = 'active' | 'revoked' | 'expired';

export interface ShareLinkSummary {
  id: string;
  token: string;
  url: string;
  recipientName: string | null;
  recipientEmail: string | null;
  requireEmail: boolean;
  allowDownload: boolean;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: ShareLinkStatus;
  totalViews: number;
  uniqueViewers: number;
  lastViewedAt: string | null;
  totalDurationMs: number;
  commentCount: number;
}

export interface CreateShareLinkInput {
  recipientName?: string;
  recipientEmail?: string;
  requireEmail?: boolean;
  allowDownload?: boolean;
  expiresAt?: string | null;
}

export interface UpdateShareLinkInput {
  recipientName?: string;
  recipientEmail?: string;
  requireEmail?: boolean;
  allowDownload?: boolean;
  expiresAt?: string | null;
}

export interface SharedDocumentView {
  documentName: string;
  mimeType: string;
  pageCount: number | null;
  allowDownload: boolean;
  requireEmail: boolean;
  identified: boolean;
  fileUrl: string | null;
  viewSessionToken: string | null;
  ownerName: string;
}

export interface IdentifyViewerInput {
  email: string;
  name?: string;
}
