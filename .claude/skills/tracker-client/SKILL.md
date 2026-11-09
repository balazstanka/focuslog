---
name: tracker-client
description: Required behavior of the Focuslog desktop tracker. Use when changing apps/tracker, including the handshake, heartbeat polling, recording, segment merging, offline buffering or clock skew correction.
---

# Tracker client

The tracker records only while the server says the user's timer is running on this device. It takes all schemas from `@focuslog/shared`.

## Startup

1. Read the API key from the tracker's config.
2. Call `POST /tracker/handshake` with `{ protocolVersion, deviceName, platform }` and the key in a header.
3. On 426, stop and ask the user to update the tracker.
4. Compute the clock offset from `serverTime` and correct every timestamp with it.

## Heartbeat

Call `POST /tracker/heartbeat` every 10–15 seconds. The `session` in the response controls the tracker:

| `session`                       | Action                                               |
| ------------------------------- | ---------------------------------------------------- |
| `running`                       | Record.                                              |
| `paused`                        | Close the current segment and stop recording.        |
| `null`, `finished`, `cancelled` | Close the current segment, upload the rest and stop. |

`null` also means the active session does not include this device.

After a pause, a `running` response starts a new segment with a new UUID.

The tracker learns about a pause only at its next heartbeat. The server removes anything recorded in that gap on upload, so the tracker doesn't need to compensate.

WebSocket push comes later. Polling is enough until then.

## Segments

- Merge time in the same active window into one segment instead of sending per-second samples.
- Generate a UUID for each segment and keep it across retries. The server uses it to skip duplicates.

## Offline

While the server is unreachable, keep recording until `plannedEndAt` and buffer segments locally. Upload them after reconnecting. The server trims whatever fell into a pause it recorded in the meantime.
