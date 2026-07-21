---
type: note
title: Client Intake - Sorensen Plumbing & Gas (FICTIONAL)
status: complete
---

# Client Intake — Sorensen Plumbing & Gas (FICTIONAL)
Completed: 2026-07-22 | Completed by: Rick Sorensen + James
Filled via [`templates/client-intake-form-template.md`](../../../templates/client-intake-form-template.md)

> **This is the source-of-truth doc for the real build.** `projects/lead-response-demo/src/data/business-profile.json` and `customers.json` are derived directly from sections 3-6 below.

## 1. Business Basics
- Business name: Sorensen Plumbing & Gas
- Owner: Rick Sorensen
- Trade / services: General plumbing, gas fitting, hot water systems, blocked drains
- Service area: Wynnum, Manly, Lota, Wakerley, Capalaba (Brisbane bayside)
- Years in business: 16

## 2. Contact Channels
- Primary phone (system monitors this): 0400 000 001
- Business-only or shared with personal? Shared — same number for personal calls, so the
  system needs to only act on job-enquiry-shaped messages, not everything that comes in
- Website contact form: None
- Instagram/Facebook DMs: None active
- Other channels: Word of mouth and Google reviews only, no other enquiry channel

## 3. Business Tone & Voice
- How Rick normally texts a new customer: Casual, straight to the point, no corporate
  politeness. Doesn't use "Hi there!" style greetings. Signs off with his first name only.
- Never uses: "Dear", "kind regards", exclamation marks, emoji
- Always uses: Straightforward yes/no answers, asks for the suburb early ("whereabouts are
  you") since travel time matters for quoting
- Sample real message: *"yeah can do, whats the address and whats the job roughly, ill swing
  by after the one im on now"*

## 4. Qualifying Questions
For a new enquiry, need to know before it's worth a callback:
- Job type (blocked drain, leak, hot water, gas fitting, other)
- Suburb/location
- How urgent (today, this week, no rush)
- Rough description of the problem

**Bypass rule:** any message mentioning "gas leak," "smell gas," or "no hot water and it's
urgent" should skip the qualifying-questions flow entirely and flag as URGENT for immediate
callback — gas safety issues don't get the standard automated treatment.

## 5. Existing Customers
- Roughly 40 regular/repeat customers, mostly residential, a few small commercial accounts
- Currently tracked: paper diary only, no digital record before now
- List provided for the system (name, phone, notes) — sample of 6 for the demo:
  - Karen Whitfield — 0412 111 222 — manages a few rental properties, regular plumbing work
  - Tony DiMaggio — 0413 222 333 — neighbour, small jobs, mate's rates
  - Bayside Cafe (Wynnum) — 0413 333 444 — commercial account, monthly maintenance
  - Sue Patterson — 0414 444 555 — hot water system replacement 2025, occasional callouts
  - Greg Marsh — 0415 555 666 — investment properties, regular tenant-related jobs
  - Wynnum Bowls Club — 0416 666 777 — commercial, quarterly gas safety checks

## 6. Notification Preferences
- Notify via: SMS
- Checks phone: every couple of hours during a normal work day, more if between jobs
- Don't notify before 6:30am — early notifications should queue and send at 6:30am instead

## 7. FAQs
- "Do you charge a call-out fee?" — Yes, $80 call-out, waived if the job goes ahead
- "Are you licensed and insured?" — Yes, licensed plumber and gas fitter, fully insured
- "Do you work weekends?" — Saturdays for urgent jobs only, not Sundays
- "Do you do hot water systems?" — Yes, supply and install, all major brands

## 8. Sign-off
- Reviewed and confirmed by Rick: Yes (2026-07-22)
- Outstanding info: None
