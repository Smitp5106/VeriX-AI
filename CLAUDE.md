# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**VeriX AI** is a full-stack fake-news / misinformation detection web app. It combines a trained ML classifier (TF-IDF + PassiveAggressive) with real-time RSS corroboration from free Google News / Bing News feeds. The user submits text (or an image, OCR'd client-side) and gets back a `LIKELY FAKE` / `LIKELY REAL` / `UNCERTAIN` verdict plus factors, sentiment, trust score, and matching source links.

## Repository layout

```
backend/      Express.js API (Node 18+, CommonJS) — auth, analyze, history, AI inference
  ai/         Python classifier, training pipeline, and exported JS model data
  models/     Mongoose schemas (User, History)
  routes/     Express routers (auth.js, detect.js)
frontend/     Next.js 16 app (App Router, React 19, TypeScript, Tailwind v4)
  app/        Routes: /, /detect, /result, /dashboard, /auth, /login, /signup, /about, /pricing
  components/ ui/ (shadcn primitives), verix/ (app-specific), landing/
  lib/        Utilities (cn() and API_URL helper)
dataset/      Training data (Fake.csv.zip, True.csv.zip was renamed/moved, FakeNewsNet-master.zip, liar_dataset.zip)
ml-model/     Empty placeholder directory holding a Python venv (no source code)
vercel.json   Project-level Vercel config wiring frontend + /_backend prefix
```

## Common commands

### Backend (Node)
```bash
cd backend
npm install
npm start                  # runs `node index.js` on PORT (default 5000)
```
Required env vars: `MONGO_URI` (defaults to `mongodb://127.0.0.1:27017/verix-ai`), `JWT_SECRET` (defaults to a hardcoded dev value — **always set in production**), `PORT`.

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev                # next dev
npm run build              # next build
npm run start              # next start
npm run lint               # eslint .
```
Frontend reads `NEXT_PUBLIC_API_URL` (or `NEXT_PUBLIC_VERCEL_URL`) to find the backend. See `frontend/lib/utils.ts` for the resolution logic. In dev, unset → `http://localhost:5000`; on Vercel → same-origin `/_backend` proxy.

### ML model — train and export
The ML pipeline lives in `backend/ai/`. The venv at `ml-model/venv` is used for Python deps (the scripts hardcode paths back to `backend/ai/`).
```bash
# Train (requires dataset/Fake.csv.zip and a True.csv.zip in C:\Users\HP\Desktop\VeriX-AI\dataset\)
ml-model/venv/Scripts/python.exe backend/ai/train.py
ml-model/venv/Scripts/python.exe backend/ai/export_model.py
```
`train.py` extracts the CSVs to `backend/ai/temp_extract/`, fits a `TfidfVectorizer` (max_features=5000) + `PassiveAggressiveClassifier`, pickles both, and cleans up. `export_model.py` flattens the pickles into `backend/ai/model_data.json` (vocabulary, IDF, coefficients, intercept) so the Express route can do inference without Python.

### Single-test / smoke checks
```bash
# Run the test suite (parses the JS route, no framework — see backend/test_suite.js)
cd backend && node test_suite.js

# Manually classify a snippet via the Python CLI
echo "Some news text" | ml-model/venv/Scripts/python.exe backend/ai/classify.py

# Manual corroboration-only check
echo "Some news text" | ml-model/venv/Scripts/python.exe backend/ai/corroborate.py

# Hit the running API
curl -X POST http://localhost:5000/api/detect/analyze \
  -H "Content-Type: application/json" \
  -d '{"content":"Reuters reported on Monday that..."}'
```

## Architecture

