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

## Handshake: `POST /tracker/handshake`

- Request body: `{ protocolVersion, deviceName, platform }`, with the API key in a header.
- Response: `{ deviceId, serverTime, session }`.

## Heartbeat: `POST /tracker/heartbeat`

- Response: `{ serverTime, session: null | { id, status, startedAt, plannedEndAt } }`.
- `session` is also `null` when the active session does not include this device. The same applies to the handshake response.

## Starting a session: `POST /sessions`

- Request body: `{ deviceIds?: string[] }`, plus the timer's duration.
- Without `deviceIds`, all of the user's devices record.

The API identifies a tracker from its API key, so tracker requests never carry a `deviceId`.

## Session status

`running | paused | finished | cancelled`
