import { useState } from 'react';
import type { ViewEvent } from '@dealroom/shared';
import { Badge } from '../../components/ui/badge';
import { formatDuration, formatExact } from '../../lib/format';

const viewerLabel = (view: ViewEvent): string =>
  view.viewerEmail ?? view.recipientName ?? 'Unidentified viewer';

const context = (view: ViewEvent): string =>
  [view.browser, view.os, view.country].filter(Boolean).join(' · ') ||
  'Unknown device';

export const ViewTimeline = ({ views }: { views: ViewEvent[] }) => {
  const [showBots, setShowBots] = useState(false);

  const humans = views.filter((view) => !view.isBot);
  const bots = views.filter((view) => view.isBot);
  const visible = showBots ? views : humans;

  if (humans.length === 0 && bots.length === 0) {
    return (
      <p className="text-[0.8125rem] leading-relaxed text-ink-faint">
        No opens recorded yet.
      </p>
    );
  }

  return (
    <div>
      {bots.length > 0 ? (
        <label className="mb-4 flex cursor-pointer items-center gap-2.5 text-[0.8125rem] text-ink-soft">
          <input
            type="checkbox"
            checked={showBots}
            onChange={(event) => setShowBots(event.target.checked)}
            className="size-4 accent-[var(--color-brand)]"
          />
          Show {bots.length} automated {bots.length === 1 ? 'hit' : 'hits'}{' '}
          excluded from the counts
        </label>
      ) : null}

      <ol className="space-y-4">
        {visible.map((view) => (
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
    </div>
  );
};
