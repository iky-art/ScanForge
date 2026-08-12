# ScanForge v1.0.0

Real-time web security, performance, and quality scanner. No AI, no external
scanning API keys, no fabricated results — every finding comes from an
actual check the scanner performed.

## Stack

- Frontend: Vite, React 19, TypeScript, Tailwind CSS v4, React Router,
  React Three Fiber (3D "ScanForge Core"), Framer Motion, Lucide.
- Backend: Node.js, Express, Server-Sent Events for live scan progress.
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
   production URL once deployed).
5. Copy your project's **Project URL** and **anon/public key** from
   **Settings → API** — never the `service_role` key.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=http://localhost:8787
PORT=8787
CORS_ORIGIN=http://localhost:5173
```

## 4. Run it

Frontend and backend are separate processes (the scanner backend needs
outbound network access to actually reach scan targets, which is why it's
not just client-side fetch — most target sites block cross-origin browser
requests via CORS).

```bash
npm run dev:all
```

This runs the Vite dev server (`:5173`) and the scanner API (`:8787`)
together. Or run them separately:

```bash
npm run dev      # frontend only
npm run server   # backend only
```

Open `http://localhost:5173`.

## Deploy the backend to Render (free tier)

1. Push this project to a GitHub repo (Render deploys from Git).
2. On [render.com](https://render.com), **New → Web Service**, connect the
   repo. Render will detect `render.yaml` automatically — or set manually:
   - Build command: `npm install`
   - Start command: `npm run server`
   - Plan: Free
3. In the service's **Environment** tab, set:
   - `CORS_ORIGIN` → your deployed frontend URL (e.g.
     `https://scanforge.vercel.app`) — required, the API rejects
     cross-origin requests from anywhere else.
   - Leave `PORT` as Render sets it automatically.
4. Once deployed, copy the service URL (e.g.
   `https://scanforge-api.onrender.com`) and set it as
   `VITE_API_BASE_URL` in your frontend's environment (Vercel project
   settings → Environment Variables), then redeploy the frontend.

Free tier note: the service sleeps after 15 minutes of no traffic and takes
30–60 seconds to wake up on the next request — expected for occasional use,
not for production traffic under load.



- **Website mode**: the backend fetches the target with a hardened
  `safeFetch` (blocks localhost/private/link-local addresses, re-validates
  every redirect hop, caps response size and timeout) and runs real checks
  against the actual headers/HTML it gets back. Progress streams to the
  browser over Server-Sent Events as each check finishes.
- **Source mode**: uploaded `.zip` files are extracted with path-traversal
  protection into a temp directory, scanned for secret/credential/insecure
  patterns via static regex — nothing is ever executed — then deleted.
- **AI Scanner** is intentionally a "Coming Soon" placeholder in v1. No API
  key is requested and no AI call is made anywhere in this codebase yet.

## Project structure

```
src/            React app (pages, components, 3D core, scanner types)
server/         Express API (scan orchestration, safe fetch, safe zip, rules)
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
- Rate limiting is in-memory per server instance — fine for v1, swap for a
  shared store (e.g. Redis) before running multiple instances behind a
  load balancer.
