---
type: project
title: Project Delivery Process (Master SOP)
status: active
---

# Project Delivery Process — Master SOP

The end-to-end path from "cold lead" to "paying, live client," linking every template and doc
that exists for it. This is the index — each stage links out to the actual template/tool used.

## Stage 1 — Discovery (pre-sale)
Tool: [`projects/landing-first-client/cold-call-script.md`](../landing-first-client/cold-call-script.md)

Cold call or initial contact, low-pressure. Ends in one of four outcomes: demo-worthy prospect
(Soft Close A), bigger free-audit opportunity (Soft Close B), already solved (drop), or
emergency-only (deprioritize). Log every call in
[`cold-call-log.md`](../landing-first-client/cold-call-log.md).

## Stage 2 — Audit / Diagnosis
Tool: [`templates/ai-audit-template.md`](../../templates/ai-audit-template.md)

Either the paid $200-400 Fiverr/Upwork version, or the free in-person sit-down offered via
Soft Close B. Produces a ranked list of 3 opportunities with an explicit upsell into the
AI Lead Response System for Brisbane-trades leads.

## Stage 3 — Proposal
Tool: [`templates/proposal-template.md`](../../templates/proposal-template.md)

Turns the audit's top opportunity into a scoped, priced offer. One page, no legal language.

## Stage 4 — Contract
Tool: [`templates/services-agreement-template.md`](../../templates/services-agreement-template.md)

Signed before any build work starts. Covers scope, fees, timeline, IP, liability, term.
Not legal advice — solicitor review before first real use.

## Stage 5 — Onboarding
Tools: [`templates/client-intake-form-template.md`](../../templates/client-intake-form-template.md),
[`templates/onboarding-checklist-template.md`](../../templates/onboarding-checklist-template.md)

Intake form/call gathers the specifics the build is made from (contact channels, tone/voice,
qualifying questions, existing customers, notification prefs). Onboarding checklist tracks
every step from signed contract through to go-live so nothing gets dropped.

## Stage 6 — Build
No generic template — this is the actual engineering work, currently the AI Lead Response +
Follow-Up System (Claude + trigger.dev). See `projects/ai-lead-generator/` for the established
project-structure pattern (package.json, trigger.config.ts, src/trigger/) any new client build
should mirror. Internal test runs (new contact, existing customer, follow-up) happen before the
client ever sees it.

## Stage 7 — Delivery & Handover
Tool: [`templates/delivery-handover-template.md`](../../templates/delivery-handover-template.md)

Client-facing "your system is live" note plus, later if needed, the offboarding steps for when
an engagement ends.

## Stage 8 — Ongoing Reporting
Tool: [`templates/client-reporting-template.md`](../../templates/client-reporting-template.md)

Monthly report timed to the recurring invoice — the justification for the $/month fee.

## Stage 9 — Invoicing
Tool: [`templates/invoice-template.md`](../../templates/invoice-template.md)

Setup fee on signing, monthly fee on a fixed date each month.

---

## Worked Example
Every stage above was run end to end against a fictional practice client to validate the
process and produce a real working demo build — see
[`practice-client-sorensen-plumbing/`](practice-client-sorensen-plumbing/README.md).
