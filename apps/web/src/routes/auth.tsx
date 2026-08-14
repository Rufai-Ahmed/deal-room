import { FormEvent, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useDispatch } from 'react-redux';
import {
  useAuthProvidersQuery,
  useLoginMutation,
  useRegisterMutation,
} from '../apis';
import { Logo } from '../components/brand/logo';
import { Button } from '../components/ui/button';
import { Field } from '../components/ui/field';
import { Spinner } from '../components/ui/spinner';
import { signedIn } from '../store/auth.slice';

const errorMessage = (error: unknown): string => {
  const detail = (error as { data?: { message?: string | string[] } })?.data
    ?.message;
  if (Array.isArray(detail)) {
    return detail[0];
  }
  return detail ?? 'Something went wrong. Please try again.';
};

const AuthLayout = ({
  title,
  lede,
  children,
  footer,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) => (
  <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
    <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
      <div className="mx-auto w-full max-w-sm">
        <Link to="/">
          <Logo />
        </Link>
        <h1 className="mt-10 font-display text-[2.5rem] leading-[1.1] text-ink">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{lede}</p>
        <div className="mt-8">{children}</div>
        <div className="mt-6 text-[0.8125rem] text-ink-soft">{footer}</div>
      </div>
    </div>

    <aside className="relative hidden overflow-hidden border-l border-rule bg-paper-sunk lg:block">
      <div className="rule-grid absolute inset-0 opacity-70" />
      <div className="relative flex h-full items-center justify-center p-16">
        <figure className="max-w-md">
          <blockquote className="font-display text-3xl leading-[1.25] text-ink">
            &ldquo;Sending a deck by email tells you nothing. You find out an
            investor never opened it three weeks into the raise.&rdquo;
          </blockquote>
          <figcaption className="eyebrow mt-6">
            The problem Deal Room solves
          </figcaption>
        </figure>
      </div>
    </aside>
  </div>
);

const GoogleButton = () => (
  <a
    href="/api/auth/google"
    className="inline-flex h-10 w-full items-center justify-center gap-2.5
               rounded-lg border border-rule-strong bg-paper-raised text-sm
               font-medium text-ink transition-colors hover:border-ink-faint"
  >
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
    Continue with Google
  </a>
);

const Divider = () => (
  <div className="my-5 flex items-center gap-3">
    <span className="h-px flex-1 bg-rule" />
    <span className="eyebrow">or</span>
    <span className="h-px flex-1 bg-rule" />
  </div>
);

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();
  const { data: providers } = useAuthProvidersQuery();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const session = await login({ email, password }).unwrap();
    dispatch(signedIn(session));
    navigate({ to: '/documents' });
  };

  return (
    <AuthLayout
      title="Sign in"
      lede="Open your deal room to see who has read what."
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className="font-medium text-brand underline underline-offset-4">
            Create one
          </Link>
        </>
      }
    >
      {providers?.google ? (
        <>
          <GoogleButton />
          <Divider />
        </>
      ) : null}

      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={error ? errorMessage(error) : null}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Spinner /> : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, { isLoading, error }] = useRegisterMutation();
  const { data: providers } = useAuthProvidersQuery();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const session = await register({ name, email, password }).unwrap();
    dispatch(signedIn(session));
    navigate({ to: '/documents' });
  };

  return (
    <AuthLayout
      title="Create your deal room"
      lede="Upload a deck, share it with one investor at a time, and watch the engagement come back."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      {providers?.google ? (
        <>
          <GoogleButton />
          <Divider />
        </>
      ) : null}

      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Name"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={error ? errorMessage(error) : null}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Spinner /> : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
};
