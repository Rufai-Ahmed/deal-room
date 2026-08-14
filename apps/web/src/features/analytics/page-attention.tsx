import type { PageEngagement } from '@dealroom/shared';
import { formatDuration } from '../../lib/format';

interface PageAttentionProps {
  pages: PageEngagement[];
  pageCount: number | null;
}

/// Total dwell per page. Rendered as plain divs rather than a chart library so
/// it stays legible at any width and carries no runtime cost.
export const PageAttention = ({ pages, pageCount }: PageAttentionProps) => {
  if (pages.length === 0) {
    return (
      <p className="text-[0.8125rem] leading-relaxed text-ink-faint">
        Page attention appears once someone opens the document and scrolls
        through it.
      </p>
    );
  }

  const byPage = new Map(pages.map((page) => [page.page, page.durationMs]));
  const total = pageCount ?? Math.max(...pages.map((page) => page.page));
  const peak = Math.max(...pages.map((page) => page.durationMs), 1);
  const busiest = pages.reduce((best, page) =>
    page.durationMs > best.durationMs ? page : best,
  );

  return (
    <div>
      <div className="space-y-1.5">
        {Array.from({ length: total }, (_, index) => index + 1).map((page) => {
          const duration = byPage.get(page) ?? 0;
          const share = (duration / peak) * 100;

          return (
            <div key={page} className="flex items-center gap-3">
              <span className="numeric w-7 shrink-0 text-right text-[0.75rem] text-ink-faint">
                {page}
              </span>
              <div className="h-5 flex-1 overflow-hidden rounded-sm bg-paper-sunk">
                <div
                  className={`h-full rounded-sm ${
                    page === busiest.page ? 'bg-signal' : 'bg-brand'
                  }`}
                  style={{ width: `${Math.max(share, duration > 0 ? 2 : 0)}%` }}
                />
              </div>
              <span className="numeric w-14 shrink-0 text-right text-[0.75rem] text-ink-soft">
                {duration > 0 ? formatDuration(duration) : '—'}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[0.8125rem] text-ink-soft">
        Most attention landed on{' '}
        <span className="font-medium text-ink">page {busiest.page}</span>, held
        for {formatDuration(busiest.durationMs)}.
      </p>
    </div>
  );
};
