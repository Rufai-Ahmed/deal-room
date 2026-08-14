import { useCallback, useEffect, useRef } from 'react';
import { useHeartbeatMutation } from '../../apis';

const TICK_MS = 1000;
const FLUSH_MS = 10_000;

/// Dwell only accrues while the tab is actually visible, so a document left
/// open in a background tab overnight does not report as ten hours of reading.
export const useViewTracking = (viewSessionToken: string | null) => {
  const [heartbeat] = useHeartbeatMutation();

  const totalMs = useRef(0);
  const pageMs = useRef(new Map<number, number>());
  const currentPage = useRef(1);
  const lastTick = useRef(Date.now());
  const dirty = useRef(false);

  const setPage = useCallback((page: number) => {
    currentPage.current = page;
  }, []);

  const payload = useCallback(
    () => ({
      viewSessionToken: viewSessionToken as string,
      durationMs: Math.round(totalMs.current),
      pages: [...pageMs.current.entries()]
        .filter(([, duration]) => duration >= 500)
        .map(([page, duration]) => ({
          page,
          durationMs: Math.round(duration),
        })),
    }),
    [viewSessionToken],
  );

  useEffect(() => {
    if (!viewSessionToken) {
      return;
    }

    const tick = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTick.current;
      lastTick.current = now;

      if (document.hidden || elapsed > TICK_MS * 5) {
        return;
      }

      totalMs.current += elapsed;
      pageMs.current.set(
        currentPage.current,
        (pageMs.current.get(currentPage.current) ?? 0) + elapsed,
      );
      dirty.current = true;
    }, TICK_MS);

    const flush = setInterval(() => {
      if (!dirty.current) {
        return;
      }
      dirty.current = false;
      void heartbeat(payload());
    }, FLUSH_MS);

    // A closing tab cannot wait for fetch to resolve, so the final reading is
    // handed to the browser to deliver on its own.
    const onLeave = () => {
      if (!dirty.current) {
        return;
      }
      navigator.sendBeacon(
        '/api/analytics/heartbeat',
        new Blob([JSON.stringify(payload())], { type: 'application/json' }),
      );
    };

    document.addEventListener('visibilitychange', onLeave);
    window.addEventListener('pagehide', onLeave);

    return () => {
      clearInterval(tick);
      clearInterval(flush);
      document.removeEventListener('visibilitychange', onLeave);
      window.removeEventListener('pagehide', onLeave);
      onLeave();
    };
  }, [heartbeat, payload, viewSessionToken]);

  return { setPage };
};
