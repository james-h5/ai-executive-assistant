---
type: project-doc
description: How the UK exchange (2027 S2) reconciles with James's existing QUT degree plan, and what's still an open decision
---

# Degree Plan Reconciliation

Full QUT plan lives in `context/degree-plan.md` — this file only covers the exchange-specific wrinkle.

## The conflict
`context/degree-plan.md` currently plans **2027 S2** (the semester overlapping the exchange study period) as the *only* overload semester in the whole degree — 60cp across 5 units:

| Unit | Notes |
|---|---|
| EGB348 | needs EGB242 (done 2026 S2) |
| EGB341 | needs EGB241 (2027 S1) |
| EGB342 | needs EGB242 (done 2026 S2) |
| EGB345 | **Semester-2-only offering**; gates EGH446 (2028 S2) and EGH445 (2029 S1) |
| EFB335 | needs EFB210 (planned Summer 2026/27) |

A standard UK exchange semester is a normal full-time load — QUT's ratio is 12 QUT cp = 15 UK credits, so a standard UK semester (~60 UK credits) converts to ~48 QUT cp, i.e. **4 units, not 5**.

## Decision (settled 2026-08-03)
- **Exchange will only ever carry a standard 4-unit load.** Don't force a 5-unit overload exchange and don't petition for one.
- Whichever of the 5 units above doesn't get a direct match (or elective slot) at the chosen host university gets **pushed out of 2027 S2 entirely** — James is fine adding an extra semester later in the degree to absorb it, rather than cramming or doing an awkward reshuffle now.
- **Not yet decided:** which unit ends up unmatched, and where it gets rescheduled. That depends on what's actually offered at the host university — e.g. if a strong EGB345 equivalent exists, something else might be the leftover instead. Revisit once `study-plans/` research is underway for the shortlisted universities.
- Worth remembering: EGB345's Sem-2-only restriction is *why* it sits in 2027 S2 in the first place, and it gates EGH446/EGH445 downstream. If EGB345 specifically ends up being the leftover unit, its next available Sem-2 slot in the current plan is already occupied (2028 S2 = EGH446 etc.) — so it would likely need a genuinely new/extra semester, not just a swap into an existing one. If a different unit (e.g. EFB335) ends up being the leftover instead, it has no semester-lock and slots in far more easily. This is a real factor in judging which universities are "good fits" — a university with a strong EGB345 match is worth weighting higher, since keeping EGB345 out of the leftover pile avoids the harder rescheduling problem.

## Expanded candidate pool (2026-08-03)
James confirmed the following units can also be swapped into 2027 S2 (or matched abroad), since none carry a semester-lock — full content in `../qut-unit-content.md`:

| Unit | Currently scheduled | Prereq check |
|---|---|---|
| EFB343 — Corporate Finance | 2027 S1 | Fine — just needs EFB210 |
| EFB344 — Risk Management and Derivatives | 2029 S1 | Fine — just needs EFB210 |
| BSB399 — Business Capstone | 2027 S1 | Credit-wise fine (192cp), but possibly carries an enrolment-rule "final year" restriction — confirm before relying on it, and note capstones are often designed to integrate with the home institution's other units, which can make them a harder sell to match abroad |
| EGH404 — Research in Engineering Practice | 2028 S1 | Fine — needs 144cp, already met well before 2027 S2 |

**This changes the leftover-unit problem for the better.** Previously the plan was "leave the weakest-match unit unmatched, defer it, maybe add an extra semester." Now, if one of the fixed 5 has no good host match (e.g. EGB341's power-systems content is hard to find abroad), the fix can just be a **straight swap**: bring in whichever of these 4 units *does* have a strong host match instead, and move the weak-match unit into the slot the swapped-in unit vacates (2027 S1, 2028 S1, or 2029 S1 — all currently standard-load semesters with room, and none of the weak-match candidates carry a semester-lock). That potentially avoids needing an extra semester at all — worth checking per-university before falling back to the "defer + extra semester" option.

## Cross-reference
A short callout has been added to `context/degree-plan.md` pointing here, so future sessions reading the degree plan know an exchange decision is in flight for 2027 S2.
