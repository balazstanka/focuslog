---
name: prisma-database
description: Data model and portability rules for Focuslog's Prisma database. Use when editing apps/api/prisma/schema, creating a migration, writing Prisma queries, or switching between SQLite and Postgres.
---

# Prisma database

The models are in `apps/api/prisma/schema/models.prisma`. The client is generated into `apps/api/src/generated/prisma` and is gitignored, so run `pnpm -F @focuslog/api db:generate` after switching providers.

## Choosing the database

`DATABASE_PROVIDER` in `apps/api/.env` picks the database: `sqlite` (default) or `postgresql`. `DATABASE_URL` must match it.

- Prisma does not accept `env()` in `datasource.provider`, so `prisma.config.ts` writes `prisma/schema/datasource.prisma` before every Prisma CLI command. That file is gitignored, so never edit it.
- Each provider has its own migration folder: `prisma/migrations/sqlite` and `prisma/migrations/postgresql`. `prisma.config.ts` picks one from `DATABASE_PROVIDER`.
- At runtime, `src/prisma/prisma-client.ts` chooses the driver adapter (`PrismaBetterSqlite3` or `PrismaPg`), and `src/auth/auth.ts` passes the same provider to better-auth's `prismaAdapter`.

## Changing the schema

1. Edit `models.prisma`, then run `pnpm -F @focuslog/api exec prisma format`.
2. With `DATABASE_PROVIDER=sqlite`, run `pnpm -F @focuslog/api db:migrate --name <name>`.
3. Start a Postgres, for example `docker run -d --name focuslog-pg -e POSTGRES_USER=focuslog -e POSTGRES_PASSWORD=focuslog -e POSTGRES_DB=focuslog -p 5432:5432 postgres:17`. Then run `db:migrate --name <name>` again with `DATABASE_PROVIDER=postgresql` and `DATABASE_URL=postgresql://focuslog:focuslog@localhost:5432/focuslog` set in the shell. Shell variables win over `.env`, because dotenv doesn't overwrite them. This creates the matching migration in `prisma/migrations/postgresql`.
4. Commit both migrations together.
5. Switch back to your provider and run `db:generate`.

`migrate dev` asks before resetting a drifted database, and in a non-interactive shell it hangs or fails instead. Check `prisma migrate status` first, and if the database is out of sync, ask the user before resetting it.

The first Postgres migration was created without a database: `prisma migrate diff --from-empty --to-schema prisma/schema --script`.

Apply migrations on a new database with `pnpm -F @focuslog/api db:deploy`.

better-auth owns the `user`, `session`, `account` and `verification` tables through its Prisma adapter. The model named `Session` is the auth session; timer sessions are `FocusSession`.

## Models

- **Device**: one of the user's trackers. Fields: `id`, `userId` (indexed, not unique), `name`, `platform`, `lastSeenAt`, API key reference (unique). A new pairing adds a device.
- **FocusSessionDevice**: `sessionId`, `deviceId`, with a composite primary key. It lists the devices chosen for a session. A session with no rows here records on all of the user's devices.
- **FocusSession**: a work block or a break. `id`, `userId`, `activeUserId` (unique, nullable), `kind` (`work | break`, `String` with default `work`, narrowed with `SessionKindSchema`), `startedAt`, `plannedEndAt`, `endedAt`, `status` (`running | paused | finished | cancelled`, stored as `String` and narrowed with `SessionStatusSchema`).
- **SessionPause**: `id`, `sessionId`, `startedAt`, `endedAt` (null while the pause lasts).
- **Activity**: `id` (client-generated UUID, primary key), `sessionId`, `deviceId`, `startedAt`, `endedAt`, `appName`, `title`, `receivedAt`.

`Activity` rows stay raw per device and can overlap between devices. Statistics merge overlapping intervals when computing total time, so two devices don't count twice. An `Activity` row never overlaps a `SessionPause` of its session, and it belongs only to a `work` session.

## Rules

- **Timestamps:** store epoch milliseconds as `BigInt`, because Prisma `Int` is 32-bit. `JSON.stringify` throws on `BigInt`, so convert to `Number` at the API boundary.
- **Portability:** avoid SQLite-specific SQL and raw queries that would not run on Postgres or MySQL.
- **Idempotent insert:** `createMany({ skipDuplicates: true })` is not supported on SQLite. Query the existing ids and insert only the missing rows, in one transaction.
- **One active session per user:** a user has at most one `running` or `paused` session. A portable Prisma schema cannot express a partial unique index, and check-then-insert in a transaction is not safe under Postgres's default READ COMMITTED isolation. So `FocusSession.activeUserId` holds the `userId` while the session is active and `null` once it ends, under a unique index. Every supported database allows several NULLs there. Set it on create, clear it in the same update that ends the session, and turn a `P2002` on create into 409.
- **State transitions:** change status with `updateMany({ where: { id, status: { in: allowed } } })` and check `count`, so two concurrent requests cannot both pass a status check.
- **Enums:** don't use Prisma `enum`; it maps to a different column type on each provider. Store a `String` and validate it with the shared `z.enum`.

## Adding MySQL later

1. Add `mysql` to the `DATABASE_PROVIDER` enum in `apps/api/src/config/database-env.ts`.
2. Add its driver adapter to `src/prisma/prisma-client.ts` and `apps/api/package.json`.
3. Create a `prisma/migrations/mysql` folder with a baseline migration (`migrate diff --from-empty`).
