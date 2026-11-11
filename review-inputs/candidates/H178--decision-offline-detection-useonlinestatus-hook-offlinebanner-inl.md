---
id: decision-offline-detection-useonlinestatus-hook-offlinebanner-inl
solves: Offline detection: `useOnlineStatus` hook + `OfflineBanner` + inline form errors
triggers: Offline detection: `useOnlineStatus` hook + `OfflineBanner` + inline form errors
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Offline detection: `useOnlineStatus` hook + `OfflineBanner` + inline form errors

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 27 — Offline detection: `useOnlineStatus` hook + `OfflineBanner` + inline form errors

**What changed.** W5 ships three pieces that together enforce SPEC D6 +
§2.14 + §8.7a-c:
1. `src/lib/online.ts` — `useOnlineStatus()` hook. Reads
   `navigator.onLine` on mount, subscribes to the `online` and `offline`
   window events, returns a boolean. Cleanup removes the listeners.
2. `src/components/OfflineBanner.tsx` — renders an amber banner
   ("Offline — read only. Changes will be available when back online.")
   below the header when `online === false`. `role="status" aria-live="polite"`
   so screen readers announce it without stealing focus. When online,
   returns `null` (no DOM, no layout shift).
3. All 4 mutation forms (Delivery, Sale, Transfer, Spoilage) import the
   hook, add `if (!online) { setError("You are offline. Reconnect to record changes."); return; }`
   to the `onSubmit` handler, and `disabled={... || !online || ...}` on
   the submit button.

**Why all three layers.** Belt-and-braces for SPEC §3.5 accessibility +
SPEC D6 graceful degradation:
- The hook is the source of truth. One event-listener, one boolean, all
  components re-render when it flips.
- The banner is the user signal. SPEC §2.14 specifies the exact text.
- The form-level guard is the safety net. A disabled button is the
  primary defense; the inline error is the secondary defense for keyboard
  shortcuts or browser extensions that bypass `disabled`.

**Why the offline state is a boolean, not a richer object (e.g. "online
/ syncing / stale").** The demo has no sync state. There is no
write-queue, no "uploading 3 of 7 mutations" state. A boolean is the
right shape for V1. When the offline write-queue lands in V2, the hook
will evolve to return `{ online: boolean, pending: number, lastSync: Date | null }`.

**Why amber, not red.** Amber is "warning" (you can still do things, just
not mutations). Red is "error" (something is broken). The demo is the
former, not the latter. SPEC §3.5 brand palette is amber-100/200/900 —
we use it consistently for warnings (also in the stock-by-SKU low-stock
highlight).

**Why `navigator.onLine`, not a periodic fetch heartbeat.** The browser
fires `online`/`offline` events on actual network state changes (WiFi on,
WiFi off, captive portal). A fetch heartbeat would add load, have its
own false positives (e.g. the Supabase host is down but the LAN is up),
and is unnecessary because the event API is reliable.

**When this changes.** V2 with the offline write-queue: the hook grows
the richer return shape; the banner grows a "syncing" state and a
"back online" toast; the form guard grows an outbox enqueue path.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 27 — Offline detection: `useOnlineStatus` hook + `OfflineBanner` + inline form errors
