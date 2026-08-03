---
type: project-doc
description: University of Sheffield — VERIFIED against the actual 2026/27 exchange module catalogue (supersedes earlier general-web-search findings)
---

# University of Sheffield — Candidate Units (Verified)

**Source: the real thing.** James found Sheffield's actual published "2026/27 University of Sheffield Study Abroad & Exchange Modules Catalogue" (Google Sheet, as of 26 May 2026) — 836 real modules with confirmed Autumn/Spring/Academic-Year timing and exchange-type eligibility flags. This replaces the earlier Pass 1 findings in this file, which were based on Sheffield's general degree course page (regular curriculum) and turned out to name modules ("Control Systems Design" ACS230, "Energy Systems and Power Electronics", "Communication Systems") that **don't actually match this real exchange catalogue** — either wrong department, wrong code, or not semester-accessible. Good thing this got checked before relying on it.

**RESOLVED (checked the catalogue's own instructions tab):** "Subject-level exchange" doesn't mean broader access — it means the opposite: those students' module choices are *restricted to one subject/school only*. "University-wide exchange" is the category that lets a student mix modules across schools. Since James needs a mixed Engineering + Finance course load, he needs university-wide status — which means modules marked "No" for university-wide (several of the best engineering matches) are realistically **capacity-reserved for dedicated single-subject Engineering exchange partners, not accessible to him.**

Also checked: the per-school notes tab (separate tab in the same spreadsheet) confirms **Electrical and Electronic Engineering has no blanket restriction on Level 3 (300-level) modules** for exchange students — unlike e.g. Sociological Studies, which closes all 300+ modules outright due to capacity. So Level 3 modules marked "Yes" for university-wide (like ELE307) are genuinely accessible, subject to showing "documented undergraduate background" — which James's QUT coursework (EGB242, the prerequisite for EGB345) satisfies.

All modules below are **Autumn semester** (Sept–Jan, matches the window) unless noted — Academic Year modules were excluded since they can't be split for a single semester.

## Engineering (School: Electrical and Electronic Engineering)

| QUT Unit | Sheffield Module | Subject-exchange | Uni-wide exchange | Notes |
|---|---|---|---|---|
| **EGB345** Control and Dynamic Systems | **ELE307 Feedback Systems Design** (10cr) — modelling, analysis, design of feedback control systems, classical control theory, LTI systems | Yes | **Yes** | **Safe either way** — no prerequisite listed, strongest real match found |
| EGB345 backup | ELE316 State-Space Control Design (10cr) | Yes | Yes | Safe either way, but needs ELE209/equivalent prereq — James's EGB345 background should satisfy "or equivalent study" |
| EGB345 backup | ELE317 System Identification (10cr) | Yes | Yes | Safe either way |
| **EGB341** Energy Supply and Delivery | ELE305 Electrical Power Systems (10cr) | Yes | **No** | **Only safe if James's exchange is "subject to subject"** — otherwise inaccessible |
| EGB341 backup | ELE311 Power Engineering Electromagnetics (10cr) | Yes | **No** | Same risk |
| **EGB348** Electronics | ELE309 Integrated Electronics (10cr) — IC circuit elements, VLSI design | Yes | **No** | Same risk — best-named match is restricted |
| EGB348 fallback | ELE203 Electric Circuits (10cr) | Yes | **Yes** | Safe either way, but more basic/introductory than ideal |
| **EGB342** Telecommunications and RF | ELE337 Principles of Communications (10cr) | Yes | **No** | Same risk |

**Resolved read:** James needs university-wide exchange status (for the mixed subject load), so realistically Sheffield delivers **EGB345 (strong, via ELE307) + EGB348 (weak fallback, via ELE203)** — **EGB341 and EGB342 have no accessible Autumn option** for a university-wide exchange student; their good matches are reserved for subject-specific Engineering exchange partners only.

## Finance (Schools: Management, Economics)

Much better hit rate here — nearly everything in these two schools is Yes/Yes regardless of exchange type.

| QUT Unit | Sheffield Module | Subject-exchange | Uni-wide exchange | Notes |
|---|---|---|---|---|
| **EFB343** Corporate Finance | **MGT321 Advances in Corporate Finance** (20cr) | Yes | **Yes** | Excellent, exact-name match, safe either way |
| **EFB335** Investments | MGT3009 Company Analysis and Valuation (20cr) | Yes | **Yes** | Decent match (asset valuation focus), safe either way |
| EFB344 Risk Management and Derivatives | — | — | — | **No Autumn match** — the obvious one, MGT375 Financial Derivatives, is Spring only. Same recurring pattern seen at Bristol (derivatives content skewing to second semester) |

## Administrative notes
- All Autumn modules carry a note that finishing in **December** (rather than staying to January) requires a proctored exam arranged between the school and home university — **doesn't apply to James**, since his plan is to stay through to January and sit exams with everyone else.
- Credits: Sheffield states "2 Sheffield credits = 1 ECTS" — most engineering modules here are 10cr, finance ones 20cr. Need to convert properly against the 48 QUT cp target once a final 4-unit lineup is chosen (don't assume the same credit-per-module count as Aston/Bristol).

## Confirmed viable 4-unit lineup
| QUT unit | Sheffield module | Credits | Level |
|---|---|---|---|
| EGB345 Control and Dynamic Systems | ELE307 Feedback Systems Design | 10 (Sheffield) | 3 |
| EGB348 Electronics (fallback, weaker than ideal) | ELE203 Electric Circuits | 10 | 2 |
| EFB343 Corporate Finance | MGT321 Advances in Corporate Finance | 20 | 3 |
| EFB335 Investments | MGT3009 Company Analysis and Valuation | 20 | 3 |

Total: 60 Sheffield credits (2 Sheffield credits = 1 ECTS per the catalogue) — need to sanity-check this converts cleanly to 48 QUT cp before treating it as locked.

**This means EGB341 and EGB342 both need rescheduling elsewhere in the degree** (not just one leftover unit as originally assumed in `../degree-plan-notes.md`) — update that file's reshuffle plan accordingly: two units need new homes, not one.

## Still to do
1. Confirm the QUT-Sheffield exchange is genuinely coded as "university wide" (VISU02/VIST53 application) rather than subject-level — worth a direct confirmation email even though the mixed-subject requirement makes this the near-certain outcome
2. Verify the 60 Sheffield credit / 48 QUT cp conversion holds for this specific 4-module mix (10+10+20+20 = 60)
3. Confirm James's QUT background (EGB242 completion) is accepted as sufficient "documented background" for the Level 3 modules (ELE307, MGT321, MGT3009) — should be routine but worth having in writing
