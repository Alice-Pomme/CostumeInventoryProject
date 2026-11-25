# Costume Inventory

Next.js (App Router) + TypeScript + Tailwind costume inventory app backed by Supabase.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, ESLint, `@/` alias
- `@supabase/supabase-js` + `@supabase/ssr`
- `@dnd-kit/core`, `@dnd-kit/sortable`
- `lucide-react`

## Setup

```bash
npm install
cp .env.local.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase

Helpers live under `src/lib/supabase/`:

- `client.ts` — browser client
- `server.ts` — Server Components / Route Handlers
- `middleware.ts` — optional session-refresh helper (not wired at the root; add later when auth is needed)

Schema for `pieces`, `costumes`, `costume_pieces`, and `commandes`: see [docs/schema.md](docs/schema.md). Typed rows: `src/types/database.ts`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
