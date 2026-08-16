export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PageQuery {
  cursor?: string;
  limit?: number;
}

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
