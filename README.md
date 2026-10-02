# Caregene - AI Support Ticket Triage

I built a small dashboard that takes 20 customer support messages, sends each one to an AI
model, and gets back four things: how urgent it is, what category it belongs to, how the
customer sounds, and a draft reply the agent can send.

The interesting part of this project was not the dashboard. It was getting the AI to label
things the way a real support lead would. That took seven versions of the prompt.

- **Live app:** _TODO_ | **Repo:** _TODO_ | **Video walkthrough:** _TODO_

**[ INSERT IMAGE HERE - Dashboard: stat cards, charts and the ticket table ]**

<br>

**[ INSERT IMAGE HERE - Ticket detail panel with the AI suggested reply ]**

---

## Project structure

```
caregene-triage/
├── prompt-versions/              All 7 prompt versions + their output + my notes
├── backend/                      Python + FastAPI
│   ├── main.py                   API routes
│   ├── prompts.py                The prompt (single source of truth)
│   ├── schemas.py                Pydantic enums - the output contract
│   ├── triage.py                 Groq call, batch loop, retries, cache
│   ├── analytics.py              Counts for the charts
│   └── data/
│       ├── support_tickets.json  The 20 tickets
│       └── triaged_cache.json    Cached results (delete to re-run)
└── frontend/                     React + Vite + TypeScript + Tailwind
    └── src/
        ├── App.tsx               State, filtering, sorting
        ├── api.ts                Fetch wrapper
        ├── types.ts              TS mirror of the backend schema
        └── components/           Stats, Charts, Filters, TicketList, TicketDetail
```

---

## Setup

You need Python 3.10+, Node 18+, and a free Groq key from <https://console.groq.com>.

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python main.py
```

On macOS or Linux, use `source .venv/bin/activate` and `cp .env.example .env`.

Fill in `.env`:

```ini
GROQ_API_KEY=your_key_here
AI_MODEL=openai/gpt-oss-120b
ALLOWED_ORIGINS=frontend url
```

**Frontend**

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_URL=backend url`.

---

## Tech stack and why

| Choice | Why I picked it |
| --- | --- |
| **FastAPI** | One small API that calls a model and returns JSON. Nothing heavier was needed. |
| **Pydantic enums** | This is the important one. The valid labels live in code, not in the prompt. If the model returns anything else, validation fails and the call retries. Schema compliance was 20/20 in all seven runs because of this. |
| **Groq + JSON mode** | Fast and free for 20 tickets. JSON mode plus the Pydantic schema in the prompt means I get real JSON back instead of free text I would have to clean up. Model is set by `AI_MODEL`, so it can be swapped without touching code. Temperature 0.2. |
| **React + Vite + TypeScript** | Vite starts instantly, and `types.ts` mirrors the backend schema, so a label change breaks the build instead of quietly breaking the UI. |
| **Tailwind + Recharts** | Quickest route to a clean dashboard with charts. |

The idea behind the whole thing: **keep the shape of the answer in code and the judgement in
the prompt.** Pydantic guarantees the labels are valid. The prompt decides whether they are
right. That split is why I could rewrite the prompt seven times without breaking the app once.

---

## How it runs

1. You open the dashboard. It calls `GET /api/tickets` to see if results already exist.
2. Nothing cached yet, so it calls `POST /api/triage`, which starts the batch in the background.
3. The backend loops through the 20 tickets one at a time, with a 2 second pause between them
   to stay inside the Groq free tier. Each reply is validated against the schema, and retried
   up to 3 times if it comes back malformed or rate-limited.
4. Meanwhile the frontend polls `GET /api/progress` and shows "Processing ticket 7 of 20".
5. When the batch finishes, results are written to `data/triaged_cache.json` and the dashboard
   loads them. Every reload after that is instant. Delete the cache file to run it again.

---

## The final prompt

This is version 7, the one in [`backend/prompts.py`](backend/prompts.py). It covers urgency
rules, sentiment rules with tie-breakers and tone examples, category rules, and seven numbered
rules for the reply.

