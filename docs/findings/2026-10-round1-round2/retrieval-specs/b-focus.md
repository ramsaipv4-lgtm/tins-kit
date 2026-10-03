# Focus Desk — SPEC (one-person ticketing and focus assistant)

## 1. What this is
A tiny ticket tracker for one freelancer plus an assistant that decides what I should work on today. Tickets come in from email forwards and from a quick form. Each morning the assistant proposes a short list for the day, and during the day it nudges me when something is slipping.

## 2. The assistant's authority
The assistant may reorder and tag tickets, draft replies and snooze things on its own. It must ask me before it closes a ticket, sends anything to a client, or changes a due date I set myself. If it is unsure which side of that line an action falls on, it asks. Every thing it did is shown in a timeline I can read, and nothing in that timeline can be edited afterwards.

## 3. Features
- Ticket states: new, active, waiting on client, done. Every state change is recorded with who or what did it and when.
- A 7:30 digest by email, and a nudge by push if a ticket has had no movement for three days. Sending must survive a restart: if the process dies mid-send, nothing is sent twice and nothing is lost.
- Time spent per ticket and per client, weekly summary.
- Search across tickets and notes.
- Works from a laptop browser; mobile not needed.

## 4. Stack
Next.js, Postgres through Prisma, one Node process, cron inside the process. The assistant calls an LLM API and a couple of MCP tools (calendar, mail). Runs on one small VPS.

## 5. Out of scope
Multiple users, billing, public portal.
