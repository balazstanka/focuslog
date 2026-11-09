---
name: api-endpoint
description: Conventions and behavior for Focuslog's Express API. Use when adding or changing a route in apps/api, timer or session logic, tracker handshake or heartbeat handling, activity ingestion, or better-auth setup.
---

# API endpoints

## Rules

- Parse every request body with a schema from `@focuslog/shared`, and answer 400 on failure.
- Keep `toNodeHandler(auth)` before `express.json()`. better-auth has to read the raw body.
- Before using a better-auth plugin such as `apiKey`, check its API in the installed version.
- Convert `BigInt` timestamps to `Number` before sending JSON.

For database rules, load `prisma-database`.

## Timer

The server is the source of truth for timer state. A session can start without a tracker.

| Route                       | Behavior                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /sessions`            | Start a session. A user can have only one `running` or `paused` session. Optional `deviceIds` must all belong to the user; without them, all devices record. |
| `POST /sessions/:id/pause`  | Set status to `paused` and open a `SessionPause`.                                                                                                            |
| `POST /sessions/:id/resume` | Close the pause and move `plannedEndAt` later by the pause length.                                                                                           |
| `POST /sessions/:id/stop`   | End the session.                                                                                                                                             |
| `GET /sessions/current`     | Return the active session.                                                                                                                                   |

## Tracker authentication

The first version uses the better-auth `apiKey` plugin. The user generates a key per device on the web app and puts it in that tracker's config. The `deviceAuthorization` plugin (pairing by code) comes later.

- Identify the device from the API key. Never trust a `deviceId` from the request.
- A new key creates a new device and leaves the user's other devices alone.
- Deleting a device also revokes its key.

## `POST /tracker/handshake`

- Authenticate with the API key from the header.
- If `protocolVersion` differs from `PROTOCOL_VERSION`, answer 426 with a message telling the tracker to update.
- Otherwise answer `{ deviceId, serverTime, session }`. `session` is `null` if the active session does not include this device.

## `POST /tracker/heartbeat`

- Update `Device.lastSeenAt`.
- Answer `{ serverTime, session: null | { id, status, startedAt, plannedEndAt } }`. `session` is `null` if the active session does not include this device.

## Activity upload

- Reject the batch if the session does not include this device.
- Skip ids that already exist, so a resend is safe.
- Trim every activity to the session's time window and remove the time inside any `SessionPause`. This is mandatory: a tracker can keep recording until its next heartbeat, and an offline tracker doesn't know about the pause at all.
- Drop an activity that falls entirely inside a pause or outside the session.
- Split an activity that spans a pause. The first part keeps the client `id`; later parts get server-generated ids.
- Process the batch in one transaction, so a resend is still skipped by the first part's `id`.
