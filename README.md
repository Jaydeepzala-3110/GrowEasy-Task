# GrowEasy CSV Importer

AI-powered CSV importer that maps any lead export into GrowEasy CRM format. Built for the GrowEasy Software Developer assignment.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, TanStack Virtual |
| Backend | Node.js, Express, TypeScript |
| AI | OpenAI (configurable model) |
| Tests | Vitest |
| Containers | Docker + Docker Compose |
| Deploy | Vercel (frontend) + Railway or Render (backend) |

## Bonus features implemented

| Feature | Implementation |
|---|---|
| Drag & drop upload | `UploadZone` — drag & drop + file picker |
| Progress indicators | SSE batch progress bar + live imported/skipped counts |
| Streaming / incremental parsing | PapaParse `step` callback on upload; SSE on import |
| Retry failed AI batches | `MAX_RETRIES` in `aiExtractor.ts` |
| Virtualized table | `@tanstack/react-virtual` in `DataTable` |
| Dark mode | `ThemeProvider` + CSS token swap (header toggle) |
| Unit tests | Vitest — normalizer, CSV parser, file validation |
| Docker | `docker-compose.yml` + per-service Dockerfiles |
| Deployment configs | `render.yaml`, `frontend/vercel.json` |
| README | This file |

## Project structure

```
groweasy/
├── frontend/              # Next.js app
├── backend/               # Express API
├── samples/               # Test CSV files
├── docker-compose.yml     # Run full stack locally
├── render.yaml            # Render Blueprint (backend)
├── DESIGN.md              # Claude UI design system
└── project.md             # Assignment brief
```

## Prerequisites

- Node.js 20+
- OpenAI API key
- Docker (optional, for containerized run)

## Quick start (local)

### Option A — npm

**Backend:**
```bash
cd backend
cp .env.example .env
# Set OPENAI_API_KEY in .env
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### Option B — Docker

```bash
# From repo root — set OPENAI_API_KEY in your shell or .env
export OPENAI_API_KEY=sk-...
docker compose up --build
```

### Option C — root scripts

```bash
npm run install:all
npm run dev
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | API port | `4000` |
| `OPENAI_API_KEY` | OpenAI API key | **required** |
| `OPENAI_MODEL` | Model name | `gpt-4o-mini` |
| `BATCH_SIZE` | Rows per AI batch | `10` |
| `MAX_RETRIES` | Retries per failed batch | `2` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL | `http://localhost:4000` |

## API

### `POST /api/import`

Upload a CSV for AI extraction.

- **Body:** `multipart/form-data`, field `file`
- **Query:** `?stream=true` — Server-Sent Events with batch progress
- **Response (non-stream):** `{ imported, skipped, totalImported, totalSkipped }`

### `GET /health`

Health check endpoint.

## CRM fields

`created_at`, `name`, `email`, `country_code`, `mobile_without_country_code`, `company`, `city`, `state`, `country`, `lead_owner`, `crm_status`, `crm_note`, `data_source`, `possession_time`, `description`

Server-side normalization enforces status/source enums, date validity, and CSV-safe notes.

## Testing

```bash
# All tests
npm test

# Backend only
cd backend && npm test

# Frontend only
cd frontend && npm test
```

## Deployment

One GitHub repo → two services (Vercel frontend + Railway/Render backend). Each platform uses a different **root directory** from the same repo.

### Step 0 — Fix git (important)

Your repo should be initialized at **`groweasy/` root**, not inside `frontend/`.

```bash
cd /path/to/groweasy

# Remove nested git from create-next-app (only if frontend/.git exists)
rm -rf frontend/.git

git init
git remote add origin https://github.com/Jaydeepzala-3110/GrowEasy-Task.git
# add, commit, push — you handle commits yourself
```

### Step 1 — Deploy backend on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select `Jaydeepzala-3110/GrowEasy-Task`
3. Service settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. **Variables** tab — add:

   | Variable | Value |
   |---|---|
   | `OPENAI_API_KEY` | your OpenAI key |
   | `OPENAI_MODEL` | `gpt-4o-mini` |
   | `BATCH_SIZE` | `10` |
   | `MAX_RETRIES` | `2` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | *(set after Vercel deploy — your frontend URL)* |

5. **Settings → Networking → Generate Domain** → copy URL, e.g. `https://groweasy-api-production.up.railway.app`
6. Test: `curl https://YOUR-RAILWAY-URL/health`

`backend/railway.toml` is included for build/start hints.

### Step 2 — Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `GrowEasy-Task`
2. **Root Directory:** `frontend` (click Edit)
3. Framework: Next.js (auto-detected)
4. **Environment Variables:**

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | your Railway backend URL (no trailing slash) |

5. Deploy → copy URL, e.g. `https://groweasy-task.vercel.app`

### Step 3 — Connect CORS (round trip)

Back in **Railway** → backend service → Variables:

```
CORS_ORIGIN=https://groweasy-task.vercel.app
```

Redeploy backend (or Railway auto-redeploys on variable change).

### Alternative backend — Render

Use `render.yaml` in repo root instead of Railway. Same env vars, **Root Directory:** `backend`.

### Post-deploy checklist

- [ ] `curl https://YOUR-BACKEND/health` → `{"status":"ok"}`
- [ ] Frontend loads at Vercel URL
- [ ] Upload `samples/crm-style-export.csv` → preview works
- [ ] Confirm import → AI results appear (needs valid `OPENAI_API_KEY`)
- [ ] No CORS errors in browser DevTools console

### Submission email to varun@groweasy.ai

Include:
- Hosted app URL (Vercel)
- GitHub repo URL
- Position: Intern or Full-Time

## Manual test flow

1. Start backend + frontend
2. Open http://localhost:3000
3. Drag & drop `samples/crm-style-export.csv`
4. Watch incremental parse progress
5. Preview virtualized table
6. Click **Confirm import** — watch SSE batch progress
7. Review imported / skipped results
8. Toggle dark mode in the header

## License

MIT
