# Focuslog

Pomodoro timer with desktop activity tracking. A pnpm monorepo:

- `apps/web`: Next.js. Login, timer UI, statistics. Gets all data from the API.
- `apps/api`: Express with better-auth. Timer state, tracker connection, activity ingestion, database (Prisma).
- `apps/tracker`: desktop tracker. Records only while the server says the user's timer is running.
- `packages/shared` (`@focuslog/shared`): all Zod schemas and their `z.infer` types. The single source of the protocol.

Next.js proxies `/api/*` to Express with rewrites, so the browser sees one origin and the better-auth session cookie needs no CORS setup.

## Commands

- `pnpm dev`: run every package in watch mode
- `pnpm dev:web`, `pnpm dev:api`: run one app
- `pnpm typecheck`: typecheck the packages that have a `typecheck` script (`apps/web` has none)
- `pnpm -F @focuslog/web lint`: lint the web app
- `pnpm format`, `pnpm format:check`: Prettier
- `pnpm -F @focuslog/api db:migrate`: create and apply a migration, then regenerate the client

There is no test runner yet.

## Key decisions

- A user can have several devices, each with its own tracker and API key. Pairing adds a device.
- When starting a timer, the user can pick which devices record. If they pick none, all their devices record.
- Window titles are not filtered or excluded yet.
- The pause button keeps the same session. No activity from a paused period may be stored; the server enforces this on upload.
- A finished work block ends its session. The break after it has no session, and the next block is a new session. Grouping blocks comes later.
- The server owns timer state. The web app and the tracker both read it from there.
- A session can run without a tracker; it then has no activity.
- Prisma on SQLite now, Postgres or MySQL later. Avoid SQLite-specific solutions.
- Timestamps are UTC epoch milliseconds.

## Implementation order

1. Shared Zod schemas: activity, batch, handshake, heartbeat, session. _Not done: `packages/shared` still has the old `WindowSample` schemas._
2. Prisma + SQLite, schema, first migration. _Partly done: only the better-auth tables exist._
3. better-auth in Express, Next.js proxy, login page. _Done, except that Express still uses `cors`._
4. FocusSession and SessionPause API, timer UI.
5. Per-device API keys and device management on the web, tracker handshake.
6. Heartbeat polling; the tracker starts and stops from session state.
7. Segment merging, idempotent upload, offline buffer, clock skew correction.

Later: device flow, WebSocket push, Postgres/MySQL, statistics page.

## Skills

Load the matching skill before working in its area:

- `shared-protocol`: Zod schemas and protocol changes
- `prisma-database`: Prisma models, migrations, queries
- `api-endpoint`: Express routes and timer logic
- `tracker-client`: the desktop tracker
- `web-frontend`: the Next.js app

## Code style

### Comments

- Don't write comments by default. Names of functions and variables should explain the code.
- Don't write comments that restate what the code already says.
- Comment only the "why" when something isn't obvious: workarounds, counterintuitive decisions, constraints from an external API.
- No section-divider comments like `// --- Helpers ---`.
- Don't leave comments describing the change you just made.
- Write comments in English.

### Functions

- Use `function` declarations for named and top-level functions, including React components.
- Use arrow functions only for short inline callbacks (`map`, `filter`, event handlers).
- Name functions after what they do (`closeCurrentSegment`, not `handleData`).
- Keep functions small and single-purpose; prefer early returns over nesting.
- Always use braces for `if` blocks, even for a single statement.

### TypeScript

- No `any`; narrow `unknown` instead.
- Derive protocol types with `z.infer`; don't hand-write duplicates.
- Validate every external input at the boundary with a shared Zod schema.
