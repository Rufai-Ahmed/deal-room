import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import {
  useDocumentAnalyticsQuery,
  useListDocumentsQuery,
  useListShareLinksQuery,
} from '../apis';
import { AppShell } from '../components/layout/app-shell';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { Spinner } from '../components/ui/spinner';
import { Stat } from '../components/ui/stat';
import { PageAttention } from '../features/analytics/page-attention';
import { ViewTimeline } from '../features/analytics/view-timeline';
import { CreateShareDialog } from '../features/sharing/create-share-dialog';
import { ShareLinksPanel } from '../features/sharing/share-links-panel';
import { formatDuration, formatRelative } from '../lib/format';

const Section = ({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="mt-12">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="eyebrow">{title}</h2>
      {aside}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

export const DocumentDetailPage = () => {
  const { documentId } = useParams({ from: '/documents/$documentId' });
  const [shareOpen, setShareOpen] = useState(false);

  const { data: documents } = useListDocumentsQuery();
  const { data: links, isLoading: linksLoading } =
    useListShareLinksQuery(documentId);
  const { data: analytics, isLoading: analyticsLoading } =
    useDocumentAnalyticsQuery(documentId);

  const document = documents?.find((item) => item.id === documentId);

  return (
    <AppShell>
      <Link
        to="/documents"
        className="text-[0.8125rem] text-ink-faint underline-offset-4 hover:text-ink hover:underline"
      >
        Back to deal room
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-4xl leading-tight text-ink">
            {document?.name ?? 'Document'}
          </h1>
          <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
            {document?.pageCount ? `${document.pageCount} pages · ` : ''}
            {links?.length ?? 0} share{' '}
            {(links?.length ?? 0) === 1 ? 'link' : 'links'}
          </p>
        </div>
        <Button onClick={() => setShareOpen(true)}>Create share link</Button>
      </div>

      {analyticsLoading ? (
        <div className="flex justify-center py-16 text-ink-faint">
          <Spinner />
        </div>
      ) : analytics ? (
        <div className="mt-8 grid grid-cols-2 gap-6 border-y border-rule py-6 sm:grid-cols-5">
          <Stat label="Opens" value={analytics.totalViews} />
          <Stat label="Unique viewers" value={analytics.uniqueViewers} />
          <Stat
            label="Total time"
            value={
              analytics.totalDurationMs > 0
                ? formatDuration(analytics.totalDurationMs)
                : '—'
            }
          />
          <Stat
            label="Average visit"
            value={
              analytics.averageDurationMs > 0
                ? formatDuration(analytics.averageDurationMs)
                : '—'
            }
          />
          <Stat
            label="Last opened"
            value={
              <span className="text-base">
                {formatRelative(analytics.lastViewedAt)}
              </span>
            }
            detail={
              analytics.botHits > 0
                ? `${analytics.botHits} automated ${
                    analytics.botHits === 1 ? 'hit' : 'hits'
                  } excluded`
                : undefined
            }
          />
        </div>
      ) : null}

      <Section title="Share links">
        {linksLoading ? (
          <div className="flex justify-center py-10 text-ink-faint">
            <Spinner />
          </div>
        ) : links?.length ? (
          <ShareLinksPanel links={links} />
        ) : (
          <EmptyState
            title="No links yet"
            body="Create a separate link for each investor so you can tell whose attention you actually have."
            action={
              <Button onClick={() => setShareOpen(true)}>
                Create the first link
              </Button>
            }
          />
        )}
      </Section>

      <div className="grid gap-12 lg:grid-cols-2">
        <Section title="Attention by page">
          <PageAttention
            pages={analytics?.pageEngagement ?? []}
            pageCount={document?.pageCount ?? null}
          />
        </Section>

        <Section title="Every open">
          <ViewTimeline views={analytics?.views ?? []} />
        </Section>
      </div>

      <CreateShareDialog
        documentId={documentId}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </AppShell>
  );
};
