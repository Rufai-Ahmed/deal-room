import type { Page } from '@dealroom/shared';

export const paginate = <T>(
  rows: T[],
  limit: number,
  cursorOf: (row: T) => string,
): Page<T> => {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    nextCursor: hasMore ? cursorOf(items[items.length - 1]) : null,
  };
};
