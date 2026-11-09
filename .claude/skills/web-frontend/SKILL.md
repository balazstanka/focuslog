---
name: web-frontend
description: Rules for Focuslog's Next.js web app. Use when changing apps/web, including login, the Pomodoro timer UI, tracker status, API key management or statistics pages.
---

# Web frontend

This Next.js version may differ from what you know. Read the relevant guide in `apps/web/node_modules/next/dist/docs/` before writing code.

## Rules

- Get all data from Express through the `/api/*` rewrite. The web app never touches the database.
- Call the API with same-origin paths, so the better-auth session cookie works without CORS.
- Import schemas and types from `@focuslog/shared`. Add it to `apps/web/package.json` when first needed.

## Timer UI

- The server owns timer state. Read it from `GET /sessions/current` and change it through the `/sessions` routes.
- Derive the remaining time from `plannedEndAt`. Don't run an independent client-side countdown as the source of truth.
- A session can start without a tracker.
- When starting a timer, offer a device picker with all devices as the default. Send `deviceIds` only if the user narrowed the choice.

## Devices

- List the user's devices, let them generate a key for a new device, and let them delete a device.
- Show each device as alive when its last heartbeat (`Device.lastSeenAt`) was within the last 30 seconds.
