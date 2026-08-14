import { ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export const Dialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) => (
  <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px]" />
      <RadixDialog.Content
        className="fixed left-1/2 top-1/2 z-50 w-[min(30rem,calc(100vw-2rem))]
                   -translate-x-1/2 -translate-y-1/2 rounded-xl border
                   border-rule-strong bg-paper-raised p-6 shadow-2xl
                   shadow-ink/10 focus:outline-none"
      >
        <RadixDialog.Title className="font-display text-2xl leading-tight text-ink">
          {title}
        </RadixDialog.Title>
        {description ? (
          <RadixDialog.Description className="mt-1.5 text-sm text-ink-soft">
            {description}
          </RadixDialog.Description>
        ) : null}
        <div className="mt-5">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  </RadixDialog.Root>
);
