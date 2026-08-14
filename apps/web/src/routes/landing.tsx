import { Link } from '@tanstack/react-router';
import { Logo } from '../components/brand/logo';
import { Button } from '../components/ui/button';

const capabilities = [
  {
    title: 'One link per investor',
    body: 'Issue a separate link to each firm. Engagement is attributed to a name, not blended into a single anonymous number.',
  },
  {
    title: 'Page-level attention',
    body: 'See which slides held someone and which they skipped, alongside total time in the document.',
  },
  {
    title: 'Opens you can trust',
    body: 'Link previews from Slack, WhatsApp and Outlook fetch your URL automatically. Those are detected and excluded, so an open means a person.',
  },
  {
    title: 'Control after sending',
    body: 'Revoke a link, set an expiry, require an email before the file is revealed, and decide whether downloads are allowed.',
  },
];

export const LandingPage = () => (
  <div className="min-h-dvh bg-paper">
    <header className="border-b border-rule">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>

    <section className="relative overflow-hidden border-b border-rule">
      <div className="rule-grid absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-6xl px-6 py-24">
        <p className="eyebrow">Fundraising document sharing</p>
        <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.03] text-ink">
          Know whether your deck was actually read.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          Send fundraising documents as controlled links instead of email
          attachments, and see exactly when an investor opened them, how long
          they stayed, and which pages held their attention.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to="/register">
            <Button size="md">Create a deal room</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="md">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {capabilities.map((item) => (
          <article key={item.title} className="border-t border-rule pt-5">
            <h2 className="font-display text-2xl leading-snug text-ink">
              {item.title}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>

    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-[0.8125rem] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <p>Deal Room</p>
        <p>
          Built by{' '}
          <a
            href="https://rufaiahmed.com"
            target="_blank"
            rel="noreferrer"
            className="text-ink-soft underline decoration-rule-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
          >
            Rufai Ahmed
          </a>
        </p>
      </div>
    </footer>
  </div>
);