### Request flow: `/detect/analyze`
1. `backend/index.js` mounts `/api/auth` and `/api/detect` (also under `/_backend/...` for Vercel routing).
2. `backend/routes/detect.js` `POST /analyze` — runs **optional JWT auth** (sets `req.user` if a valid Bearer token is present, otherwise proceeds anonymously). If `req.user` exists, the result is persisted to `History`.
3. **ML inference (in-process, no Python)** — the route loads `backend/ai/model_data.json` once at startup, tokenizes input, computes TF-IDF in JS, runs the linear decision function against the saved coefficients, and combines with a `heuristicScore()` regex-based signal (`FAKE_PATTERNS`, `REAL_SIGNALS`, `FAKE_WORDS`, `REAL_WORDS`, length buckets).
4. **Real-time corroboration** — `corroborate()` extracts an 8-word query from the claim, fetches Google News RSS (falls back to Bing News RSS) via `axios`, and runs each result through `passesTwoLayerMatching()`:
   - Layer 1: semantic recall (≥50% of claim keywords, with synonym expansion via `SYNONYM_GROUPS`).
   - Layer 2: subject–predicate coherence — entities vs. actions within a 5-token window, with `BLOCKER_WORDS` negating a match.
   - Symmetric blocker check rejects titles whose `denies`/`mourns`/`condolences` etc. are absent from the claim (avoids false corroboration when a trusted outlet refutes a rumour).
5. **Verdict fusion** — `combineMlAndCorroboration()` buckets by corroboration score and produces `prediction`, `isFake`, `confidence`, `mlOverridden`, and the verdict reason. Sensational claims (e.g. "killed", "coup", "resigns") with zero trusted corroboration are forced to `LIKELY FAKE` at 72% to defeat fast-moving hoaxes.
6. Response includes `factors[]`, `sentiment`, `trustScore`, `sourceCredibility`, `corroboration.topMatches`, and `explanation`.

### Python mirror
`backend/ai/classify.py` and `backend/ai/corroborate.py` are a parallel Python implementation of the same logic. They are **not** called from the Express server — the server does inference directly from `model_data.json`. Keep the two implementations in sync when changing thresholds, heuristics, synonym groups, or blocker rules.

### Auth
`backend/routes/auth.js` provides `signup`, `signin`, `social-login`, `google-login`. JWT is signed with `JWT_SECRET` and expires in 7 days. Tokens are sent as `Authorization: Bearer <token>` from the frontend (stored in `localStorage`). Google login verifies the access token against `https://www.googleapis.com/oauth2/v3/userinfo` — no OAuth library is used.

### Frontend state
- `frontend/lib/utils.ts` exports `API_URL` resolved at module load (handles dev localhost vs. Vercel `/_backend` prefix).
- `frontend/app/detect/page.tsx` handles three content types: `headline`, `article`, `image`. For images it runs **Tesseract.js OCR in the browser** before submitting the extracted text — no image upload to the server.
- Guest users get `verix_guest_tries` capped in `localStorage`; authenticated users get unlimited analyses plus `/api/detect/history`.
- Result page at `frontend/app/result/page.tsx` reads the latest analysis from session state to render the verdict, factors, and reference links.

## Conventions

- **CommonJS** in `backend/` (`type: "commonjs"` in `package.json`). All routes use `require(...)` and `module.exports`.
- **TypeScript strict mode** in `frontend/`. Path alias `@/*` resolves to `frontend/*`.
- **Tailwind v4** with `@tailwindcss/postcss`; UI primitives in `frontend/components/ui/` follow shadcn conventions (Radix UI + `class-variance-authority`).
- The `.gitignore` excludes `node_modules/`, `.env`, `__pycache__/`, `*.pkl`, `*.joblib`, `venv/`, and `dataset/`.
- Verdict labels are uppercase strings: `LIKELY FAKE`, `LIKELY REAL`, `UNCERTAIN — POSSIBLE FAKE`, `UNCERTAIN — POSSIBLY REAL`. Confidence band: `<68` → uncertain, otherwise commit.
- Both `backend/ai/corrobate.py` and `backend/routes/detect.js` keep their own copies of `TRUSTED_SOURCES`, `UNRELIABLE_SOURCES`, `SYNONYM_GROUPS`, `BLOCKER_WORDS`, `STOP_WORDS`, `FAKE_PATTERNS`, etc. — edit both when changing matching rules.

## Environment notes

- Dev MongoDB runs locally; production uses the same `MONGO_URI` env var. The `History` model stores a `Mixed` blob of the full analysis result.
- The Python venv at `ml-model/venv` is committed (only its presence, not its packages under `Lib/`). Activate with `ml-model/venv/Scripts/activate` (Windows) or use the absolute path shown above.
- `vercel.json` defines `experimentalServices` so frontend and backend deploy together; backend is mounted at `/_backend` and rewrites `/api/*` work transparently to the route definitions.
