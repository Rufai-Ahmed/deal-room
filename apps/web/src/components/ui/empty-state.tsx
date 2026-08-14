import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  body: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, body, action }: EmptyStateProps) => (
  <div className="rule-grid rounded-xl border border-dashed border-rule-strong px-6 py-14 text-center">
    <h3 className="font-display text-2xl text-ink">{title}</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{body}</p>
    {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
  </div>
);
