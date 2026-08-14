import type {
  CreateShareLinkInput,
  IdentifyViewerInput,
  ShareLinkSummary,
  SharedDocumentView,
  UpdateShareLinkInput,
} from '@dealroom/shared';
import { baseApi } from './base.api';

export const shareApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listShareLinks: builder.query<ShareLinkSummary[], string>({
      query: (documentId) => ({ url: `/documents/${documentId}/share-links` }),
      providesTags: ['ShareLink'],
    }),

    createShareLink: builder.mutation<
      ShareLinkSummary,
      { documentId: string } & CreateShareLinkInput
    >({
      query: ({ documentId, ...body }) => ({
        url: `/documents/${documentId}/share-links`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ShareLink', 'Document'],
    }),

    updateShareLink: builder.mutation<
      ShareLinkSummary,
      { id: string } & UpdateShareLinkInput
    >({
      query: ({ id, ...body }) => ({
        url: `/share-links/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['ShareLink'],
    }),

    revokeShareLink: builder.mutation<void, string>({
      query: (id) => ({ url: `/share-links/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ShareLink', 'Document'],
    }),

    sharedDocument: builder.query<
      SharedDocumentView,
      { token: string; viewSessionToken?: string | null }
    >({
      query: ({ token, viewSessionToken }) => ({
        url: `/share/${token}`,
        params: viewSessionToken ? { vs: viewSessionToken } : undefined,
      }),
    }),

    identifyViewer: builder.mutation<
      SharedDocumentView,
      { token: string; viewSessionToken: string | null } & IdentifyViewerInput
    >({
      query: ({ token, ...body }) => ({
        url: `/share/${token}/identify`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useListShareLinksQuery,
  useCreateShareLinkMutation,
  useUpdateShareLinkMutation,
  useRevokeShareLinkMutation,
  useSharedDocumentQuery,
  useIdentifyViewerMutation,
} = shareApi;
