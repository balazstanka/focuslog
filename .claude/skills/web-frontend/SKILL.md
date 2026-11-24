---
name: web-frontend
description: Rules for Focuslog's Next.js web app. Use when changing apps/web, including login, the Pomodoro timer UI, tracker status, API key management or statistics pages.
---

# Web frontend

This Next.js version may differ from what you know. Read the relevant guide in `apps/web/node_modules/next/dist/docs/` before writing code.

## Rules

- Get all data from the NestJS API through the `/api/*` rewrite. The web app never touches the database.
- Call the API with same-origin paths, so the better-auth session cookie works without CORS.
- Import schemas and types from `@focuslog/shared`. Add it to `apps/web/package.json` when first needed.

## Styling

- Build UI from the shadcn/ui components in `components/ui`. Add new ones with `pnpm dlx shadcn@latest add <name>` from `apps/web`, then check that the generated imports use `@/lib/utils`, not a bare `"cn"`.
- Use only theme tokens for color (`bg-primary`, `text-muted-foreground`, `border-border`). No hex values or Tailwind palette colors in components.
- The theme lives in `app/globals.css` and has a tweakcn-compatible structure (`:root`, `.dark`, `@theme inline`). Change it in the tweakcn editor and paste the result back. Don't paste tweakcn's `layout.tsx` as is: load only real Google Fonts with `next/font/google` (system fonts such as Times New Roman or Courier New stay CSS stacks), give `weight` for single-weight fonts, point `--font-sans` in `:root` and `.dark` at the `next/font` variable, and keep the `ThemeProvider`.
- Dark mode uses `next-themes` with the `class` attribute. `ThemeToggle` in the navbar switches between light, dark and system.

## Timer UI

- The server owns timer state. Read it from `GET /api/sessions/current` and change it through the `/api/sessions` routes.
- Derive the remaining time from `plannedEndAt`. Don't run an independent client-side countdown as the source of truth.
- A session can start without a tracker.
- When starting a timer, offer a device picker with all devices as the default. Send `deviceIds` only if the user narrowed the choice.
- A work block and a break are both sessions; start them with `POST /api/sessions { kind, durationMs }`. When a `work` session ends, offer to start a break with one click (default 5 minutes, configurable). The server never starts a break on its own. Short and long breaks differ only in `durationMs`.
- Show which kind is running, because the same timer counts down both.

## Day timeline

- Compute the user's local day boundaries and send them as epoch milliseconds: `GET /api/sessions?from=<local midnight>&to=<next local midnight>`. A range can cover up to 31 days, for a week or month view.
- Draw the timeline from the returned sessions: `work` and `break` blocks in order, with their `pauses`. Clip a block that crosses midnight to the day's boundaries.
- Focused time of a block is `(endedAt ?? now) - startedAt` minus its pauses (an open pause counts until now).

## Devices

- List the user's devices, let them generate a key for a new device, and let them delete a device.
- Show each device as alive when its last heartbeat (`Device.lastSeenAt`) was within the last 30 seconds.
