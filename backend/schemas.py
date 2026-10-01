"""Pydantic models + enums. These enums are the output contract that keeps
the AI's results consistent and machine-checkable across all 20 tickets."""
from enum import Enum

from pydantic import BaseModel


class Urgency(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class Category(str, Enum):
    BILLING = "Billing"
    TECHNICAL = "Technical"
    ACCOUNT = "Account"
    FEEDBACK = "Feedback"
    OTHER = "Other"


class Sentiment(str, Enum):
    ANGRY = "Angry"
    FRUSTRATED = "Frustrated"
    NEUTRAL = "Neutral"
    HAPPY = "Happy"


class Ticket(BaseModel):
    """A raw support message from the dataset."""

    id: int
    message: str


class Triage(BaseModel):
    """The AI-produced triage for a single message."""

    urgency: Urgency
    category: Category
    sentiment: Sentiment
    suggested_reply: str


class TriagedTicket(Ticket, Triage):
    """A ticket joined with its triage result (what the dashboard renders)."""
