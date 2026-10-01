"""FastAPI entrypoint. Run locally with:  uvicorn main:app --reload"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import analytics
import config
import triage

app = FastAPI(title="Caregene Triage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/progress")
def get_progress():
    return triage.progress
@app.get("/api/tickets")
def get_tickets(force: bool = False):
    """Return all triaged tickets plus batch-level summary.

    Pass ?force=true to re-run the AI instead of using the cache.
    """
    try:
        tickets = triage.triage_batch(force=force)
    except Exception as exc:  # keep the dashboard honest about failures
        raise HTTPException(status_code=502, detail=f"Triage failed: {exc}") from exc

    return {
        "tickets": [t.model_dump() for t in tickets],
        "summary": analytics.summarise(tickets),
    }
