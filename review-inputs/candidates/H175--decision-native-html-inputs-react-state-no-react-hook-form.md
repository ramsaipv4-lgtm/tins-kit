---
id: decision-native-html-inputs-react-state-no-react-hook-form
solves: Native HTML inputs + React state, no react-hook-form
triggers: Native HTML inputs + React state, no react-hook-form
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Native HTML inputs + React state, no react-hook-form

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 20 — Native HTML inputs + React state, no react-hook-form

**What changed.** W3 ships the 4 forms using `<input>` and `<select>` elements
with `useState`. No form library (no react-hook-form, no formik, no final-form).

**Why.** 4 forms, each with 4-7 fields, all the same pattern (vendor/sku/location
+ kg + price/notes). The total amount of form state per form is small. A form
library would add ~10 KB to the bundle (react-hook-form is ~9 KB minified) for
a feature we don't need: array field management, async validation, complex
multi-step forms, dynamic field arrays. None of that is in W3's requirements.

**Trade-off accepted.** More verbose form code (each input has its own `useState`,
each onChange handler). We deduplicate via `FormField`, `TextInput`, `FormError`,
`FormSuccess` wrappers in `src/components/FormFields.tsx`. The form code reads
top-to-bottom, the validation is HTML5-native (required, type=number, min, max,
step), and the submit handler is one async function per form. If a future W item
needs complex form behaviour (multi-step wizard, conditional fields based on
other fields, server-side validation feedback inline), we can add
react-hook-form then.

**Why not Zod either.** Zod is great for runtime validation of API boundaries.
The forms here validate at the HTML5 level. The Supabase REST API does type
validation on its end (the `numeric(10,3)` constraint on `kg` is enforced by
Postgres). The browser form just needs to be "obviously correct to the user" —
the validation happens at the database. A form that says "kg must be a number"
and lets the browser enforce it is enough for W3.

**Impact on downstream.** The 4 forms are ~80-120 lines each, all of them
read like the SPEC's algorithm spec. A new contributor can read `SaleForm.tsx`
and understand what it does without learning a form library. If W4+ needs
complex forms, we adopt react-hook-form; until then, this is enough.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 20 — Native HTML inputs + React state, no react-hook-form
