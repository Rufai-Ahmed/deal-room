export interface CommentView {
  id: string;
  body: string;
  page: number | null;
  authorName: string;
  authorEmail: string | null;
  fromOwner: boolean;
  createdAt: string;
}

export interface CreateCommentInput {
  body: string;
  page?: number | null;
}

export interface PostViewerCommentInput extends CreateCommentInput {
  viewSessionToken: string;
}
