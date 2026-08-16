export interface PageEngagement {
  page: number;
  durationMs: number;
}

export interface ViewEvent {
  id: string;
  shareLinkId: string;
  recipientName: string | null;
  openedAt: string;
  lastSeenAt: string;
  durationMs: number;
  viewerEmail: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  isBot: boolean;
  botReason: string | null;
  pages: PageEngagement[];
}

export interface DocumentAnalytics {
  documentId: string;
  totalViews: number;
  uniqueViewers: number;
  totalDurationMs: number;
  averageDurationMs: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  botHits: number;
  pageEngagement: PageEngagement[];
}

export interface HeartbeatInput {
  viewSessionToken: string;
  durationMs: number;
  pages: PageEngagement[];
}

export interface ActivityItem {
  id: string;
  type: 'view' | 'comment';
  documentId: string;
  documentName: string;
  shareLinkId: string;
  recipientName: string | null;
  viewerLabel: string;
  occurredAt: string;
  detail: string | null;
}
