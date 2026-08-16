import { paginate } from './paginate';

const rows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `id-${index}` }));

describe('paginate', () => {
  it('returns everything and no cursor when the page is not full', () => {
    const page = paginate(rows(3), 5, (row) => row.id);

    expect(page.items).toHaveLength(3);
    expect(page.nextCursor).toBeNull();
  });

  it('returns no cursor when the row count exactly fills the page', () => {
    const page = paginate(rows(5), 5, (row) => row.id);

    expect(page.items).toHaveLength(5);
    expect(page.nextCursor).toBeNull();
  });

  // Callers fetch limit + 1 so the extra row is what proves another page exists.
  it('drops the probe row and points the cursor at the last kept row', () => {
    const page = paginate(rows(6), 5, (row) => row.id);

    expect(page.items).toHaveLength(5);
    expect(page.items.at(-1)?.id).toBe('id-4');
    expect(page.nextCursor).toBe('id-4');
  });

  it('handles an empty result', () => {
    const page = paginate([], 5, (row: { id: string }) => row.id);

    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it('never returns a cursor that is not in the returned items', () => {
    const page = paginate(rows(20), 5, (row) => row.id);

    expect(page.items.map((row) => row.id)).toContain(page.nextCursor);
  });
});
