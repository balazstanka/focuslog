# Focuslog

Pomodoro timer with desktop activity tracking. A pnpm monorepo:

- `apps/web`: Next.js. Login, timer UI, statistics. Gets all data from the API.
- `apps/api`: NestJS 11 (Express adapter, ESM) with better-auth and Prisma. Timer state, tracker connection, activity ingestion, database. Every route is under `/api`.
- `apps/tracker`: desktop tracker. Records only while the server says the user's timer is running.
- `packages/shared` (`@focuslog/shared`): all Zod schemas and their `z.infer` types. The single source of the protocol.

Next.js proxies `/api/*` to the API with rewrites, so the browser sees one origin and the better-auth session cookie needs no CORS setup.

Node 26 is required (`.nvmrc`).

## Commands

- `pnpm dev`: run every package in watch mode
- `pnpm dev:web`, `pnpm dev:api`: run one app
- `pnpm typecheck`: typecheck the packages that have a `typecheck` script (`apps/web` has none)
- `pnpm -F @focuslog/web lint`: lint the web app
- `pnpm format`, `pnpm format:check`: Prettier
- `pnpm -F @focuslog/api db:migrate`: create and apply a migration, then regenerate the client
- `pnpm -F @focuslog/api db:generate`: regenerate the Prisma client, for example after changing `DATABASE_PROVIDER`
- `pnpm -F @focuslog/api db:deploy`: apply existing migrations to a new database
- Swagger UI: `http://localhost:3001/api/docs` (or `:3000/api/docs` through the proxy); JSON at `/api/docs/json`

There is no test runner yet.

## Key decisions

- A user can have several devices, each with its own tracker and API key. Pairing adds a device.
- When starting a timer, the user can pick which devices record. If they pick none, all their devices record.
- Window titles are not filtered or excluded yet.
- The pause button keeps the same session. No activity from a paused period may be stored; the server enforces this on upload.
- Work blocks and breaks are both sessions, told apart by `kind` (`work | break`), so the day's timeline can be shown later. Every block is its own session; grouping blocks comes later.
- The web app starts the break when a work block finishes; the server never starts one on its own. Short and long breaks differ only in duration.
- Trackers record only during a `work` session. During a break the server tells them there is no session, and it rejects activity uploaded for a break.
- A "day" depends on the user's time zone, so clients send day boundaries as epoch milliseconds. The server knows no time zones.
- The server owns timer state. The web app and the tracker both read it from there.
- A session can run without a tracker; it then has no activity.
- Prisma on SQLite or Postgres, chosen by `DATABASE_PROVIDER` in `apps/api/.env`. Each provider has its own migrations. Avoid solutions specific to one database.
- Every API route requires a web session unless marked `@AllowAnonymous()`. Authorization for now is ownership only: services scope queries by the session's user. Roles and permissions come later.
- The API documents itself with OpenAPI, generated from the shared Zod schemas. Use the Swagger UI instead of Postman or Bruno.
- Timestamps are UTC epoch milliseconds.

## Implementation order

1. Shared Zod schemas: activity, batch, handshake, heartbeat, session. _Partly done: the session schemas exist; activity, batch, handshake and heartbeat are missing, and the old `WindowSample` schemas are still there._
2. Prisma + SQLite, schema, first migration. _Partly done: better-auth tables, `FocusSession` and `SessionPause` exist; `Device`, `FocusSessionDevice` and `Activity` are missing._
3. better-auth in the API, Next.js proxy, login page, Swagger. _Done._
4. FocusSession and SessionPause API with work and break sessions, a date-range query for the day timeline, timer UI. _Partly done: the API is done; the timer UI and the day timeline UI are missing._
5. Per-device API keys and device management on the web, tracker handshake.
6. Heartbeat polling; the tracker starts and stops from session state.
7. Segment merging, idempotent upload, offline buffer, clock skew correction.

Later: device flow, WebSocket push, MySQL, roles and permissions, statistics page (it builds on the date-range query from step 4).

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
- Exception: NestJS modules, controllers, services, guards and DTOs are classes, because Nest's decorators and dependency injection need them. Their helpers are still `function` declarations.
- Use arrow functions only for short inline callbacks (`map`, `filter`, event handlers).
- Name functions after what they do (`closeCurrentSegment`, not `handleData`).
- Keep functions small and single-purpose; prefer early returns over nesting.
- Always use braces for `if` blocks, even for a single statement.

### TypeScript

- No `any`; narrow `unknown` instead.
- Derive protocol types with `z.infer`; don't hand-write duplicates.
- Validate every external input at the boundary with a shared Zod schema.
- Import local files without an extension (`./sessions.service`, not `./sessions.service.js`).
