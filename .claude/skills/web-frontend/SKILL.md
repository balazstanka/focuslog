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

## Styling

- Build UI from the shadcn/ui components in `components/ui`. Add new ones with `pnpm dlx shadcn@latest add <name>` from `apps/web`, then check that the generated imports use `@/lib/utils`, not a bare `"cn"`.
- Use only theme tokens for color (`bg-primary`, `text-muted-foreground`, `border-border`). No hex values or Tailwind palette colors in components.
- The theme lives in `app/globals.css` and has a tweakcn-compatible structure (`:root`, `.dark`, `@theme inline`). Change it in the tweakcn editor and paste the result back. Don't paste tweakcn's `layout.tsx` as is: load only real Google Fonts with `next/font/google` (system fonts such as Times New Roman or Courier New stay CSS stacks), give `weight` for single-weight fonts, point `--font-sans` in `:root` and `.dark` at the `next/font` variable, and keep the `ThemeProvider`.
- Dark mode uses `next-themes` with the `class` attribute. `ThemeToggle` in the navbar switches between light, dark and system.

## Timer UI

- The server owns timer state. Read it from `GET /sessions/current` and change it through the `/sessions` routes.
- Derive the remaining time from `plannedEndAt`. Don't run an independent client-side countdown as the source of truth.
- A session can start without a tracker.
- When starting a timer, offer a device picker with all devices as the default. Send `deviceIds` only if the user narrowed the choice.

## Devices

- List the user's devices, let them generate a key for a new device, and let them delete a device.
- Show each device as alive when its last heartbeat (`Device.lastSeenAt`) was within the last 30 seconds.
