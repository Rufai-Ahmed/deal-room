import { ReactNode } from 'react';
import clsx from 'clsx';

type Tone = 'neutral' | 'brand' | 'signal' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'bg-paper-sunk text-ink-soft border-rule',
  brand: 'bg-brand-soft text-brand border-transparent',
  signal: 'bg-signal-soft text-signal border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
};

export const Badge = ({
  tone = 'neutral',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
      'text-[0.6875rem] font-medium tracking-wide',
      tones[tone],
    )}
  >
    {children}
  </span>
);
