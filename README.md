# Caregene · AI Support-Ticket Triage Dashboard

A web app that triages a batch of 20 customer support messages with AI and presents
them in a clean, filterable dashboard for a support agent.

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + Recharts
- **Backend:** Python + FastAPI (Pydantic-validated, structured AI output)
- **AI:** Groq — Llama 3.3 70B via **JSON mode**, validated against a Pydantic schema

> Take-home for **Caregene — Applied AI Engineer (Intern)**.

- **Live app:** _TODO — paste your deployed URL_
- **Repo:** _TODO — paste your public GitHub URL_
- **Video walkthrough:** _TODO — paste your Loom/recording link_

---

## Features

- Batch triage of support tickets → **urgency, category, sentiment, suggested reply**
- Dashboard: table view, search + filtering, sortable by urgency, colour-coded
  priority & sentiment, detail view
- Batch-level analytics: counts/breakdowns by category, urgency and sentiment (charts)
- **Structured, validated output** (enums enforced on both sides) so results are
  consistent across all 20 tickets
- Loading/progress + error states; triage runs in the background and results are
  cached so demo loads are fast and stable

---

## Project structure

```
caregene-triage/
├── backend/                 # Python + FastAPI
│   ├── main.py              # API routes + CORS (run with: python main.py)
│   ├── config.py            # env/config
│   ├── schemas.py           # Pydantic enums + models (the output contract)
│   ├── prompts.py           # the triage prompt (single source of truth)
│   ├── triage.py            # Groq JSON-mode call + batch + cache
│   ├── analytics.py         # batch-level aggregations
│   ├── requirements.txt
│   ├── .env.example
│   └── data/
│       └── support_tickets.json   # the 20 provided tickets
└── frontend/                # React + Vite + TS + Tailwind
    ├── index.html
    ├── package.json         # frontend dependencies (npm's requirements.txt)
    └── src/
        ├── main.tsx         # entry point (imports index.css → Tailwind)
        ├── App.tsx          # loads data, state, filtering, sorting
        ├── api.ts           # fetch wrapper
        ├── types.ts         # TS mirror of the backend schema
        ├── index.css        # Tailwind directives
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

# Windows:
copy .env.example .env
# macOS/Linux:
# cp .env.example .env
# then open .env and set GROQ_API_KEY (get one at https://console.groq.com)

python main.py
```

Backend runs at <http://localhost:8000>.

**How triage works:** `POST /api/triage` starts the batch in the background →
`GET /api/progress` reports `{running, current, total, ticket_id}` for the progress bar →
`GET /api/tickets` returns the finished results (responds `409` until the batch is done).
Results are cached to `data/triaged_cache.json`, so later loads are instant. Delete that
file (or restart) to re-run the batch.

### 2. Frontend

```bash
cd frontend
npm install

# Windows:
copy .env.example .env
# macOS/Linux:
# cp .env.example .env
# set VITE_API_URL=http://localhost:8000

npm run dev
```

Frontend runs at <http://localhost:5173>.

> The frontend has no `requirements.txt` — its dependencies live in `package.json`, and
> `npm install` reads it. That's npm's equivalent of `pip install -r requirements.txt`.

---

## Tech stack and why

- **FastAPI (Python)** — async and minimal, and Pydantic models let me enforce the exact
  output schema (Urgency / Category / Sentiment enums). Enforcing the contract in code is
  the biggest lever for consistent AI output.
- **Groq — Llama 3.3 70B via JSON mode** — fast and free-tier-friendly for a batch of 20.
  `response_format={"type": "json_object"}` plus a schema hint in the prompt forces valid
  JSON, which I then validate with Pydantic (`model_validate_json`) and retry on failure —
  instead of parsing free text I'd have to repair. The model is configurable via the
  `AI_MODEL` env var.
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
- **v2** — added the explicit enum lists + the urgency rules, and switched to **JSON mode**
  with a schema hint in the prompt, validated with Pydantic (retry on invalid output).
  Fixed label consistency.
- **v3** — added the "do not invent facts / stay calibrated" guardrails and the reply
  length limit, after seeing it invent refund amounts and promise specific timelines.

---

## Deployment

- **Backend (Render):** new Web Service →
  build `pip install -r requirements.txt`,
  start `uvicorn main:app --host 0.0.0.0 --port $PORT`.
  Set env vars `GROQ_API_KEY`, `ALLOWED_ORIGINS` (your deployed frontend URL), and
  optionally `AI_MODEL` (e.g. `llama-3.3-70b-versatile`).
- **Frontend (Vercel/Netlify):** build `npm run build`, output dir `dist`.
  Set `VITE_API_URL` to your Render backend URL.

---

## What I'd improve with more time

_TODO — e.g. per-ticket confidence scores, auth, upload a custom batch, export to CSV,
unit tests on the triage parsing._

## One thing that didn't work / a challenge

_TODO — describe one real challenge, e.g. keeping replies grounded without hard-coding, or
getting consistent urgency on ambiguous tickets._