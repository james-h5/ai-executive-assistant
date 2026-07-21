---
type: note
title: Delivery & Handover - Sorensen Plumbing & Gas (FICTIONAL)
status: complete
---

# Delivery & Handover — Sorensen Plumbing & Gas (FICTIONAL)
Filled via [`templates/delivery-handover-template.md`](../../../templates/delivery-handover-template.md)

## Part 1 — Handover Note (as sent to the client)

> Hi Rick,
>
> Your AI Lead Response + Follow-Up System is built and tested as of 2026-07-28. Here's what
> it does and how to use it day-to-day.
>
> **What's live**
> - Auto-replies to new enquiries within 60 seconds, in your voice, asking what's needed
>   before you call back
> - Recognizes your regulars (Karen, Tony, the cafe, Sue, Greg, the Bowls Club, and anyone
>   else on your customer list) and skips straight to notifying you — no robotic questions
>   for people you already know
> - Flags anything mentioning a gas leak or smell as urgent immediately, no automated
>   back-and-forth, straight callback
> - Sends a follow-up nudge if someone doesn't hear back within 24 hours
>
> **What you need to do**
> Nothing day-to-day — it runs automatically. You'll get a text whenever a new lead comes in,
> with their details, so you know what the job is before you even call back.
>
> **If something looks wrong**
> Message or call James directly. Same business day response.
>
> **Your first report**
> First monthly report lands 2026-08-29 — see the reporting template for the format.
>
> Support included in your $300/month: monitoring, bug fixes, minor wording tweaks. New
> features or channels are a separate quote.

## Part 2 — Internal Build Notes

**What was built:** `projects/lead-response-demo/` — a real trigger.dev + Claude project
mirroring `ai-lead-generator`'s structure (same deps, same config pattern). Two tasks:
`handle-new-lead` (main enquiry-handling flow) and `send-followup-check` (24hr no-reply
stand-in, since a real 24h wait isn't demoable live).

**Data source:** `src/data/business-profile.json` and `customers.json` were built directly
from [05-client-intake-form-completed.md](05-client-intake-form-completed.md) — tone sample,
qualifying questions, urgent-bypass keywords, notification prefs, and the 6-entry customer
list all came straight from that intake session.

**Delivery channel decision:** scoped as "dashboard only" — the task makes a real Anthropic
API call and returns real drafted messages, but nothing is ever actually sent via SMS/email.
No Twilio/email integration exists in this project by design (see `README.md`'s explicit
warning not to add Twilio credentials, even though real ones already sit unused in the
repo's root `.env`).

**Verification actually performed:** the trigger.dev CLI's dev server requires a one-time
interactive browser login (`npx trigger.dev login`), which isn't possible from this session's
unattended shell — so full dashboard-visible task registration couldn't be completed here.
Instead, the exact same prompt-construction and branching logic was run directly against the
real Anthropic API (bypassing only the trigger.dev task wrapper, not the actual business
logic) across 5 scenarios. All passed:

1. **New contact, not urgent** — no customer match, got a tone-matched qualifying reply
   ("yeah look at leaking pipes under sink, wynnum works for us. how urgent is it...")
2. **Existing customer (Karen Whitfield)** — matched correctly, `customerFacingReply` was
   `null` (qualification correctly skipped), owner notification named her directly
3. **Urgent gas-safety bypass, new contact** — "smell gas near meter" correctly triggered the
   bypass, skipped normal qualifying questions, replied with an immediate-callback message
4. **Follow-up, no reply within 24h** — drafted a tone-matched nudge
5. **Follow-up, already replied** — correctly short-circuited with no message drafted

**Remaining step for a real client:** run `npx trigger.dev login` once (interactive, needs a
browser) before the first `npm run dev`, then confirm the same two tasks appear and run
cleanly in the actual trigger.dev dashboard alongside `ai-lead-generator`'s existing tasks.
