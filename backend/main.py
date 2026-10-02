"""FastAPI entrypoint. Run locally with:  python main.py"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
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
    """Return the current AI triage progress (for the loading/progress bar)."""
    return triage.progress


@app.post("/api/triage")
def start_triage(background_tasks: BackgroundTasks):
    """Start the AI triage batch once, in the background."""

    # Don't start a second batch if one is already running.
    if triage.progress["running"]:
        return {"status": "already_running", "message": "Triage is already running."}

    background_tasks.add_task(triage.triage_batch)
    return {"status": "started", "message": "Triage started."}


@app.get("/api/tickets")
def get_tickets():
    """Return already-completed triage results (does NOT start a run)."""

    cached = triage._read_cache()
    if cached is None:
        raise HTTPException(
            status_code=409,
            detail="Triage not ready yet. POST /api/triage first, then poll /api/progress.",
        )

    return {
        "tickets": [t.model_dump() for t in cached],
        "summary": analytics.summarise(cached),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)  # no reload