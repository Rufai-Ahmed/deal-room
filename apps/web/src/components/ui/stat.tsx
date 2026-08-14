import { ReactNode } from 'react';

interface StatProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

export const Stat = ({ label, value, detail }: StatProps) => (
  <div className="border-l border-rule pl-4 first:border-l-0 first:pl-0">
    <p className="eyebrow">{label}</p>
    <p className="numeric mt-1.5 text-2xl leading-none text-ink">{value}</p>
    {detail ? (
      <p className="mt-1.5 text-[0.8125rem] text-ink-faint">{detail}</p>
    ) : null}
  </div>
);
