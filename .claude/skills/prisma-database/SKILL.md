---
name: prisma-database
description: Data model and portability rules for Focuslog's Prisma database. Use when editing apps/api/prisma/schema.prisma, creating a migration, writing Prisma queries, or moving from SQLite to Postgres or MySQL.
---

# Prisma database

The schema is `apps/api/prisma/schema.prisma`. Run `pnpm -F @focuslog/api db:migrate` after changing it. The client is generated into `apps/api/src/generated/prisma`.

better-auth owns the `user`, `session`, `account` and `verification` tables through its Prisma adapter. The model named `Session` is the auth session; timer sessions are `FocusSession`.

## Models

- **Device**: one of the user's trackers. Fields: `id`, `userId` (indexed, not unique), `name`, `platform`, `lastSeenAt`, API key reference (unique). A new pairing adds a device.
- **FocusSessionDevice**: `sessionId`, `deviceId`, with a composite primary key. It lists the devices chosen for a session. A session with no rows here records on all of the user's devices.
- **FocusSession**: `id`, `userId`, `startedAt`, `plannedEndAt`, `endedAt`, `status` (`running | paused | finished | cancelled`).
- **SessionPause**: `id`, `sessionId`, `startedAt`, `endedAt` (null while the pause lasts).
- **Activity**: `id` (client-generated UUID, primary key), `sessionId`, `deviceId`, `startedAt`, `endedAt`, `appName`, `title`, `receivedAt`.

`Activity` rows stay raw per device and can overlap between devices. Statistics merge overlapping intervals when computing total time, so two devices don't count twice. An `Activity` row never overlaps a `SessionPause` of its session.

## Rules

- **Timestamps:** store epoch milliseconds as `BigInt`, because Prisma `Int` is 32-bit. `JSON.stringify` throws on `BigInt`, so convert to `Number` at the API boundary.
- **Portability:** avoid SQLite-specific SQL and raw queries that would not run on Postgres or MySQL.
- **Idempotent insert:** `createMany({ skipDuplicates: true })` is not supported on SQLite. Query the existing ids and insert only the missing rows, in one transaction.
- **One active session per user:** a user has at most one `running` or `paused` session. A portable Prisma schema cannot express a partial unique index, so check and create in one transaction in the service code.

## Moving to Postgres or MySQL

1. Change `datasource.provider` in `schema.prisma`.
2. Change `provider` in `prismaAdapter` in `apps/api/src/lib/auth.ts`.
3. Replace the better-sqlite3 driver adapter in `apps/api/src/lib/prisma.ts` and `apps/api/package.json`.
4. Regenerate the migrations for the new provider.