<details>
<summary><b>Click to expand the full prompt</b></summary>

```text
You are a support-ticket triage assistant for a health and caregiving app where you handle medication reminders, tele-consultation, health records, account management and billing.
For every customer message, assign exactly one value for each field:
- urgency: Critical | High | Medium | Low
- category: Billing | Technical | Account | Feedback | Other
- sentiment: Angry | Frustrated | Neutral | Happy
- suggested_reply: a short draft an agent could send

For urgency, use these rules:
- Critical: the customer is in immediate danger or needs urgent medical attention, data breach, data loss for health records, a major service outage affecting many users, unauthorized access to an account, emergency alerts not received or not sent on time, a failure that has already caused or is likely to cause a missed dose of critical medication (for example insulin), or any situation that could result in serious harm or legal liability.
- High: a billing problem (double charge, incorrect billing, charged after cancellation), a login failure, or any technical problem that is not Critical but affects the user's medication or health (for example a medication or health feature such as reminders, scanning, tracking or video consultation that is late, missing or not working, where no dose has been missed and there is no immediate risk to health).
- Medium: performance issues, how-to questions, general questions about the app, and technical problems that do not affect medication or health.
- Low: general feedback, feature requests, appreciation or thank-you messages, and questions about pricing, plans, discounts or switching plans.
- If a message fits both Critical and High, choose Critical.

For sentiment, judge the overall tone of the customer's message. The example words below are hints, not requirements. A message can be Angry or Frustrated without any of them. Judge how upset the customer sounds, not how serious the issue is. A serious or health-related issue does not make a message Frustrated by default. Check for Angry signals first, then Frustrated, then Neutral.

- Angry: the customer blames or accuses the company, uses insults or threats, writes a word in ALL CAPS for emphasis (not an acronym such as PDF), says something is "unacceptable" or "fraud", or makes a forceful demand for action. A command with words like "immediately", "now", "right away" or "today" is a forceful demand. A polite request ("please help") is not.
- Frustrated: the customer reports a problem and sounds disappointed, annoyed, worried or stressed, but does not blame or demand forcefully. This includes problems that repeat or keep happening ("still", "again", "every time", "twice"), something that stopped working or used to work, and urgent but polite requests ("please help urgently").
- Neutral: no complaint. Plain questions, how-to requests, information, or suggestions for improvement. A message that reports a problem is never Neutral, even if it ends with a question such as "Can this be fixed?".
- Happy: praise, thanks or appreciation with no problem reported.

Tie-breakers:
- Angry beats Frustrated: if ANY Angry signal is present (ALL CAPS emphasis, "unacceptable", an accusation, an insult, a threat, a forceful command), choose Angry even if the customer also sounds worried, scared or stressed.
- Choose Frustrated only when there is no Angry signal.
- Neutral vs Frustrated: if a problem is reported and any disappointment, repetition or loss of something that worked before is visible, choose Frustrated. Choose Neutral only if there is no complaint at all.
- Mixed messages (praise plus a problem): label the tone of the problem part.

Examples (tone only):
- "Nobody from your team has called me back in three days. This is a disgrace." -> Angry
- "WHY is my appointment list empty? Fix it now." -> Angry
- "I am so worried. The visit summary is wrong and you did nothing about it." -> Angry
- "The step counter froze again after I changed phones, so annoying." -> Frustrated
- "Nothing happens when I tap the chat button. Is this a known problem?" -> Frustrated
- "I am worried, the refill reminder never appeared and my tablets run out on Friday. Please help." -> Frustrated
- "Is it possible to print the visit summary in a larger font?" -> Neutral
- "Thanks, the new colours are lovely!" -> Happy

For category, analyze the content of the message and assign one of the following values:
- Billing: refunds, charges, subscription, pricing, discounts, double charges, cancellation fees, plans, anything about money or payment.
- Technical: app crashing, bugs, slow performance, technical glitches, missing app data, notifications and reminders not working, downloading reports, how to use a feature, settings help.
- Account: login, password reset, account creation, account deletion, account recovery, account security, profile update, personal information update, caregiver or family access, unauthorized access.
- Feedback: praise, thank-you messages, feature requests, suggestions for improvement.
- Other: only if the message does not fit any category above (spam, unrelated or unclear messages).
Login and password problems are always Account, never Technical.
If a message mixes praise with a problem, categorize by the problem.
If unsure between two categories, choose the one that must be fixed first.

For suggested_reply, write a short draft of 2-5 sentences in easy-to-understand language, with a polite and empathetic tone and clear next steps. Follow these rules:

1. Structure: for a problem, start with a short empathy line, then say what the team will do. Technical problem: ask for device details. Account problem: ask for account details. Billing problem: ask for billing details. Thank-you or feedback message: thank the customer for their feedback and appreciation. Do not invent contact details; mention contact information only if it is provided. If a tele-consultation was interrupted, also say the team will look into it and help arrange another consultation if possible.

2. Never invent product facts. Do not state or name any menu path, screen, page, button, price, discount, plan, supported language or feature, and do not imply that a feature, language or option exists. For how-to, pricing, plan, language or export questions, say only that a team member will confirm whether it is available and share the details, unless the facts are provided to you. Do not use any wording that assumes the option exists (for example "we can help you switch", "our family plan", "the steps to export", "the options for switching", "the exact steps for exporting", "we'll provide detailed instructions"). For simple how-to, pricing, plan, language or export questions, do NOT ask the customer for email, device, app version, a screenshot or any other detail.

3. Never claim an action is already done and never guarantee an outcome. The ONLY commitments you may make are that the team will "investigate", "review" or "look into" the issue and will get back to the customer. Do not add anything after that which promises or implies a result - no "ensure", "make sure", "fully", "resolve", "fix", "restore", "refund", "stop", "cancel", "work on" or "work to", and nothing of the form "work to / work on + [result]". For unauthorized access or other security issues, never write "lock"; write: "our security team will review and take steps to secure the account once your identity is confirmed."

4. Ask only for what the system may need, and never for confidential information. Ask ONLY for items on this list, and do not ask for anything else: account email or username, device type, operating system, app version, a screenshot, date and time of the problem, date of the charge or purchase. Do not ask for amounts, "recent changes", how many patients, phone numbers, passwords, OTPs or full card numbers. For security or credential issues, ask the customer to confirm the email address on the account so the team can verify their identity.

5. Safety lines - include the matching line(s) below, and only those; do not give medical advice or a diagnosis, and do not add any other interim health or usage advice:
   - Emergency alert missed, or someone in danger or hurt: tell the customer to contact local emergency services if anyone needs urgent help.
   - Health data missing: ask the customer not to log out of the app or delete the app or account until the team has looked into it.
   - Medication reminder missed, late, failing or not working, or a dose missed: suggest a backup reminder method and contacting their doctor or healthcare provider about any missed dose.
   Do not add the emergency-services or doctor line to tickets that do not match one of these cases.

6. Do not mention internal labels (urgency, category or sentiment), do not repeat or restate the customer's message back (express empathy in general terms instead), and do not blame the customer.

7. Write as the support team, using "we" and "our team" (not "I"). Apologize for angry or frustrated messages, and choose the opening to fit the situation rather than always "We're sorry" - for a billing or account problem "Thank you for letting us know", for a technical problem "Sorry for the trouble", for a health or safety problem "We understand how worrying this is". For feedback or thank-you messages, thank the customer for their feedback and appreciation.
```

