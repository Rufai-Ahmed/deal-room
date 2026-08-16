import { useState } from 'react';
import type { ShareLinkStatus, ShareLinkSummary } from '@dealroom/shared';
import {
  useReplyToShareLinkMutation,
  useRevokeShareLinkMutation,
  useShareLinkCommentsQuery,
} from '../../apis';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { CopyField } from '../../components/ui/copy-field';
import { errorMessage, useToast } from '../../components/ui/toast';
import { formatDuration, formatRelative } from '../../lib/format';
import { useCursorList } from '../../lib/use-cursor-list';
import { CommentThread } from '../comments/comment-thread';
import { EditShareDialog } from './edit-share-dialog';

const statusTone: Record<ShareLinkStatus, 'brand' | 'danger' | 'neutral'> = {
  active: 'brand',
  revoked: 'danger',
  expired: 'neutral',
};

const ShareLinkRow = ({ link }: { link: ShareLinkSummary }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmRevoke, setRevoking] = useState(false);
  const [revoke, { isLoading: revoking }] = useRevokeShareLinkMutation();
  const [reply] = useReplyToShareLinkMutation();
  const toast = useToast();
  const comments = useCursorList(
    useShareLinkCommentsQuery,
    { shareLinkId: link.id },
    { skip: !expanded },
  );

  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl leading-none text-ink">
              {link.recipientName ?? 'Unnamed link'}
            </h3>
            <Badge tone={statusTone[link.status]}>{link.status}</Badge>
            {link.requireEmail ? <Badge>Email required</Badge> : null}
            {link.allowDownload ? <Badge>Download allowed</Badge> : null}
          </div>
          <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
            {link.recipientEmail ?? 'No email on file'}
            {link.expiresAt
              ? ` · expires ${new Date(link.expiresAt).toLocaleDateString()}`
              : ''}
          </p>
        </div>

        <dl className="flex shrink-0 gap-7">
          <div className="text-right">
            <dt className="eyebrow">Opens</dt>
            <dd className="numeric mt-1 text-lg text-ink">{link.totalViews}</dd>
          </div>
          <div className="text-right">
            <dt className="eyebrow">Time</dt>
            <dd className="numeric mt-1 text-lg text-ink">
              {link.totalDurationMs > 0
                ? formatDuration(link.totalDurationMs)
                : '—'}
            </dd>
          </div>
          <div className="w-24 text-right">
            <dt className="eyebrow">Last open</dt>
            <dd className="mt-1 text-[0.8125rem] text-ink-soft">
              {formatRelative(link.lastViewedAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4">
        <CopyField value={link.url} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Hide' : 'Show'} comments
          {link.commentCount > 0 ? ` (${link.commentCount})` : ''}
        </Button>
        {link.status === 'active' ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={revoking}
              onClick={() => setRevoking(true)}
            >
              Revoke
            </Button>
          </>
        ) : null}
      </div>

      <EditShareDialog link={link} open={editing} onOpenChange={setEditing} />

      <ConfirmDialog
        open={confirmRevoke}
        onOpenChange={setRevoking}
        title={`Revoke the link for ${link.recipientName ?? 'this investor'}?`}
        description="The link stops working immediately and they will see a closed-link message. Engagement already recorded is kept."
        confirmLabel="Revoke link"
        onConfirm={async () => {
          try {
            await revoke(link.id).unwrap();
            toast.success('Link revoked.');
          } catch (error) {
            toast.error(errorMessage(error, 'That link could not be revoked.'));
          }
        }}
      />

      {expanded ? (
        <div className="mt-4 border-t border-rule pt-4">
          <CommentThread
            comments={comments.items}
            hasMore={comments.hasMore}
            isLoadingMore={comments.isLoadingMore}
            onLoadMore={comments.loadMore}
            placeholder={`Reply to ${link.recipientName ?? 'this investor'}`}
            emptyMessage="No comments on this link yet. Anything the investor asks will land here."
            onSubmit={async (body) => {
              try {
                await reply({ shareLinkId: link.id, body }).unwrap();
                toast.success('Reply sent.');
              } catch (error) {
                toast.error(errorMessage(error, 'That reply could not be sent.'));
              }
            }}
          />
        </div>
      ) : null}
    </li>
  );
};

export const ShareLinksPanel = ({ links }: { links: ShareLinkSummary[] }) => (
  <ul className="divide-y divide-rule border-y border-rule">
    {links.map((link) => (
      <ShareLinkRow key={link.id} link={link} />
    ))}
  </ul>
);
