import { useEffect, useMemo, useState } from 'react';
import type { Page } from '@dealroom/shared';

interface QueryResult<T> {
  data?: Page<T>;
  isLoading: boolean;
  isFetching: boolean;
}

type ListQuery<T, A> = (
  args: A & { cursor?: string },
  options?: { skip?: boolean },
) => QueryResult<T>;

export function useCursorList<T, A extends object>(
  useListQuery: ListQuery<T, A>,
  args: A,
  options?: { skip?: boolean },
) {
  const [cursor, setCursor] = useState<string | undefined>();
  const [pages, setPages] = useState<{ cursor?: string; items: T[] }[]>([]);

  const argsKey = JSON.stringify(args);
  const result = useListQuery({ ...args, cursor }, options);

  useEffect(() => {
    setPages([]);
    setCursor(undefined);
  }, [argsKey]);

  useEffect(() => {
    if (!result.data) {
      return;
    }

    const items = result.data.items;

    setPages((previous) => {
      const index = previous.findIndex((page) => page.cursor === cursor);
      if (index === -1) {
        return [...previous, { cursor, items }];
      }

      const next = [...previous];
      next[index] = { cursor, items };
      return next;
    });
  }, [result.data, cursor]);

  const items = useMemo(() => pages.flatMap((page) => page.items), [pages]);

  return {
    items,
    isLoading: result.isLoading && items.length === 0,
    isLoadingMore: result.isFetching && cursor !== undefined,
    hasMore: Boolean(result.data?.nextCursor),
    loadMore: () => setCursor(result.data?.nextCursor ?? undefined),
  };
}
