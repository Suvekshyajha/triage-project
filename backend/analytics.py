"""Batch-level analytics for the dashboard (what a support manager wants at a
glance). Add more here: avg reply length, top category by urgency, etc."""
from collections import Counter

from schemas import TriagedTicket


def summarise(tickets: list[TriagedTicket]) -> dict:
    return {
        "total": len(tickets),
        "by_urgency": dict(Counter(t.urgency.value for t in tickets)),
        "by_category": dict(Counter(t.category.value for t in tickets)),
        "by_sentiment": dict(Counter(t.sentiment.value for t in tickets)),
        "avg_reply_length": sum(len(t.message) for t in tickets) / len(tickets) if tickets else 0,
    }
