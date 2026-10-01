"""AI triage using Groq (Llama 3.3) with JSON mode + Pydantic validation."""

import json
import os
import time

from groq import Groq, RateLimitError
from pydantic import ValidationError

import config
from prompts import SYSTEM_PROMPT, USER_TEMPLATE
from schemas import Ticket, Triage, TriagedTicket


client = Groq(api_key=config.GROQ_API_KEY)

# Built once. Tells the model what shape its JSON must have.
SCHEMA_HINT = json.dumps(Triage.model_json_schema())


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
                    {
                        "role": "user",
                        "content": USER_TEMPLATE.format(message=message),
                    },
                ],
            )

            # Pydantic is the judge: wrong enum values or missing fields fail here.
            return Triage.model_validate_json(resp.choices[0].message.content)

        except RateLimitError:
            if attempt == retries - 1:
                raise

            wait_time = 15
            print(
                f"Groq rate limit reached. "
                f"Waiting {wait_time} seconds before retry..."
            )
            time.sleep(wait_time)

        except (ValidationError, json.JSONDecodeError):
            # The call worked, but the model returned the wrong shape.
            if attempt == retries - 1:
                raise

            print("Model returned an invalid structure. Retrying...")

        except Exception:
            # Other temporary errors: retry with exponential backoff.
            if attempt == retries - 1:
                raise

            wait_time = 2 ** attempt
            print(
                f"Groq request failed. "
                f"Retrying in {wait_time} seconds..."
            )
            time.sleep(wait_time)


def load_tickets() -> list[Ticket]:
    """Load support tickets from the JSON file."""

    with open(config.TICKETS_FILE, encoding="utf-8") as f:
        data = json.load(f)

    return [Ticket(**ticket) for ticket in data]


def triage_batch(force: bool = False) -> list[TriagedTicket]:
    """Triage all tickets and cache the results."""

    # Use existing results unless force=True.
    if not force and os.path.exists(config.CACHE_FILE):
        print("Loading triaged tickets from cache...")

        with open(config.CACHE_FILE, encoding="utf-8") as f:
            return [TriagedTicket(**ticket) for ticket in json.load(f)]

    tickets = load_tickets()

    print(f"Starting AI triage for {len(tickets)} tickets...")

    results: list[TriagedTicket] = []

    for index, ticket in enumerate(tickets):
        print(
            f"Processing ticket {index + 1}/{len(tickets)} "
            f"(ID: {ticket.id})..."
        )

        triage = triage_message(ticket.message)

        results.append(
            TriagedTicket(
                id=ticket.id,
                message=ticket.message,
                **triage.model_dump(),
            )
        )

        # Do not wait after the final request.
        if index < len(tickets) - 1:
            print("Waiting 2 seconds before the next Groq request...")
            time.sleep(2)

    # Save completed results only after the entire batch succeeds.
    with open(config.CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(
            [result.model_dump() for result in results],
            f,
            indent=2,
            ensure_ascii=False,
        )

    print(f"Successfully triaged {len(results)} tickets.")
    print(f"Results cached at: {config.CACHE_FILE}")

    return results