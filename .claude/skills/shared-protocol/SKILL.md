---
name: shared-protocol
description: Rules and target schemas for @focuslog/shared. Use when adding or changing a Zod schema or the protocol between the tracker, API and web app (activity, batch, handshake, heartbeat, session).
---

# Shared protocol

`packages/shared` is the only place protocol schemas live. The API, tracker and web app import from it.

## Rules

- Define the Zod schema first and derive the type with `z.infer`. Never hand-write a matching type.
- Bump `PROTOCOL_VERSION` on any change an already installed tracker could not handle: a removed or renamed field, a new required field, a tighter validation rule, or a changed meaning.
- Timestamps are UTC epoch milliseconds, as positive integers.

## Activity

The tracker sends segments, not per-second samples. A segment covers the time one window stayed active. These replace the old `WindowSample` schemas.

```ts
export const ActivitySchema = z
  .object({
    id: z.uuid(),
    startedAt: z.number().int().positive(),
    endedAt: z.number().int().positive(),
    appName: z.string().min(1).max(256),
    title: z.string().max(1024),
  })
  .refine((a) => a.endedAt >= a.startedAt);

export const ActivityBatchSchema = z.object({
  sessionId: z.string(),
  activities: z.array(ActivitySchema).min(1).max(1000),
});

export type Activity = z.infer<typeof ActivitySchema>;
```

The client generates `id`. It makes uploads idempotent.

## Handshake: `POST /api/tracker/handshake`

- Request body: `{ protocolVersion, deviceName, platform }`, with the API key in a header.
- Response: `{ deviceId, serverTime, session }`.

## Heartbeat: `POST /api/tracker/heartbeat`

- Response: `{ serverTime, session: null | { id, status, startedAt, plannedEndAt } }`.
- `session` is also `null` when the active session is a `break` or does not include this device. The same applies to the handshake response. The tracker therefore never needs to know about `kind`.

## Sessions

`StartSessionRequestSchema`, `SessionRangeQuerySchema`, `FocusSessionSchema`, `CurrentSessionResponseSchema` and `SessionListResponseSchema` in `packages/shared/src/index.ts`.

- `POST /api/sessions` request body: `{ kind, durationMs }`. `kind` is `work | break` and is required; `durationMs` is from 1 minute to 4 hours. Step 5 adds an optional `deviceIds?: string[]`. Without `deviceIds`, all of the user's devices record.
- A session in a response: `{ id, kind, status, startedAt, plannedEndAt, endedAt: number | null, pauses: { startedAt, endedAt: number | null }[] }`. A pause with `endedAt: null` is still open.
- `GET /api/sessions?from&to` takes epoch milliseconds. Query strings are text, so `SessionRangeQuerySchema` coerces them to numbers. `to` must be after `from`, and the range is at most 31 days.
- `GET /api/sessions/current` answers `{ session: FocusSession | null }`. Like the heartbeat, "no session" is `null` inside a wrapper, not a 404.

The API identifies a tracker from its API key, so tracker requests never carry a `deviceId`.

## Session status and kind

- Status: `running | paused | finished | cancelled`
- Kind: `work | break`