</details>

**All seven prompt versions are in the `prompt-versions/` folder in the repo root.** Each one
has the full prompt text, the exact 20-ticket output it produced, and the notes I wrote while
scoring it.

---

## How the prompt evolved

After every version I ran the same 20 tickets, compared all 60 labels (20 tickets x 3 fields)
against a reference set I wrote by hand, then read all 20 replies and counted which rule each
one broke. Whatever got worse became the edit list for the next version.


**v1 had no rules.** It got the dangerous tickets right by instinct, but the replies made
things up: a menu path called "Caregivers > Add Caregiver", a yearly discount, Nepali language
support, a family plan. One reply said "I've locked your account" when the reply does nothing
at all. And a slow dashboard was ranked higher than medication reminders arriving late, which
is backwards for a health app.

**v2 fixed urgency** by writing the four levels out. Late reminders still sat at Medium though,
because no rule mentioned reminder reliability.

**v3 is where I learned the most useful lesson.** I wrote the sentiment rules as lists of
trigger words - "unacceptable", "fraud", "frustrated", "fed up". Sentiment prediction accuracy immediately dropped
. The model started matching words instead of reading tone, so "Fix this immediately"
after a missed insulin dose came back as Frustrated, because none of my words appeared. Listing
example words tells the model to look for words.

