import type {
  CommentView,
  CreateCommentInput,
  Page,
  PageQuery,
  PostViewerCommentInput,
} from '@dealroom/shared';
import { baseApi } from './base.api';

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    shareLinkComments: builder.query<
      Page<CommentView>,
      { shareLinkId: string } & PageQuery
    >({
      query: ({ shareLinkId, ...params }) => ({
        url: `/share-links/${shareLinkId}/comments`,
        params,
      }),
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
      Page<CommentView>,
      { token: string; viewSessionToken?: string | null } & PageQuery
    >({
      query: ({ token, viewSessionToken, ...params }) => ({
        url: `/share/${token}/comments`,
        params: viewSessionToken ? { vs: viewSessionToken, ...params } : params,
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
