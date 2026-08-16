import type {
  CreateDocumentInput,
  DocumentSummary,
  DocumentUploadTicket,
  Page,
  PageQuery,
  RenameDocumentInput,
  RequestUploadInput,
} from '@dealroom/shared';
import { baseApi } from './base.api';

export const documentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listDocuments: builder.query<Page<DocumentSummary>, PageQuery>({
      query: (params) => ({ url: '/documents', params }),
      providesTags: ['Document'],
    }),

    getDocument: builder.query<DocumentSummary, string>({
      query: (id) => ({ url: `/documents/${id}` }),
      providesTags: ['Document'],
    }),

    requestUpload: builder.mutation<DocumentUploadTicket, RequestUploadInput>({
      query: (body) => ({
        url: '/documents/upload-ticket',
        method: 'POST',
        body,
      }),
    }),

    createDocument: builder.mutation<DocumentSummary, CreateDocumentInput>({
      query: (body) => ({ url: '/documents', method: 'POST', body }),
      invalidatesTags: ['Document', 'Activity'],
    }),

    renameDocument: builder.mutation<
      DocumentSummary,
      { id: string } & RenameDocumentInput
    >({
      query: ({ id, ...body }) => ({
        url: `/documents/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Document'],
    }),

    archiveDocument: builder.mutation<void, string>({
      query: (id) => ({ url: `/documents/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Document', 'Activity'],
    }),

    documentDownloadUrl: builder.mutation<{ url: string }, string>({
      query: (id) => ({ url: `/documents/${id}/download` }),
    }),
  }),
});

export const {
  useListDocumentsQuery,
  useGetDocumentQuery,
  useRequestUploadMutation,
  useCreateDocumentMutation,
  useRenameDocumentMutation,
  useArchiveDocumentMutation,
  useDocumentDownloadUrlMutation,
} = documentApi;
