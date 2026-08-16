import { FormEvent, useState } from 'react';
import type { CommentView } from '@dealroom/shared';
import { Button } from '../../components/ui/button';
import { LoadMore } from '../../components/ui/load-more';
import { Spinner } from '../../components/ui/spinner';
import { formatRelative } from '../../lib/format';

interface CommentThreadProps {
  comments: CommentView[];
  onSubmit: (body: string) => Promise<unknown>;
  placeholder: string;
  emptyMessage: string;
  disabled?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export const CommentThread = ({
  comments,
  onSubmit,
  placeholder,
  emptyMessage,
  disabled,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: CommentThreadProps) => {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }

    setBusy(true);
    try {
      await onSubmit(trimmed);
      setBody('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {comments.length ? (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={`rounded-lg border px-4 py-3 ${
                comment.fromOwner
                  ? 'border-transparent bg-brand-soft'
                  : 'border-rule bg-paper-sunk'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[0.8125rem] font-medium text-ink">
                  {comment.authorName}
                  {comment.page ? (
                    <span className="ml-2 font-normal text-ink-faint">
                      on page {comment.page}
                    </span>
                  ) : null}
                </span>
                <span className="text-[0.75rem] text-ink-faint">
                  {formatRelative(comment.createdAt)}
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[0.8125rem] leading-relaxed text-ink-faint">
          {emptyMessage}
        </p>
      )}

      {onLoadMore ? (
        <LoadMore
          hasMore={hasMore}
          isLoading={isLoadingMore}
          onClick={onLoadMore}
          label="Load more comments"
        />
      ) : null}

      <form onSubmit={submit} className="space-y-2.5">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          className="w-full resize-y rounded-lg border border-rule-strong
                     bg-paper-raised px-3 py-2.5 text-sm text-ink
                     placeholder:text-ink-faint
                     focus:outline-2 focus:outline-offset-[-1px] focus:outline-brand
                     disabled:opacity-50"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={disabled || busy || !body.trim()}
          >
            {busy ? <Spinner /> : 'Post'}
          </Button>
        </div>
      </form>
    </div>
  );
};