**v4 fixed that with one sentence:** "the words below are hints, not requirements - judge how
upset the customer sounds, not how serious the issue is". Sentiment recovered, and the first
batch of reply rules killed all five made-up replies at once. Biggest single jump in reply
quality in the project.

**v5 finally rewrote the High rule properly**, naming the health features out loud, and triage
hit 9.7. But reply quality went *down*, which surprised me. Three safety lines just disappeared,
and my ban on "we will restore" became "work to restore" in six replies.

**v6 taught me that precedence beats description.** One line - "if ANY Angry signal is present,
choose Angry even if the customer also sounds worried" - fixed the last sentiment miss on the
first try, after two versions of longer, richer definitions had failed. Sentiment prediction became very precise

**v7 I deliberately left sentiment and category untouched**, because both were already perfect
and editing them could only lose points. Every edit targeted one named ticket that had failed in
v6. 

---

## One challenge I hit

**Banning words didn't stop the behaviour. It just moved it.**

The rule is simple: the AI can say the team will look into something, but it must never promise
the problem will be fixed. I tried to enforce it with a list of forbidden words, and spent three
versions watching the model walk around my list.

| I banned | It wrote instead |
| --- | --- |
| "I've refunded", "I've fixed" | "work on processing a refund" |
| "we will restore", "ensure" | "work to restore" (six replies) |
| "work on" and "work to" + a result | "ensure the subscription is fully cancelled" |

Same story with features. I banned the phrase "our family plan", so it wrote "the options for
covering multiple patients under one account". I banned "the steps to export", so it wrote "the
steps to download". Every phrase I blocked came back as a paraphrase meaning exactly the same
thing.

What finally worked was flipping it around. In v7 I stopped listing what was forbidden and
listed what was allowed: *the only commitments you may make are that the team will investigate,
review or look into the issue and will get back to you.* That dropped the problem from nine
replies to two.

The real takeaway is that there is a difference between asking a model to **judge** something
and asking it to **obey exact wording**. The judgement rules worked beautifully - urgency,
category and sentiment all reached 20/20 on prompt text alone. The wording rules hit a ceiling:
even in v7, 15 of 20 replies still write "I" instead of "we", even though rule 7 says it
plainly. Wording belongs in code - generate the reply, scan it for banned patterns, retry once
with a specific correction. That's the first thing I'd add next.

---

## Limitations

I want to be straight about what 60/60 does and doesn't prove.

- **It's one run per version**, at temperature 0.2 rather than 0. A single label flipping
  between versions could be randomness, not my edit.
- **The reference labels are mine.** There was no supplied answer key, so a second reviewer
  might disagree on two or three borderline Angry vs Frustrated calls.
- **The 20 tickets are used up.** Every rule from v4 onward was written while staring at these
  exact tickets. 60/60 means "fits these 20", not "will generalise". The honest next step is a
  holdout set of fresh tickets, scored once.
- **Replies are still the weaker half.** 8.6 vs 9.9. They're safe - nothing invented, nothing
  promised, right safety lines - but the tone rules aren't followed closely, and that needs a
  code-side check rather than more prompt text.