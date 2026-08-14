import type {
  ActivityItem,
  DocumentAnalytics,
  HeartbeatInput,
} from '@dealroom/shared';
import { baseApi } from './base.api';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    documentAnalytics: builder.query<DocumentAnalytics, string>({
      query: (documentId) => ({ url: `/documents/${documentId}/analytics` }),
      providesTags: ['Analytics'],
    }),

    activityFeed: builder.query<ActivityItem[], void>({
      query: () => ({ url: '/activity' }),
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
  useActivityFeedQuery,
  useHeartbeatMutation,
} = analyticsApi;
