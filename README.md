# Caregene · AI Support-Ticket Triage Dashboard

A web app that triages a batch of 20 customer support messages with AI and presents
them in a clean, filterable dashboard for a support agent.

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + Recharts
- **Backend:** Python + FastAPI (Pydantic-validated, structured AI output)
- **AI:** Anthropic Claude (Haiku 4.5) via tool-use for guaranteed structure

> Take-home for **Caregene — Applied AI Engineer (Intern)**.

- **Live app:** _TODO — paste your deployed URL_
- **Repo:** _TODO — paste your public GitHub URL_
- **Video walkthrough:** _TODO — paste your Loom/recording link_

---

## Features

- Batch triage of support tickets → **urgency, category, sentiment, suggested reply**
- Dashboard: table view, search + filtering, colour-coded priority & sentiment, detail view
- Batch-level analytics: counts/breakdowns by category, urgency and sentiment (charts)
- **Structured, validated output** (enums enforced on both sides) so results are
  consistent across all 20 tickets
- Loading + error states; triage results are cached so demo loads are fast and stable

---

## Project structure

```
caregene-triage/
├── backend/                 # Python + FastAPI
│   ├── main.py              # API routes + CORS
│   ├── config.py            # env/config
│   ├── schemas.py           # Pydantic enums + models (the output contract)
│   ├── prompts.py           # the triage prompt (single source of truth)
│   ├── triage.py            # Claude tool-use call + batch + cache
│   ├── analytics.py         # batch-level aggregations
│   ├── requirements.txt
│   ├── .env.example
│   └── data/
│       └── support_tickets.json   # the 20 provided tickets
└── frontend/                # React + Vite + TS + Tailwind
    ├── index.html
    ├── package.json
    └── src/
        ├── App.tsx          # loads data, state, filtering
        ├── api.ts           # fetch wrapper
        ├── types.ts         # TS mirror of the backend schema
        ├── lib/colors.ts    # colour coding
        └── components/      # StatsOverview, Charts, Filters, TicketList, TicketDetail
```

---

## Setup

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # then add your ANTHROPIC_API_KEY
uvicorn main:app --reload
```

Backend runs at <http://localhost:8000>. First call to `/api/tickets` triages the
batch and caches it to `data/triaged_cache.json`; add `?force=true` to re-run.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_URL=http://localhost:8000
npm run dev
```

Frontend runs at <http://localhost:5173>.

---

## Tech stack and why

- **FastAPI (Python)** — async and minimal, and Pydantic models let me enforce the exact
  output schema (Urgency / Category / Sentiment enums). Enforcing the contract in code is
  the biggest lever for consistent AI output.
- **Claude Haiku 4.5 via tool-use** — fast and cheap for a batch of 20, and a forced tool
  call guarantees valid, structured JSON instead of free text I'd have to parse and repair.
- **React + Vite + Tailwind + Recharts** — fast path to a polished, responsive dashboard
  with charts and colour coding.
- **Separate frontend/backend** — frontend deploys to Vercel/Netlify, backend to Render.

---

## Prompts (and how I iterated)

The exact prompt lives in [`backend/prompts.py`](backend/prompts.py). Current version:

```text
You are an AI support-ticket triage assistant for Caregene, a health and caregiving app
(medication reminders, health records, caregiver profiles, tele-consultations).

For every customer message, assign exactly one value for each field:
- urgency: Critical | High | Medium | Low
- category: Billing | Technical | Account | Feedback | Other
- sentiment: Angry | Frustrated | Neutral | Happy
- suggested_reply: a short draft an agent could send

Urgency rules (health & safety first):
- Critical: anything risking health or data loss or security — missed medication,
  fall/emergency alerts not firing, lost health records, unauthorised account access.
- High: billing disputes (double charge, charged after cancelling), cannot log in.
- Medium: how-to questions, performance issues, late notifications.
- Low: feature requests and praise/thank-you messages.

Category & sentiment:
- Use "Other" only when nothing else clearly fits.
- Praise/thank-you is category Feedback, sentiment Happy.

Guardrails:
- Do NOT invent facts, refund amounts, dates, order IDs, or policies. If information is
  missing, acknowledge it and say a human agent will follow up.
- Ground the reply only in what the message actually says. 2-4 sentences, warm and professional.
- Stay calibrated: do not overstate certainty or over-promise.
```

**How I iterated** _(replace with your real notes — graders look for this):_

- **v1** — a plain "classify this ticket" instruction. Problem: inconsistent labels
  (e.g. "urgent" vs "Critical") and long, chatty replies.
- **v2** — added the explicit enum lists + the urgency rules, and switched to **tool-use**
  so the model must return the schema. Fixed label consistency.
- **v3** — added the "do not invent facts / stay calibrated" guardrails and the reply
  length limit, after seeing it invent refund amounts and promise specific timelines.

---

## Deployment

- **Backend (Render):** new Web Service →
  build `pip install -r requirements.txt`,
  start `uvicorn main:app --host 0.0.0.0 --port $PORT`.
  Set env vars `ANTHROPIC_API_KEY` and `ALLOWED_ORIGINS` (your deployed frontend URL).
- **Frontend (Vercel/Netlify):** build `npm run build`, output dir `dist`.
  Set `VITE_API_URL` to your Render backend URL.

---

## What I'd improve with more time

_TODO — e.g. per-ticket confidence scores, retry/backoff on API errors, auth, upload a
custom batch, export to CSV, unit tests on the triage parsing._

## One thing that didn't work / a challenge

_TODO — describe one real challenge, e.g. keeping replies grounded without hard-coding, or
getting consistent urgency on ambiguous tickets._
