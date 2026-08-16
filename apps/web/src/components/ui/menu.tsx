import { ReactNode } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export const Menu = ({
  label = 'Actions',
  children,
}: {
  label?: string;
  children: ReactNode;
}) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-faint
                 transition-colors hover:bg-paper-sunk hover:text-ink
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
        <circle cx="8" cy="3" r="1.4" fill="currentColor" />
        <circle cx="8" cy="8" r="1.4" fill="currentColor" />
        <circle cx="8" cy="13" r="1.4" fill="currentColor" />
      </svg>
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align="end"
        sideOffset={6}
        onClick={(event) => event.stopPropagation()}
        className="z-50 min-w-44 rounded-lg border border-rule-strong bg-paper-raised
                   p-1 shadow-lg shadow-ink/10"
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);

export const MenuItem = ({
  onSelect,
  tone = 'default',
  children,
}: {
  onSelect: () => void;
  tone?: 'default' | 'danger';
  children: ReactNode;
}) => (
  <DropdownMenu.Item
    onSelect={onSelect}
    className={`cursor-pointer rounded-md px-2.5 py-1.5 text-[0.8125rem] outline-none
                data-[highlighted]:bg-paper-sunk ${
                  tone === 'danger' ? 'text-danger' : 'text-ink'
                }`}
  >
    {children}
  </DropdownMenu.Item>
);
