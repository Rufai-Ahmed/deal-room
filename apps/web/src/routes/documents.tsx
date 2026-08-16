import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useActivityFeedQuery, useListDocumentsQuery } from '../apis';
import { AppShell } from '../components/layout/app-shell';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { LoadMore } from '../components/ui/load-more';
import { Spinner } from '../components/ui/spinner';
import { DocumentActions } from '../features/documents/document-actions';
import { UploadDialog } from '../features/documents/upload-dialog';
import { formatBytes, formatRelative } from '../lib/format';
import { useCursorList } from '../lib/use-cursor-list';

export const DocumentsPage = () => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const documents = useCursorList(useListDocumentsQuery, {});
  const activity = useCursorList(useActivityFeedQuery, { limit: 12 });

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your documents</p>
          <h1 className="mt-2 font-display text-4xl leading-none text-ink">
            Deal room
          </h1>
        </div>
        <Button onClick={() => setUploadOpen(true)}>Add document</Button>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_19rem]">
        <section>
          {documents.isLoading ? (
            <div className="flex justify-center py-16 text-ink-faint">
              <Spinner />
            </div>
          ) : documents.items.length ? (
            <>
              <ul className="divide-y divide-rule border-y border-rule">
                {documents.items.map((document) => (
                  <li key={document.id}>
                    <Link
                      to="/documents/$documentId"
                      params={{ documentId: document.id }}
                      className="group flex items-center gap-5 py-5 transition-colors hover:bg-paper-sunk"
                    >
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-display text-xl leading-snug text-ink">
                          {document.name}
                        </h2>
                        <p className="mt-1 text-[0.8125rem] text-ink-faint">
                          {formatBytes(document.sizeBytes)}
                          {document.pageCount
                            ? ` · ${document.pageCount} pages`
                            : ''}
                          {` · ${document.shareLinkCount} ${
                            document.shareLinkCount === 1 ? 'link' : 'links'
                          }`}
                        </p>

                        <p className="mt-1.5 text-[0.8125rem] text-ink-soft sm:hidden">
                          {document.totalViews === 0 ? (
                            'Not opened yet'
                          ) : (
                            <>
                              <span className="numeric text-ink">
                                {document.totalViews}
                              </span>
                              {document.totalViews === 1 ? ' open' : ' opens'}
                              {' · '}
                              <span className="numeric text-ink">
                                {document.uniqueViewers}
                              </span>
                              {document.uniqueViewers === 1
                                ? ' viewer'
                                : ' viewers'}
                              {' · '}
                              {formatRelative(document.lastViewedAt)}
                            </>
                          )}
                        </p>
                      </div>

                      <dl className="hidden shrink-0 gap-8 sm:flex">
                        <div className="text-right">
                          <dt className="eyebrow">Opens</dt>
                          <dd className="numeric mt-1 text-lg text-ink">
                            {document.totalViews}
                          </dd>
                        </div>
                        <div className="text-right">
                          <dt className="eyebrow">Viewers</dt>
                          <dd className="numeric mt-1 text-lg text-ink">
                            {document.uniqueViewers}
                          </dd>
                        </div>
                        <div className="w-28 text-right">
                          <dt className="eyebrow">Last opened</dt>
                          <dd className="mt-1 text-[0.8125rem] text-ink-soft">
                            {formatRelative(document.lastViewedAt)}
                          </dd>
                        </div>
                      </dl>

                      <span
                        className="shrink-0"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <DocumentActions document={document} />
                      </span>

                      <span className="text-ink-faint transition-transform group-hover:translate-x-0.5">
                        <svg
                          viewBox="0 0 16 16"
                          className="size-4"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="m6 3.5 4.5 4.5L6 12.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <LoadMore
                hasMore={documents.hasMore}
                isLoading={documents.isLoadingMore}
                onClick={documents.loadMore}
                label="Load more documents"
              />
            </>
          ) : (
            <EmptyState
              title="Nothing shared yet"
              body="Upload a deck or a data room document, then create a link for each investor you are talking to."
              action={
                <Button onClick={() => setUploadOpen(true)}>
                  Add your first document
                </Button>
              }
            />
          )}
        </section>

        <aside>
          <p className="eyebrow">Recent activity</p>
          {activity.items.length ? (
            <>
              <ul className="mt-4 space-y-4">
                {activity.items.map((item) => (
                  <li key={item.id} className="border-l-2 border-rule pl-3.5">
                    <div className="flex items-center gap-2">
                      <Badge tone={item.type === 'view' ? 'brand' : 'signal'}>
                        {item.type === 'view' ? 'Opened' : 'Comment'}
                      </Badge>
                      <span className="text-[0.75rem] text-ink-faint">
                        {formatRelative(item.occurredAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink">
                      <span className="font-medium">{item.viewerLabel}</span>
                      {item.type === 'view' ? ' opened ' : ' commented on '}
                      <Link
                        to="/documents/$documentId"
                        params={{ documentId: item.documentId }}
                        className="underline decoration-rule-strong underline-offset-2 hover:decoration-ink"
                      >
                        {item.documentName}
                      </Link>
                    </p>
                    {item.detail ? (
                      <p className="mt-1 text-[0.75rem] text-ink-faint">
                        {item.detail}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <LoadMore
                hasMore={activity.hasMore}
                isLoading={activity.isLoadingMore}
                onClick={activity.loadMore}
                label="Load earlier activity"
              />
            </>
          ) : activity.isLoading ? (
            <div className="mt-4 space-y-3" aria-hidden="true">
              {[0, 1, 2].map((row) => (
                <div key={row} className="border-l-2 border-rule pl-3.5">
                  <div className="h-3 w-20 animate-pulse rounded bg-paper-sunk" />
                  <div className="mt-2 h-3 w-full animate-pulse rounded bg-paper-sunk" />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-faint">
              Opens and comments will appear here as investors engage with your
              documents.
            </p>
          )}
        </aside>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </AppShell>
  );
};
