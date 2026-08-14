# Deal Room

Founders raising investment share fundraising documents with investors and see
whether, when and how those documents were actually read.

Live app: https://dealroom.rufaiahmed.com
API reference: https://dealroom.rufaiahmed.com/api/docs

## Test account

```
https://dealroom.rufaiahmed.com/login
founder@dealroom.demo
deal-room-demo
```

The account is seeded with two documents, four share links and about three
weeks of engagement history, so the tracking features are visible immediately
rather than needing to be generated first.

To see the investor side, open a share link from any document. The seeded links
work, or create a fresh one.

## The brief, and how I read it

The requirement was upload a document, store it against an account, generate a
share link, and see when that link was opened. That is four endpoints and an
afternoon. The interesting part is the sentence above it: the problem is giving
founders visibility into investor engagement. So the design questions I actually
answered were:

**Whose attention is this?** A single link shared with everyone produces one
blended number. Links here are issued per recipient, so the founder compares
Northgate against Brightwater instead of guessing. This is the difference
between analytics and an actual fundraising tool.

**Is an "open" real?** This one changes the product's honesty. When a founder
pastes a link into Slack, WhatsApp, Outlook or LinkedIn, the platform fetches
the URL to build a preview card. Naively counted, the founder is told an
investor read the deck when nobody has. Those hits are detected, stored with the
reason, and excluded from every figure shown. The founder can reveal them, which
is the point: the number is defensible rather than flattering.

**"When it was opened" is the floor, not the ceiling.** A timestamp does not
tell a founder whether the deck landed. Time in the document and dwell per page
do. Knowing an investor spent five minutes on the traction slide and skipped the
roadmap is the thing a founder acts on.

**Who is reading?** An unguessable URL identifies a link, not a person.
Recipients confirm an email before the file is revealed, so opens attach to a
name. It is a soft gate, and the README says so rather than pretending it is
authentication.

## Architecture

```
apps/web    React SPA        TanStack Router, Redux Toolkit Query, Tailwind
apps/api    NestJS           REST, Prisma, Postgres
libs/shared TypeScript types the request and response contract, imported by both
```

An Nx workspace, not because two apps need a build system, but because the
API and the client share one contract. `libs/shared` declares every request and
response shape once; the Nest controllers return those types and the RTK Query
endpoints are generic over the same ones. A field renamed on the server fails
the client typecheck in the same commit.

The API is modular in the Nest sense, one bounded concern per module:

```
auth           registration, login, Google OAuth, JWT issuing
documents      upload tickets, ownership, metadata
storage        driver interface with local disk and S3 implementations
sharing        share links, expiry, revocation, public token resolution
analytics      view recording, bot classification, dwell aggregation
comments       investor and founder threads against a share link
notifications  transactional email
```

Modules depend on each other through exported services, never by reaching into
another module's Prisma models. Ownership is enforced in the service layer
rather than in the query, so it cannot be forgotten by a future caller.

### How an open is recorded

```
investor clicks  dealroom.rufaiahmed.com/s/<token>
       |
       v
GET /s/:token                        (Nest, before any JavaScript runs)
       |  validate token, expiry, revocation
       |  classify user agent, write DocumentView
       |  issue a signed view-session token
       v
302 -> /view/<token>#vs=<session>    (fragment, so it stays out of logs)
       |
       v
SPA viewer  ->  email gate if required
            ->  signed file URL, valid 15 minutes
            ->  heartbeat every 10s with page dwell
```

Recording server side, before the redirect, is deliberate. A client-side ping
misses anyone with scripts blocked and is trivial to suppress. The session token
is signed because heartbeats arrive from an unauthenticated page, and without it
any caller could inflate another investor's engagement.

### Data model

```
User ──< Document ──< ShareLink ──< DocumentView ──< PageView
                            └─────< Comment
```

