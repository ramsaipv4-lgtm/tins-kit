---
id: decision-v1-sprint-the-one-notification-trigger-spec-md-actually
solves: V1 sprint: the one notification trigger SPEC.md actually specifies, wired
triggers: V1 sprint: the one notification trigger SPEC.md actually specifies, wired
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# V1 sprint: the one notification trigger SPEC.md actually specifies, wired

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 63 — V1 sprint: the one notification trigger SPEC.md actually specifies, wired

**Scope, deliberately minimal.** Decisions #61/#62 named the Notifications piece as the next
part of this sprint, after Customers/Payments/Reversals. Re-checking what SPEC.md actually
locks down here (not just its cross-references) before building anything: the merged document
references a "§F taxonomy" and a "core transactional subset" (§9's out-of-scope list) that was
never itemized anywhere in the current text beyond two concrete rules — §4.3.11 step 2 ("admin/
co-admin is still notified regardless" of a reversal request, whether it needs their review or
auto-approved without them) and D31's one exclusion (never a price-change type). Building a
wider taxonomy — low-stock alerts, delivery confirmations, whatever else might seem obviously
useful — would mean inventing requirements nobody has actually validated. This closes exactly
the one rule that is locked, and leaves the rest correctly unbuilt rather than guessed at.

**What was built:**
- `supabase/migrations/0018_reversal_request_notifications.sql` — `notify_admins(p_type,
  p_payload)`, a generic SECURITY DEFINER writer (the pattern `rls-policies.sql`'s own comment
  on the `notifications` INSERT policy already named as the intended future shape — no INSERT
  policy for any role, same as `audit_log`'s trigger-only precedent) that inserts one row per
  current admin/co-admin, `role_at_creation` taken from their real current role (D27). Re-issues
  `request_sale_reversal` (migration 0017) with a call to it added at the end — `'reversal_
  requested'` when the request stays `requested` (needs review), `'reversal_auto_approved'` when
  a `can_self_reverse` requester's own request auto-approved (D22, §4.3.11 step 2's "regardless"
  clause — admin still sees it even though their decision wasn't needed). Migration 0017's own
  comment, which had flagged this as not-yet-possible, is left as written and annotated pointing
  here — the same self-correction style SPEC.md's D38→D40 already uses, not silently rewritten.
- `src/components/NotificationBell.tsx` — a personal-inbox dropdown in the header: unread-count
  badge, a list of the requester's own notifications (RLS already scopes everything to
  `auth.uid()` — no new policy needed, `notifications_select_own`/`notifications_update_own`
  from migration 0012 cover read and mark-read), click-to-mark-read, "mark all read." A type→text
  map (`TYPE_TEXT`) covers the two types that currently exist; every notification links to
  `/reversals`, the one screen anything here can actually be acted on. Wired into `Layout.tsx`
  next to `RoleBadge`, visible to every signed-in user (the table's RLS is per-user regardless of
  role; only admin/co-admin happen to receive anything yet, but the UI itself isn't role-gated).
- **One repeat of a mistake this exact session already fixed once, caught before committing:**
  the new component's timestamp line originally used `text-slate-400` — the precise class T8
  (decision #60) removed from the palette for failing WCAG AA contrast, in a file built *after*
  that removal. Re-checked directly (`grep -n "slate-400\|slate-300"` against the new file, not
  assumed clean) and fixed to `text-slate-500` before running the gate.

**Verified:** `npx tsc --noEmit` clean, `npm run validate` (73/73), `npm run build` clean.
Migration 0018 depends on 0017 (not yet applied to the live database either) — both still
pending the user running the full 0015-0018 batch via the Supabase Dashboard SQL Editor.

**Cross-reference:** SPEC.md §4.3.11 step 2, D22, D27, D31; decisions #61, #62; `rls-policies.sql`
migration 0012's own comment on the `notifications` table (named this exact writer shape in
advance); decision #60 (T8's contrast remediation, repeated here in a new file and caught the
same way — independently re-grepped, not assumed).

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 63 — V1 sprint: the one notification trigger SPEC.md actually specifies, wired
