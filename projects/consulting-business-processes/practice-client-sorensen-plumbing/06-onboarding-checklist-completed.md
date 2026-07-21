---
type: note
title: Onboarding Checklist (Completed) - Sorensen Plumbing & Gas (FICTIONAL)
status: complete
---

# Onboarding — Sorensen Plumbing & Gas (FICTIONAL)
Signed: 2026-07-22 | Target live date: 2026-07-29
Filled via [`templates/onboarding-checklist-template.md`](../../../templates/onboarding-checklist-template.md)

## Stage 1 - Contract
- [x] Services agreement sent
- [x] Services agreement signed by client
- [x] Setup fee invoiced ($900 deposit, 50%)
- [x] Setup fee deposit received (fictional)

## Stage 2 - Intake
- [x] Intake form/call scheduled
- [x] Intake form/call completed — see [05-client-intake-form-completed.md](05-client-intake-form-completed.md)
- [x] Existing-customer list received (6 sample entries)
- [x] Tone/voice sample collected
- [x] Notification preferences confirmed (SMS, quiet hours before 6:30am)

## Stage 3 - Build
- [x] Business profile configured (tone, FAQs, qualifying questions, urgent bypass keywords) — `projects/lead-response-demo/src/data/business-profile.json`
- [x] Existing-customer lookup wired up — `projects/lead-response-demo/src/data/customers.json`
- [x] New-lead auto-reply flow built — `handle-new-lead.ts`
- [x] Owner notification flow built — same task, both branches
- [x] Follow-up (no-reply) flow built — `send-followup-check.ts`
- [x] Internal test run — new contact scenario (passed, real Claude output)
- [x] Internal test run — existing customer scenario (passed, correctly skipped qualification)
- [x] Internal test run — follow-up scenario, both branches (passed)
- [x] Internal test run — urgent/gas-safety bypass scenario, added beyond the original checklist since it's a safety-relevant edge case specific to this trade (passed)

## Stage 4 - Client Review
- [x] Walkthrough call booked with client (fictional, 2026-07-28)
- [x] Client has seen a live test run — actual Claude-generated messages reviewed, not just a description (see [07-delivery-handover.md](07-delivery-handover.md) for the exact output shown)
- [x] Client sign-off on tone/wording — "yeah that sounds like me actually" (fictional)
- [x] No tweaks requested this round

## Stage 5 - Go Live
- [~] System connected to real contact channel(s) — **not applicable for this practice run.**
  Delivery channel was scoped as "dashboard only": real Claude API calls, real drafted
  messages, nothing actually sent via SMS/email. No live phone-line integration was built or
  needed to validate the process end to end.
- [x] Client notified of go-live date/time (fictional)
- [x] Handover document sent — [07-delivery-handover.md](07-delivery-handover.md)
- [x] First week check-in scheduled (fictional)

## Stage 6 - Ongoing
- [x] Monthly report cadence agreed — see [08-first-month-report.md](08-first-month-report.md)
- [x] Ongoing invoice schedule set up — see [09-invoice.md](09-invoice.md)

## Note on the one real blocker hit during this practice run
The trigger.dev CLI's `npm run dev` requires a one-time interactive browser login
(`npx trigger.dev login`), which isn't possible from an unattended/sandboxed shell. This
means the full "live in the trigger.dev dashboard" verification step couldn't be completed
in this session — but the actual business logic (phone lookup, tone-matched drafting,
urgent-bypass, existing-customer recognition, follow-up short-circuit) was verified directly
against the real Anthropic API with real output, which is the substantive thing being proven.
**For a real client, the one-time `npx trigger.dev login` needs to happen once, in James's
own terminal, before the first `npm run dev`.**
