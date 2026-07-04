# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Runtime:** Bun (package manager + runtime). All scripts use `bun`, lockfile is `bun.lock`.
- **Framework:** Next.js 16 (App Router, `output: "standalone"`, React 19)
- **Database:** SQLite via Prisma ORM (`prisma db push`, no migrations directory)
- **UI:** shadcn/ui (New York style, RSC enabled) + Tailwind CSS v4 + Radix primitives
- **State:** TanStack React Query v5 (server data) + React context (auth) + local useState (UI)
- **Auth:** Custom JWT (`jose` library) in `pmo_token` httpOnly cookie, bcrypt, TOTP 2FA (`otplib`)
- **Forms:** react-hook-form + zod v4
- **Charts:** recharts, **Icons:** lucide-react, **Dates:** date-fns, **Toasts:** sonner

## Commands

```bash
bun run dev          # Start dev server on port 3000 (with Prisma push first via .zscripts/dev.sh)
bun run build        # Production build (next build + copy standalone artifacts)
bun run start        # Production server (standalone server.js)
bun run lint         # ESLint (flat config, nearly all rules disabled — see eslint.config.mjs)
bun run db:push      # Push Prisma schema to SQLite (no migrations — schema-driven)
bun run db:generate  # Regenerate Prisma client
```

**Full dev startup:** `.zscripts/dev.sh` — runs install → db:push → Next.js dev server (port 3000) → mini-services.

**Production build:** `.zscripts/build.sh` — full pipeline: install → next build → copy standalone artifacts + DB + Caddyfile → package tar.gz.

**Production start:** `.zscripts/start.sh` — starts Next.js standalone server + mini-services + Caddy reverse proxy (port 81).

## Architecture

### SPA-within-Next.js pattern

The entire authenticated app lives in a single page (`src/app/page.tsx`). View navigation is client-side state (`ViewType` union type), not Next.js routing. This means:
- **No deep-linking** for views like `/dashboard`, `/customers`, etc.
- **No browser back/forward** navigation — all view state resets on refresh (auth session persists via cookie).
- The view dispatcher switch is in `page.tsx` → `renderContent()`.

View types: `dashboard`, `customers`, `projects`, `project-detail`, `reports`, `upload`, `divisions`, `users`, `profile`, `timeline-builder`.

### Auth flow

1. `AuthContext` (`src/components/pmo/auth-context.tsx`) checks `/api/pmo-auth/session` on mount.
2. Login → JWT stored in `pmo_token` httpOnly cookie (7-day expiry) via `jose` HS256 signing.
3. Optional per-user TOTP 2FA: login returns a temp token if 2FA is enabled → user enters code → verify endpoint issues real JWT.
4. `getCurrentUser()` in `src/lib/auth.ts` reads the cookie server-side — used by API routes for auth checks.
5. `next-auth` is listed as a dependency but **NOT used** — auth is fully custom.

### Data flow

- **Server data:** TanStack React Query hooks in `src/components/pmo/use-pmo-data.ts` (25+ hooks). Query keys defined in `queryKeys` object. All mutations invalidate relevant query keys + show sonner toasts.
- **API client:** `apiFetch<T>(url, opts?)` wrapper in `use-pmo-data.ts` — generic fetch with JSON parsing and error throwing.
- **Auth endpoints:** Called directly with `fetch()` (not through React Query) in `AuthContext` and auth page components.

### Database (Prisma + SQLite)

- Schema: `prisma/schema.prisma` — 9 models: User, Division, Customer, Project, Timeline, Report, ExcelFile, TimelineDocument, PasswordResetToken, EmailLog.
- DB path from `.env`: `DATABASE_URL=file:/home/z/my-project/db/custom.db`
- **No migrations** — uses `prisma db push` exclusively. The build script copies the dev DB as the production DB.
- Prisma client singleton in `src/lib/db.ts` (globalForPrisma pattern, query logging enabled in dev).
- Enums are stored as **strings** in the schema (not native Prisma enums), validated in TypeScript with const-object + union type patterns in `src/components/pmo/types.ts`.

### API structure (Next.js App Router route handlers)

All routes under `src/app/api/` use `NextRequest`/`NextResponse`. Standard response shape: `{ data: T }` for single items, `{ data: T[], total: number }` for lists. Errors return `{ error: string }` with appropriate HTTP status codes.

Key API groups:
- `/api/pmo-auth/*` — login, logout, session, 2FA (setup/verify/enable/disable), forgot/reset password, change-password, seed
- `/api/customers`, `/api/projects`, `/api/timelines`, `/api/reports` — standard CRUD
- `/api/divisions` + `/api/divisions/overview` — CRUD + aggregated pending/stats endpoint
- `/api/dashboard` — aggregated KPIs (counts, by-status, by-category, recent, deadlines, pending)
- `/api/timeline-docs` — standalone timeline documents with Excel export via `exceljs`
- `/api/users` — admin-only user management
- `/api/email-logs` — admin-only email log viewer

### Component organization

- `src/components/pmo/` — 16+ app-specific components (one per feature module)
- `src/components/ui/` — 50 shadcn/ui primitives (auto-generated, Radix-based)
- `src/lib/` — shared utilities: `db.ts` (Prisma singleton), `auth.ts` (JWT/password/2FA), `utils.ts` (cn helper)

### Key patterns

- **Enum pattern:** Const objects (e.g., `PROJECT_STATUSES = { PLANNING: 'PLANNING', ... } as const`) with derived union types and label maps. Defined in `types.ts`.
- **Query invalidation:** Mutations invalidate their own key + parent keys (e.g., creating a project invalidates `['projects']` AND `['dashboard']`).
- **IDR currency formatting:** `Intl.NumberFormat('id-ID')` used for budget display in project components.
- **Mini-services:** Placeholder infrastructure exists (`mini-services/` directory, install/build/start scripts) but directory is empty except `.gitkeep`. Services would be standalone Bun apps proxied through Caddy.
- **Caddy reverse proxy:** Runs on port 81, proxies to `localhost:3000` by default. The `XTransformPort` query parameter dynamically redirects to a different port (used by the WebSocket example on port 3003).
- **No tests exist** anywhere in the repository. There is no test runner, no test config, and no `test` script in `package.json`.

### Language mix

The UI is **bilingual English/Indonesian**. Auth pages, Division Panel, Timeline Builder, and User Management use Indonesian labels. Customer Management, Project Management, Dashboard, and Reports use English. Error messages in API auth routes are in Indonesian.

### Path aliases

`@/*` → `./src/*` (configured in `tsconfig.json`)
