import { FormEvent, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import type { SharedDocumentView } from '@dealroom/shared';
import {
  useIdentifyViewerMutation,
  usePostViewerCommentMutation,
  useSharedDocumentQuery,
  useViewerCommentsQuery,
} from '../apis';
import { LogoMark } from '../components/brand/logo';
import { Button } from '../components/ui/button';
import { Field } from '../components/ui/field';
import { Spinner } from '../components/ui/spinner';
import { CommentThread } from '../features/comments/comment-thread';
import { PdfDocument } from '../features/viewer/pdf-document';
import { useViewTracking } from '../features/viewer/use-view-tracking';

const readSessionFromHash = (): string | null => {
  const token = new URLSearchParams(
    window.location.hash.replace(/^#/, ''),
  ).get('vs');

  if (token) {
    window.history.replaceState(null, '', window.location.pathname);
  }

  return token;
};

const ClosedNotice = ({ heading, body }: { heading: string; body: string }) => (
  <div className="grid min-h-dvh place-items-center bg-paper px-6">
    <div className="max-w-sm text-center">
      <LogoMark className="mx-auto size-10 text-ink-faint" />
      <h1 className="mt-6 font-display text-3xl text-ink">{heading}</h1>
      <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  </div>
);

export const ViewerPage = () => {
  const { token } = useParams({ from: '/view/$token' });

  // Read during the first render, not in an effect. The router rewrites the
  // URL on mount, and an effect would run after the fragment had already gone,
  // losing the session issued by the /s redirect and double counting the open.
  const [viewSession] = useState<string | null>(readSessionFromHash);

  // The identify call returns the unlocked document. Holding it here avoids a
  // refetch that would otherwise open a second view session.
  const [identifiedView, setIdentifiedView] =
    useState<SharedDocumentView | null>(null);

  const { data: fetched, error, isLoading } = useSharedDocumentQuery({
    token,
    viewSessionToken: viewSession,
  });

  const data = identifiedView ?? fetched;
  const activeSession = data?.viewSessionToken ?? viewSession;
  const { setPage } = useViewTracking(
    data?.identified ? activeSession : null,
  );

  const { data: comments } = useViewerCommentsQuery(
    { token, viewSessionToken: activeSession },
    { skip: !data?.identified || !activeSession },
  );
  const [postComment] = usePostViewerCommentMutation();

  if (isLoading && !data) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper text-ink-faint">
        <Spinner />
      </div>
    );
  }

  if (error) {
    const status = (error as { status?: number }).status;
    const reason = (error as { data?: { status?: string } }).data?.status;

    if (status === 410) {
      return (
        <ClosedNotice
          heading={reason === 'expired' ? 'This link has expired' : 'This link was revoked'}
          body="Ask whoever shared the document with you for a new link."
        />
      );
    }

    return (
      <ClosedNotice
        heading="Link not found"
        body="This link does not exist. Check that you copied the whole address."
      />
    );
  }

  if (!data) {
    return null;
  }

  if (!data.identified) {
    return (
      <EmailGate
        token={token}
        viewSession={activeSession}
        data={data}
        onIdentified={setIdentifiedView}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-paper-sunk">
      <header className="sticky top-0 z-20 border-b border-rule bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark className="size-6 shrink-0 text-ink" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {data.documentName}
              </p>
              <p className="truncate text-[0.75rem] text-ink-faint">
                Shared by {data.ownerName}
              </p>
            </div>
          </div>

          {data.allowDownload && data.fileUrl ? (
            <a href={data.fileUrl} download>
              <Button variant="secondary" size="sm">
                Download
              </Button>
            </a>
          ) : null}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-8 lg:grid-cols-[1fr_20rem]">
        <div>
          {data.fileUrl && data.mimeType === 'application/pdf' ? (
            <PdfDocument url={data.fileUrl} onPageVisible={setPage} />
          ) : data.fileUrl ? (
            <div className="rounded-lg border border-rule bg-paper-raised p-10 text-center">
              <p className="text-sm text-ink-soft">
                This file type cannot be previewed here.
              </p>
              <a href={data.fileUrl} className="mt-4 inline-block">
                <Button variant="secondary" size="sm">
                  Open file
                </Button>
              </a>
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="eyebrow">Questions for {data.ownerName}</h2>
          <div className="mt-4">
            <CommentThread
              comments={comments ?? []}
              placeholder="Ask a question about this document"
              emptyMessage="Leave a question and it goes straight to the founder."
              onSubmit={(body) =>
                postComment({
                  token,
                  body,
                  viewSessionToken: activeSession as string,
                }).unwrap()
              }
            />
          </div>
        </aside>
      </main>
    </div>
  );
};

const EmailGate = ({
  token,
  viewSession,
  data,
  onIdentified,
}: {
  token: string;
  viewSession: string | null;
  data: { documentName: string; ownerName: string };
  onIdentified: (view: SharedDocumentView) => void;
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [identify, { isLoading, error }] = useIdentifyViewerMutation();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const unlocked = await identify({
      token,
      viewSessionToken: viewSession,
      email,
      name: name.trim() || undefined,
    }).unwrap();

    onIdentified(unlocked);
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <LogoMark className="size-9 text-ink" />
        <p className="eyebrow mt-6">{data.ownerName} shared a document</p>
        <h1 className="mt-2 font-display text-[2.25rem] leading-[1.1] text-ink">
          {data.documentName}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Confirm who you are to open it. {data.ownerName} will see that you
          viewed it.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field
            label="Your email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Field
            label="Your name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={
              error ? 'That did not work. Check the address and try again.' : null
            }
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner /> : 'Open document'}
          </Button>
        </form>
      </div>
    </div>
  );
};
