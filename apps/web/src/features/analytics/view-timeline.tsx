import type { ViewEvent } from '@dealroom/shared';
import { Badge } from '../../components/ui/badge';
import { LoadMore } from '../../components/ui/load-more';
import { Spinner } from '../../components/ui/spinner';
import { formatDuration, formatExact } from '../../lib/format';

const viewerLabel = (view: ViewEvent): string =>
  view.viewerEmail ?? view.recipientName ?? 'Unidentified viewer';

const context = (view: ViewEvent): string =>
  [view.browser, view.os, view.country].filter(Boolean).join(' · ') ||
  'Unknown device';

interface ViewTimelineProps {
  views: ViewEvent[];
  botHits: number;
  showBots: boolean;
  onShowBotsChange: (value: boolean) => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const ViewTimeline = ({
  views,
  botHits,
  showBots,
  onShowBotsChange,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: ViewTimelineProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-ink-faint">
        <Spinner />
      </div>
    );
  }

  if (views.length === 0 && botHits === 0) {
    return (
      <p className="text-[0.8125rem] leading-relaxed text-ink-faint">
        No opens recorded yet.
      </p>
    );
  }

  return (
    <div>
      {botHits > 0 ? (
        <label className="mb-4 flex cursor-pointer items-center gap-2.5 text-[0.8125rem] text-ink-soft">
          <input
            type="checkbox"
            checked={showBots}
            onChange={(event) => onShowBotsChange(event.target.checked)}
            className="size-4 accent-[var(--color-brand)]"
          />
          Show {botHits} automated {botHits === 1 ? 'hit' : 'hits'} excluded from
          the counts
        </label>
      ) : null}

      <ol className="space-y-4">
        {views.map((view) => (
          <li
            key={view.id}
            className="grid gap-1 border-l-2 border-rule pl-4 sm:grid-cols-[1fr_auto]"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-ink">
                  {viewerLabel(view)}
                </span>
                {view.isBot ? (
                  <Badge tone="neutral">{view.botReason ?? 'Automated'}</Badge>
                ) : null}
                {view.recipientName && view.viewerEmail ? (
                  <Badge tone="brand">{view.recipientName}</Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-[0.75rem] text-ink-faint">
                {context(view)}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="numeric text-[0.8125rem] text-ink">
                {formatExact(view.openedAt)}
              </p>
              <p className="numeric mt-0.5 text-[0.75rem] text-ink-faint">
                {view.durationMs > 0
                  ? `${formatDuration(view.durationMs)} in document`
                  : 'No dwell recorded'}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <LoadMore
        hasMore={hasMore}
        isLoading={isLoadingMore}
        onClick={onLoadMore}
        label="Load older opens"
      />
    </div>
  );
};
