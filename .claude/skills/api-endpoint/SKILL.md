---
name: api-endpoint
description: Conventions and behavior for Focuslog's NestJS API. Use when adding or changing a route, module, guard or service in apps/api, timer or session logic, tracker handshake or heartbeat handling, activity ingestion, OpenAPI docs, or better-auth setup.
---

# API endpoints

## Structure

NestJS 11 on Express, ESM, with a global `api` prefix. One folder per feature in `apps/api/src`:

```
sessions/
  sessions.module.ts
  sessions.controller.ts   routes only: read the DTO and the session, call the service, return its result
  sessions.service.ts      business logic and Prisma queries
```

- Register each feature module in `app.module.ts`.
- Controllers stay thin. Business logic and database access go in services.
- Inject `PrismaClient` from `src/generated/prisma/client` by type. `PrismaModule` is global and provides the same instance better-auth uses.
- Import injected classes as values, not with `import type`. Dependency injection reads their decorator metadata.

## Running

- `pnpm dev:api` runs `src/main.ts` through `scripts/register-swc.ts`, a Node module hook that compiles TypeScript with SWC.
- Don't switch to `tsx`, the Nest CLI or `@swc-node/register`. esbuild doesn't emit decorator metadata, and TypeScript 7 has no JS compiler API.

## Rules

- Make a DTO with `class XDto extends createZodDto(XSchema) {}` from a `@focuslog/shared` schema. Never hand-write the schema in the API.
- The global `ZodValidationPipe` validates every DTO body, query and param, and answers 400 on failure.
- Describe each response with `@ZodResponse({ type: XDto })`. The global `ZodSerializerInterceptor` then strips fields the schema doesn't list.
- Give each controller `@ApiTags(...)`, and `@ApiCookieAuth()` when it needs a web session.
- `main.ts` creates the app with `bodyParser: false`, because better-auth has to read the raw body. `AuthModule` re-adds the JSON parser for every other route.
- Before using a better-auth plugin such as `apiKey`, check its API in the installed version.
- Convert `BigInt` timestamps to `Number` before sending JSON.

For database rules, load `prisma-database`.

## Authentication

`@thallesp/nestjs-better-auth` mounts better-auth at `/api/auth` and registers a global `AuthGuard`.

- Every route requires a web session by default. Mark public routes with `@AllowAnonymous()`, and routes where the session is optional with `@OptionalAuth()`.
- Read the user with `@Session() session: UserSession` and scope every query by `session.user.id`.
- Tracker routes get their own API key guard in step 5 and must not accept a web session.

## OpenAPI

- The Swagger UI is at `/api/docs` and the JSON at `/api/docs/json`, both directly on the API and through the Next.js proxy.
- `openapi/setup-openapi.ts` merges better-auth's own spec into the document under `/api/auth`, so you can sign in from the UI and then call protected routes.

## Timer

The server is the source of truth for timer state. A session can start without a tracker.

| Route                           | Behavior                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/sessions`            | Start a session. A user can have only one `running` or `paused` session. Optional `deviceIds` must all belong to the user; without them, all devices record. |
| `POST /api/sessions/:id/pause`  | Set status to `paused` and open a `SessionPause`.                                                                                                            |
| `POST /api/sessions/:id/resume` | Close the pause and move `plannedEndAt` later by the pause length.                                                                                           |
| `POST /api/sessions/:id/stop`   | End the session.                                                                                                                                             |
| `GET /api/sessions/current`     | Return the active session.                                                                                                                                   |
| `GET /api/sessions`             | List the user's past sessions.                                                                                                                               |

## Devices

| Route                     | Behavior                                                                       |
| ------------------------- | ------------------------------------------------------------------------------ |
| `GET /api/devices`        | List the user's devices with `lastSeenAt`.                                     |
| `POST /api/devices`       | Create a device and its API key. Return the key once; it is never shown again. |
| `PATCH /api/devices/:id`  | Rename a device.                                                               |
| `DELETE /api/devices/:id` | Delete the device and revoke its key.                                          |

## Tracker authentication

The first version uses the better-auth `apiKey` plugin. The user generates a key per device on the web app and puts it in that tracker's config. The `deviceAuthorization` plugin (pairing by code) comes later.

- Identify the device from the API key. Never trust a `deviceId` from the request.
- A new key creates a new device and leaves the user's other devices alone.
- Deleting a device also revokes its key.

## `POST /api/tracker/handshake`

- Authenticate with the API key from the header.
- If `protocolVersion` differs from `PROTOCOL_VERSION`, answer 426 with a message telling the tracker to update.
- Otherwise answer `{ deviceId, serverTime, session }`. `session` is `null` if the active session does not include this device.

## `POST /api/tracker/heartbeat`

- Update `Device.lastSeenAt`.
- Answer `{ serverTime, session: null | { id, status, startedAt, plannedEndAt } }`. `session` is `null` if the active session does not include this device.

## Activity upload: `POST /api/tracker/activities`

- Reject the batch if the session does not include this device.
- Skip ids that already exist, so a resend is safe.
- Trim every activity to the session's time window and remove the time inside any `SessionPause`. This is mandatory: a tracker can keep recording until its next heartbeat, and an offline tracker doesn't know about the pause at all.
- Drop an activity that falls entirely inside a pause or outside the session.
- Split an activity that spans a pause. The first part keeps the client `id`; later parts get server-generated ids.
- Process the batch in one transaction, so a resend is still skipped by the first part's `id`.
