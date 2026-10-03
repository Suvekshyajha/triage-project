# Caregene - AI Support Ticket Triage

I built a small dashboard that takes 20 customer support messages, sends each one to an AI
model, and gets back four things: how urgent it is, what category it belongs to, how the
customer sounds, and a draft reply the agent can send.

The interesting part of this project was not the dashboard. It was getting the AI to label
things the way a real support lead would. That took seven versions of the prompt.

**Deployment link to see the implementation:** https://triage-project-frontend.vercel.app

## Project structure

```
caregene-triage/
├── prompt-versions/              All 7 prompt versions + their triage cache + my notes
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

The `prompt-versions/` folder at the root holds every prompt I actually ran, the triage cache
each one produced, and the notes I wrote while reviewing it. Everything I say further down can
be checked against those files.

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
| **Pydantic enums** | This is the important one. The valid labels live in code, not in the prompt. If the model returns anything else, validation fails and the call retries. Across all seven versions, every ticket came back with valid values because of this. |
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

---

## How the prompt evolved

**All seven versions are in the `prompt-versions/` folder in the repo root,** each with its
full prompt text, the exact 20-ticket output it produced, and the notes I wrote while reviewing
it. Everything below can be checked against those files.

After every version I ran the same 20 tickets, compared each label against a reference set I
wrote by hand, then read all 20 replies and noted which rule each one broke. Whatever got worse
became the edit list for the next version. Every change from v4 onward was aimed at a specific
ticket that had failed, not at a general feeling that the prompt could be better.

**v1 had no rules.** Just the role and the four fields. It got the dangerous tickets right by
instinct, which was reassuring, but the replies invented things freely: a menu path called
"Caregivers > Add Caregiver", a yearly discount, Nepali language support, a family plan. One
reply said "I've locked your account" when the reply does nothing at all. Another promised a
refund before anyone had looked at the charge. Urgency was inconsistent too: a slow dashboard
was ranked High while medication reminders arriving late sat at Medium, which is backwards for
a health app.

**v2 added urgency rules** for all four levels, plus one line of context about what the app
actually does. The slow dashboard dropped to Medium and how-to questions became consistent.
Late reminders still sat at Medium though, because nothing in the rules mentioned reminder
reliability. I also wrote the High rule badly: "any technical glitch that is not critical or
concerns the user's health" reads as "everything non critical is High", which contradicts the
Medium rule. That one sentence caused problems for the next two versions.

**v3 added category rules and sentiment rules, and this is where I learned the most.** The
category rules worked immediately. Login moved from Technical to Account, which is where it
belongs, and categories stayed correct for every version after this one. The sentiment rules
were the opposite. I wrote them as lists of trigger words, things like "unacceptable", "fraud",
"frustrated", "fed up", and accuracy dropped sharply. The model stopped reading tone and started
matching words. "Fix this immediately" after a missed insulin dose came back as Frustrated,
because none of my words appeared in it. So did "I need this account locked down immediately".
Complaints like "it worked fine last week" and "every single time" came back as Neutral for the
same reason. Listing example words tells the model to go looking for words.

**v4 fixed sentiment with one sentence:** "the words below are hints, not requirements, judge
how upset the customer sounds, not how serious the issue is". I added tie-breakers for Neutral
versus Frustrated and Frustrated versus Angry, and wrote the first seven numbered reply rules.
Sentiment recovered and reply quality jumped more than in any other version. All five
hallucinating replies became safe, nothing claimed to be already done, technical replies started
asking for device and app version, and the health tickets got a real interim safety step. Two
things still broke. Urgency slipped back on the pill scanner and the late reminders, because I
still had not fixed the High rule. And the ALL CAPS ticket stayed Frustrated, because my
Frustrated definition included "worried or stressed" and my tie-breaker ended with "otherwise
choose Frustrated", so Frustrated had quietly become the default for anything serious.

**v5 finally rewrote the High rule properly,** naming the health features out loud: reminders,
scanning, tracking, video consultation. I added "check for Angry signals first, then Frustrated,
then Neutral", and the line "a message that reports a problem is never Neutral, even if it ends
with a question". Urgency settled down and stayed settled. But reply quality went down, which
surprised me. Three safety lines that v4 had produced simply disappeared, even though rule 5
described all three. The security reply still used the word "lock" after I had banned it and
written out the exact replacement sentence. And the ban on "we will restore" came back as "work
to restore" in six replies. I also caught a mistake of my own: several of the tone examples I
had added were close paraphrases of the actual test tickets, so part of the gain might have been
the model copying my examples rather than following the rules.

**v6 taught me that precedence beats description.** One line, "if ANY Angry signal is present,
choose Angry even if the customer also sounds worried, scared or stressed", fixed the last
sentiment miss on the first try, after two versions of longer and richer definitions had failed.
I also replaced every tone example with one on an unrelated topic, which doubled as a test: the
earlier sentiment fixes held anyway, so they had come from the rules, not from the examples.
Making the safety lines mandatory brought all three missing lines back, and banning "work on"
and "work to" cut the promise wording down to two replies. The mandatory safety lines had a side
effect I had not thought about: two replies started adding health advice to tickets that did not
ask for any, and one of them edged towards medical advice. One reply also invented a screen name.

**v7 I deliberately left the sentiment and category blocks completely untouched,** because both
were already behaving and editing them could only make things worse. Everything else targeted a
named failure from v6. Critical now says outright that a failure which caused a missed dose of
critical medication is Critical, High says "where no dose has been missed", and a tie-breaker
says Critical wins when both fit. The promise rule changed from a ban list to an allow list, the
list of things the reply may ask for became closed, naming any screen or button was banned
outright, and the safety lines were narrowed to "include the matching one and nothing else".
That was the version that stopped the triage labels moving around.

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
and asking it to **obey exact wording**. The judgement rules worked beautifully. Urgency,
category and sentiment all came out right on every ticket, using prompt text alone. The wording
rules hit a ceiling: even in v7, 15 of the 20 replies still write "I" instead of "we", even
though rule 7 says it plainly. Wording belongs in code. Generate the reply, scan it for banned
patterns, retry once with a specific correction. That's the first thing I'd add next.

---


staring at these exact 20 messages. So the prompt fits this set well, but I have no proof it
would hold up on tickets it has never seen. The honest next step is a fresh batch of tickets,
written separately and scored once.

**The replies are the weaker half of the output.** They are safe now, nothing invented and
nothing promised, but tone is the part the model follows least closely. Fixing that properly
needs a check in code rather than more prompt text.