Views are rows, not a counter. That is what makes first open, last open, repeat
visits, unique viewers and per-page dwell all fall out of the same table rather
than needing separate bookkeeping. Comments hang off the share link rather than
the document, so a founder sees which investor asked what without the investor
needing an account.

## Assumptions

- **A share link is a bearer credential.** Anyone holding the URL can open the
  document, subject to expiry and revocation. The email gate attributes a view,
  it does not authenticate. Real per-investor authentication was out of scope
  for the brief and would change the investor experience significantly.
- **View-only is a deterrent, not DRM.** With downloads disabled there is no
  download control and the file is served inline, but a determined viewer can
  still capture the content. Claiming otherwise would be dishonest.
- **Dwell time is best effort.** It only accrues while the tab is visible, is
  clamped to the wall clock since the view opened, and can never be reduced by a
  later heartbeat. It is a strong signal, not an audit record.
- **Viewer IPs are never stored raw**, only salted hashes, so unique-viewer
  counts work without retaining personal data.
- **Single tenant per user.** No organisations or shared workspaces. A real
  product would need them; the brief did not.
- **Documents are soft deleted.** Archiving hides a document and kills its
  links. Nothing is hard deleted, because destroying a fundraising audit trail
  on one click is the wrong default.

## Running it locally

Requires Node 22+, pnpm 11 and a Postgres 15+ instance.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env     # then set DATABASE_URL and the secrets
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The web app runs on http://localhost:4200 and proxies `/api` and `/s` to the API
on port 3000, so the browser stays on one origin exactly as it does in
production.

| Command | What it does |
| --- | --- |
| `pnpm dev` | API and web together |
| `pnpm test` | Unit tests for both projects |
| `pnpm typecheck` | Typecheck every project |
| `pnpm build` | Production build of both |
| `pnpm db:seed` | Reset and reseed the demo founder |

Storage defaults to the local disk driver, which writes to `apps/api/.storage`
and serves files back through signed URLs, so the viewer path behaves the same
locally as it does against S3.

## Testing

Tests cover the parts where a defect is silent rather than loud:

- bot classification, including the real Telegram agent that also names Twitter
- password hashing, salting, and rejection of foreign hash formats
- link status across expiry and revocation, and 410 versus 404 behaviour
- ownership isolation, so one founder cannot revoke another's link
- dwell clamping against inflated, negative and out of range heartbeats

CI typechecks, tests and builds every project on push.

## Security notes

- Passwords use scrypt with per-password salts and constant-time comparison.
- Share tokens are 128 bits of randomness, never sequential ids.
- File URLs are signed and short lived. Storage is never publicly enumerable.
- The file URL is withheld from the API response until the email gate is
  satisfied, so it cannot be lifted from an unidentified response.
- `/s/*` and `/view/*` send `X-Robots-Tag: noindex, nofollow` and are disallowed
  in robots.txt. An investor's deck appearing in a search index would be a
  serious failure, so the marketing page is the only indexable surface.
- Rate limiting is applied globally; validation rejects unknown fields.

## What I would do next

In rough order of value:

1. **Per-investor authentication** for genuinely sensitive rooms, probably a
   one-time code to the recipient address rather than a password.
2. **Document versioning.** Replace a deck and keep the same links working,
   with engagement attributed per version. Founders re-cut decks constantly.
3. **A digest instead of a notification per open.** The current behaviour will
   get noisy during an active raise.
4. **Passwordless sign-in.** I deliberately did not ship magic links here,
   because putting email deliverability on the critical login path is a bad
   trade for an app that has to work on first try. With a warm sending domain it
   is the better default.
5. **Watermarking** the viewer's email into rendered pages, which raises the
   cost of forwarding without pretending to be DRM.
6. **Engagement scoring** across a raise, ranking investors by depth of
   attention rather than raw opens.

Known gaps I chose not to close: no pagination on the activity feed, analytics
aggregate in the application rather than in SQL (fine at this size, wrong at
scale), and non-PDF file types are listed and shared but not previewed inline.
