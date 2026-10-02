"""AI triage using Groq (Llama 3.3) with JSON mode + Pydantic validation."""

import json
import os
import threading
import time

from groq import Groq, RateLimitError
from pydantic import ValidationError

import config
from prompts import SYSTEM_PROMPT, USER_TEMPLATE
from schemas import Ticket, Triage, TriagedTicket


client = Groq(api_key=config.GROQ_API_KEY)

# Built once. Tells the model what shape its JSON must have.
SCHEMA_HINT = json.dumps(Triage.model_json_schema())

# Read by /api/progress for the loading bar.
progress = {"running": False, "current": 0, "total": 0, "ticket_id": None}

# Serialize triage so two concurrent requests can't both run the batch.
_lock = threading.Lock()


def triage_message(message: str, retries: int = 3) -> Triage:
    """Triage a single message into a validated Triage object."""

    for attempt in range(retries):
        try:
            resp = client.chat.completions.create(
                model=config.AI_MODEL,
                temperature=0.2,
                max_tokens=1000,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": (
                            SYSTEM_PROMPT
                            + "\n\nRespond ONLY with a JSON object matching "
                            + "this schema:\n"
                            + SCHEMA_HINT
                        ),
                    },
                    {"role": "user", "content": USER_TEMPLATE.format(message=message)},
                ],
            )
            return Triage.model_validate_json(resp.choices[0].message.content)

        except RateLimitError:
            if attempt == retries - 1:
                raise
            wait_time = 15
            print(f"Groq rate limit reached. Waiting {wait_time} seconds before retry...")
            time.sleep(wait_time)

        except (ValidationError, json.JSONDecodeError):
            if attempt == retries - 1:
                raise
            print("Model returned an invalid structure. Retrying...")

        except Exception:
            if attempt == retries - 1:
                raise
            wait_time = 2 ** attempt
            print(f"Groq request failed. Retrying in {wait_time} seconds...")
            time.sleep(wait_time)


def load_tickets() -> list[Ticket]:
    """Load support tickets from the JSON file."""

    with open(config.TICKETS_FILE, encoding="utf-8") as f:
        data = json.load(f)
    return [Ticket(**ticket) for ticket in data]


def _read_cache() -> list[TriagedTicket] | None:
    """Return cached results if the cache file exists, else None."""

    if os.path.exists(config.CACHE_FILE):
        with open(config.CACHE_FILE, encoding="utf-8") as f:
            return [TriagedTicket(**ticket) for ticket in json.load(f)]
    return None


def _write_cache(results: list[TriagedTicket]) -> None:
    """Write results atomically so a watcher never sees a half-written file."""

    os.makedirs(os.path.dirname(config.CACHE_FILE), exist_ok=True)
    tmp = config.CACHE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump([r.model_dump() for r in results], f, indent=2, ensure_ascii=False)
    os.replace(tmp, config.CACHE_FILE)


def triage_batch(force: bool = False) -> list[TriagedTicket]:
    """Triage all tickets once and cache the results."""

    # Only one batch may run at a time. A second (concurrent) caller blocks
    # here, then finds the cache below and returns instantly — no double run.
    with _lock:
        if not force:
            cached = _read_cache()
            if cached is not None:
                print("Loading triaged tickets from cache...")
                return cached

        tickets = load_tickets()
        progress.update(running=True, current=0, total=len(tickets), ticket_id=None)
        print(f"Starting AI triage for {len(tickets)} tickets...")

        results: list[TriagedTicket] = []
        try:
            for index, ticket in enumerate(tickets):
                progress.update(current=index + 1, ticket_id=ticket.id)
                print(f"Ticket #{ticket.id} is being processed ({index + 1}/{len(tickets)})...")

                triage = triage_message(ticket.message)
                results.append(
                    TriagedTicket(id=ticket.id, message=ticket.message, **triage.model_dump())
                )

                if index < len(tickets) - 1:
                    time.sleep(2)
        finally:
            progress["running"] = False

        _write_cache(results)
        print(f"Successfully triaged {len(results)} tickets.")
        print(f"Results cached at: {config.CACHE_FILE}")
        return results