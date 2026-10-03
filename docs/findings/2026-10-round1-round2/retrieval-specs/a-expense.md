# Pocket Ledger — SPEC (personal expense tracker)

## 1. What this is
A single-user expense tracker I use on my phone. I add what I spent in two taps, categorise it, and see where the month went. It has to keep working in the metro and in my building's lift, so adding and editing entries must work with no signal and sync when the phone is back online. Data lives in a hosted Postgres via Supabase; sign-in is by magic link.

## 2. Users
One person (the owner). A second login for my partner to view only is a maybe for V2.

## 3. Features
- Quick-add: amount, category, account, note, date. Amounts are in rupees with paise; never lose a paisa to rounding.
- Accounts (cash, bank, card). Moving money between two accounts is a single action that changes both balances or neither.
- Monthly view: totals per category, a trend chart for the last six months, biggest spends.
- Budgets per category with a warning when 80% is used.
- Recurring entries (rent, SIP, subscriptions) that post themselves on the due day.
- CSV import from my bank statement; running the same import twice must not double up.
- Edit history: I want to see what an entry looked like before I changed it.
- First run: the app should not look broken when there is nothing yet.

## 4. Stack
React + Vite, Supabase (Postgres, Auth), hosted on Netlify. Installable on the phone home screen. Secrets in env files, never committed.

## 5. Out of scope
Multi-currency, bank API sync, shared household budgets.
