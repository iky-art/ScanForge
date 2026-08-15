# ScanForge v1.0.0

Real-time web security, performance, and quality scanner. No AI, no external
scanning API keys, no fabricated results — every finding comes from an
actual check the scanner performed.

## Stack

- Frontend: Vite, React 19, TypeScript, Tailwind CSS v4, React Router,
  React Three Fiber (3D "ScanForge Core"), Framer Motion, Lucide.
- Backend: Vercel Serverless Functions (`api/`) — no separate server to
  host. Scan progress streams to the UI as a sequence of short, independent
  calls (one per check category) instead of a long-lived connection, which
  is what makes this work cleanly within serverless execution limits.
- Auth & data: Supabase (Auth + Postgres + Row Level Security).

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql` from this repo. It creates
   `profiles`, `scans`, `findings`, `reports`, and enables Row Level
   Security so each user only ever sees their own data.
3. In **Authentication → Providers**, enable **GitHub** and follow
   Supabase's prompt to create a GitHub OAuth app, or leave it disabled and
   users can still sign up with email + password.
4. In **Authentication → URL Configuration**, add
   `http://localhost:5173/dashboard` as an allowed redirect URL (and your
   production Vercel URL once deployed).
5. Copy your project's **Project URL** and **anon/public key** from
   **Settings → API** — never the `service_role` key.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The `SCAN_*`
values already have sensible defaults in code — only override them if you
need to.

## 4. Run it locally

This project uses Vercel's own dev server, which runs the Vite frontend
*and* the `api/` functions together on one port (so `/api/...` calls just
work, no proxy config needed):

```bash
npm install -g vercel   # one-time, if you don't have it
npm run dev
```

Open the URL it prints (usually `http://localhost:3000`).

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the
   repo. Vercel auto-detects Vite; no build settings need to change.
3. In **Project Settings → Environment Variables**, add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as your
   `.env`).
4. Deploy. Frontend and `api/` functions ship together — one URL, no CORS
   config, no separate backend host to manage.

No credit card is required for Vercel's Hobby plan, and it's free for
personal/non-commercial use.

## How the scanner works

- **Website mode**: `POST /api/scan-connect` fetches the target with a
  hardened `safeFetch` (blocks localhost/private/link-local addresses,
  re-validates every redirect hop, caps response size and timeout) and
  returns the raw headers/HTML back to the browser. The browser then calls
  `POST /api/scan-check` once per category (security, web, seo,
  accessibility, performance), passing that same data back — each call is
  a small, independent, stateless function, which is what lets this run on
  serverless without needing a database just to track scan-in-progress
  state.
- **Source mode**: `POST /api/scan-source` accepts a `.zip` upload,
  extracts it with path-traversal protection into a temp directory, scans
  it for secret/credential/insecure patterns via static regex — nothing is
  ever executed — then deletes the temp files.
- **AI Scanner** (v2.0.0) calls a Val Town proxy that forwards to Google's
  Gemini API — the Gemini key lives only on Val Town, never in this repo
  or in Vercel's environment. `api/ai-explain.ts` sends the AI **only**
  the findings a scan already detected (never raw source, never a live
  fetch) and asks it to explain and prioritize them; the prompt
  explicitly instructs the model not to invent, remove, or alter
  findings. Set `VAL_TOWN_AI_URL` in your environment to enable it — if
  unset, the AI Scanner page shows a clear "not configured" message
  instead of failing silently.

## Project structure

```
src/            React app (pages, components, 3D core, scanner types)
api/            Vercel Functions — the only backend entry points
server/         Shared scanning logic (safe fetch, safe zip, rule checks),
                imported by api/*.ts — not deployed as routes itself
supabase/       schema.sql — run once in your Supabase project
```

## Notes / known limitations of this v1 scaffold

- The knowledge base (`src/data/knowledgeBase.ts`) currently documents a
  representative subset of rules end-to-end (what/why/evidence/fix/prevent/
  verify/references). Every rule the scanner can emit already has a
  finding; extend the knowledge base map with the remaining `ruleId`s as
  you go — the documentation panel falls back gracefully for any rule not
  yet written up.
- Report PDF export isn't implemented yet (JSON export is). Add it with a
  library like `@react-pdf/renderer` if you need it.
- Per-IP rate limiting isn't included in this serverless setup (in-memory
  limiters don't work across function invocations). If you need it, add
  Vercel's Edge Config or a shared store like Upstash Redis in front of
  `api/scan-connect.ts` and `api/scan-source.ts`.
- `api/scan-check.ts` re-fetches nothing itself for security/seo/
  accessibility/performance checks — it reuses the HTML `scan-connect`
  already retrieved. `web` checks additionally fetch `robots.txt` and
  `sitemap.xml` directly (also via `safeFetch`), since those need separate
  requests.
