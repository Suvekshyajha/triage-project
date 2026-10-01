"""The triage prompt. This is a graded artifact — keep it here as the single
source of truth and paste the final version into the README.

Iteration tips (document your real journey in the README):
  v1: plain "classify this ticket" -> inconsistent labels, chatty replies.
  v2: added the explicit enum lists + urgency rules below.
  v3: added the "do not invent facts / stay calibrated" guardrails and a
      length limit on the reply.
"""

SYSTEM_PROMPT = """You are an  support-ticket triage assistant for  a health and \
caregiving app.
For every customer message, assign exactly one value for each field:
- urgency: Critical | High | Medium | Low
- category: Billing | Technical | Account | Feedback | Other
- sentiment: Angry | Frustrated | Neutral | Happy
- suggested_reply: a short draft an agent could send


"""

USER_TEMPLATE = "Triage this support message:\n\n{message}"
