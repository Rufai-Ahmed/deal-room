import { ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Logo } from '../brand/logo';
import { Button } from '../ui/button';
import { useTheme } from '../../lib/use-theme';
import { signedOut } from '../../store/auth.slice';
import type { RootState } from '../../store/store';

export const AppShell = ({ children }: { children: ReactNode }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const signOut = () => {
    dispatch(signedOut());
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/documents" className="shrink-0">
            <Logo />
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="grid size-9 place-items-center rounded-lg text-ink-soft
                         transition-colors hover:bg-paper-sunk hover:text-ink"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-2">
                <div className="hidden text-right sm:block">
                  <p className="text-[0.8125rem] font-medium leading-tight text-ink">
                    {user.name}
                  </p>
                  <p className="text-[0.75rem] leading-tight text-ink-faint">
                    {user.email}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign out
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
};

const SunIcon = () => (
  <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10 2v1.8M10 16.2V18M18 10h-1.8M3.8 10H2M15.66 4.34l-1.27 1.27M5.61 14.39l-1.27 1.27M15.66 15.66l-1.27-1.27M5.61 5.61 4.34 4.34"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" aria-hidden="true">
    <path
      d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);
