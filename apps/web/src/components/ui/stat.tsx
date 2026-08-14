import { ReactNode } from 'react';

interface StatProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

/// Dividers only appear once the row is a single line. On a narrow grid the
/// cells wrap, and a left border would then hang off the start of each new row.
export const Stat = ({ label, value, detail }: StatProps) => (
  <div className="sm:border-l sm:border-rule sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
    <p className="eyebrow">{label}</p>
    <p className="numeric mt-1.5 text-2xl leading-none text-ink">{value}</p>
    {detail ? (
      <p className="mt-1.5 text-[0.8125rem] text-ink-faint">{detail}</p>
    ) : null}
  </div>
);
