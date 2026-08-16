import type {
  ActivityItem,
  DocumentAnalytics,
  HeartbeatInput,
  Page,
  PageQuery,
  ViewEvent,
} from '@dealroom/shared';
import { baseApi } from './base.api';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    documentAnalytics: builder.query<DocumentAnalytics, string>({
      query: (documentId) => ({ url: `/documents/${documentId}/analytics` }),
      providesTags: ['Analytics'],
    }),

    documentViews: builder.query<
      Page<ViewEvent>,
      { documentId: string; includeBots?: boolean } & PageQuery
    >({
      query: ({ documentId, ...params }) => ({
        url: `/documents/${documentId}/views`,
        params,
      }),
      providesTags: ['Analytics'],
    }),

    activityFeed: builder.query<Page<ActivityItem>, PageQuery>({
      query: (params) => ({ url: '/activity', params }),
      providesTags: ['Activity'],
    }),

    heartbeat: builder.mutation<void, HeartbeatInput>({
      query: (body) => ({
        url: '/analytics/heartbeat',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useDocumentAnalyticsQuery,
  useDocumentViewsQuery,
  useActivityFeedQuery,
  useHeartbeatMutation,
} = analyticsApi;
