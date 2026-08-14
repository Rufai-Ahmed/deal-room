import type {
  CommentView,
  CreateCommentInput,
  PostViewerCommentInput,
} from '@dealroom/shared';
import { baseApi } from './base.api';

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    shareLinkComments: builder.query<CommentView[], string>({
      query: (shareLinkId) => ({ url: `/share-links/${shareLinkId}/comments` }),
      providesTags: ['Comment'],
    }),

    replyToShareLink: builder.mutation<
      CommentView,
      { shareLinkId: string } & CreateCommentInput
    >({
      query: ({ shareLinkId, ...body }) => ({
        url: `/share-links/${shareLinkId}/comments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Comment', 'Activity'],
    }),

    viewerComments: builder.query<
      CommentView[],
      { token: string; viewSessionToken?: string | null }
    >({
      query: ({ token, viewSessionToken }) => ({
        url: `/share/${token}/comments`,
        params: viewSessionToken ? { vs: viewSessionToken } : undefined,
      }),
      providesTags: ['Comment'],
    }),

    postViewerComment: builder.mutation<
      CommentView,
      { token: string } & PostViewerCommentInput
    >({
      query: ({ token, ...body }) => ({
        url: `/share/${token}/comments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Comment'],
    }),
  }),
});

export const {
  useShareLinkCommentsQuery,
  useReplyToShareLinkMutation,
  useViewerCommentsQuery,
  usePostViewerCommentMutation,
} = commentApi;
