---
type: project
title: Lead Response Demo
status: active
---

# Lead Response System — Demo (Real Build)

A genuinely working trigger.dev + Claude automation implementing the AI Lead Response +
Follow-Up System pitched in `projects/ai-consulting-portfolio/ai-lead-response-pitch.md`.
Built against the fictional practice client Sorensen Plumbing & Gas — see
`projects/consulting-business-processes/practice-client-sorensen-plumbing/` for the full
paperwork trail this was built from (intake form is the source of truth for the data files
here).

**No SMS/email is ever sent.** Every "send" is a real Claude-generated message returned by
the task and logged — visible in the trigger.dev dashboard's Output/Logs tabs when triggered.
Do not add Twilio credentials to this project, even though real Twilio keys already exist in
the repo's root `.env` for unrelated reasons — this project is intentionally self-contained
with only two env vars (see `.env.example`).

## What It Does
- `handle-new-lead` — takes a simulated incoming enquiry (name, phone, message, channel).
  Looks up the phone against `src/data/customers.json`. Existing customer → owner-notification
  only, no qualifying questions. New contact → AI-drafted qualifying reply (in the business's
  tone, from `src/data/business-profile.json`) + an owner notification. Gas-leak/urgent
  keywords bypass the qualifying flow entirely.
- `send-followup-check` — manually-triggerable stand-in for the "24hr no-reply follow-up"
  feature (a real 24h wait isn't practical to demo live). Pass `repliedWithin24h: true/false`
  to see either outcome.

## Setup
### 1. Copy env template
```bash
cp .env.example .env
```
Fill in:
- `ANTHROPIC_API_KEY` — same one used by `projects/ai-lead-generator`
- `TRIGGER_SECRET_KEY` — same trigger.dev project as `ai-lead-generator`
  (`proj_omtdpuzktsfskxspmnos`) unless you've split this into its own project

### 2. Install dependencies
```bash
cd "projects/lead-response-demo"
npm install
```

### 3. Test locally
```bash
npm run dev
```
Then use `mcp__trigger__trigger_task` to fire test runs — see the payload examples below.

## Test Payloads

**New contact:**
```json
{ "customerName": "Dave Nguyen", "phone": "0421999888", "message": "hey mate got a leaking pipe under the sink, in wynnum, when can you look at it", "channel": "SMS" }
```

**Existing customer** (phone matches `src/data/customers.json`):
```json
{ "customerName": "Karen Whitfield", "phone": "0412111222", "message": "hi rick, one of my rentals has a dripping tap can you sort it this week", "channel": "SMS" }
```

**Urgent/gas-safety bypass:**
```json
{ "customerName": "New Contact", "phone": "0499111222", "message": "i can smell gas near the meter, need someone asap", "channel": "SMS" }
```

**Follow-up, no reply:**
```json
{ "customerName": "Dave Nguyen", "phone": "0421999888", "originalMessage": "leaking pipe under the sink", "repliedWithin24h": false }
```

## Files
```
src/data/business-profile.json   — Sorensen Plumbing & Gas tone/FAQs/notification prefs
src/data/customers.json          — fictional existing-customer list
src/trigger/lead-response/
  handle-new-lead.ts              — main task
  send-followup-check.ts          — 24hr-no-reply follow-up (manually-triggerable demo stand-in)
```

## Adapting for a real client
Swap `src/data/business-profile.json` and `customers.json` for the real client's completed
`client-intake-form-template.md` answers. Everything else — the tasks, the prompting pattern —
is client-agnostic.
