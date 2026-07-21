---
type: project
title: Practice Client — Sorensen Plumbing & Gas
status: complete
---

# FICTIONAL — PRACTICE RUN ONLY

**Sorensen Plumbing & Gas is not a real business and Rick Sorensen is not a real person.**
This folder is a complete dry run of the entire client-acquisition-to-delivery pipeline,
built to pressure-test every template in `projects/consulting-business-processes/` and to
produce a genuinely working (not mocked) demo of the AI Lead Response System before a real
client ever sees one. None of this should be confused with real pipeline data — real leads
live in `projects/landing-first-client/outreach-pipeline.md`, `cold-call-log.md`, and ClickUp.

## The Persona
Sole trader plumber, Wynnum (Brisbane bayside), 16 years in the trade. Word-of-mouth and
Google reviews only. One mobile number handles everything — quotes, bookings, invoice
questions — and it goes to voicemail whenever he's under a house. No booking software, no
invoicing software (handwritten dockets, invoices are a Word doc he emails when he
remembers), no contact form, no active social media. Zero AI or automation anywhere in the
business — a clean "Soft Close B" case per `cold-call-script.md`.

## Document Index (chronological)
1. [01-cold-call-notes.md](01-cold-call-notes.md) — discovery call, ends Soft Close B
2. [02-ai-audit-report.md](02-ai-audit-report.md) — free sit-down audit, top opportunity identified
3. [03-proposal.md](03-proposal.md) — scoped offer for the AI Lead Response System
4. [04-services-agreement-signed.md](04-services-agreement-signed.md) — signed contract
5. [05-client-intake-form-completed.md](05-client-intake-form-completed.md) — build spec, source of truth for `projects/lead-response-demo/`
6. [06-onboarding-checklist-completed.md](06-onboarding-checklist-completed.md) — tracked through to go-live
7. [07-delivery-handover.md](07-delivery-handover.md) — handover note + internal build notes
8. [08-first-month-report.md](08-first-month-report.md) — simulated first month's report
9. [09-invoice.md](09-invoice.md) — setup + first month's invoice

## The Real Build
The actual AI Lead Response System built for this practice client lives at
`projects/lead-response-demo/` — a genuinely working trigger.dev + Claude automation, not a
mockup. It makes real Claude API calls and returns real drafted messages, visible in the
trigger.dev dashboard. Nothing is actually sent anywhere (no SMS, no email) — see that
project's README for why and how that's enforced.

## Outcome
Every one of the 6 deliverables listed in `projects/consulting-business-processes/README.md`
now has both a generic template and a filled worked example, validated by running an actual
client through the whole thing rather than writing templates in the abstract.
