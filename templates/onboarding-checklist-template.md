---
type: template
title: Onboarding Checklist Template
use_for: Tracking a client from signed agreement through to live system, without dropping a step
---

# Onboarding Checklist Template

One checklist per client. Copy this into a new file per engagement (e.g. inside a
`practice-client-[name]/` or `clients/[name]/` folder) and check items off as they happen.
This is the connective tissue between the proposal/contract stage and the actual build —
its whole job is making sure nothing gets forgotten between "they said yes" and "it's live."

---

## Checklist

```
# Onboarding — [Business Name]
Signed: [date] | Target live date: [date]

## Stage 1 - Contract
- [ ] Services agreement sent
- [ ] Services agreement signed by client
- [ ] Setup fee invoiced
- [ ] Setup fee payment received (or deposit, per payment terms)

## Stage 2 - Intake
- [ ] Intake form/call scheduled
- [ ] Intake form/call completed
- [ ] Existing-customer list received (or confirmed not available)
- [ ] Tone/voice sample collected
- [ ] Notification preferences confirmed

## Stage 3 - Build
- [ ] Business profile configured (tone, FAQs, qualifying questions)
- [ ] Existing-customer lookup wired up
- [ ] New-lead auto-reply flow built
- [ ] Owner notification flow built
- [ ] Follow-up (no-reply) flow built
- [ ] Internal test run — new contact scenario
- [ ] Internal test run — existing customer scenario
- [ ] Internal test run — follow-up scenario

## Stage 4 - Client Review
- [ ] Walkthrough call booked with client
- [ ] Client has seen a live test run (not just a description)
- [ ] Client sign-off on tone/wording ("does this sound like you?")
- [ ] Any requested tweaks made and re-tested

## Stage 5 - Go Live
- [ ] System connected to real contact channel(s)
- [ ] Client notified of go-live date/time
- [ ] Handover document sent (see delivery-handover-template.md)
- [ ] First week check-in scheduled

## Stage 6 - Ongoing
- [ ] Monthly report cadence agreed (see client-reporting-template.md)
- [ ] Ongoing invoice schedule set up
```

## Notes
- Stage 3's internal tests should happen BEFORE the client ever sees the system — never let a
  client's first look be a live test with bugs in it.
- If a stage stalls (e.g. client slow to return the intake form), note the blocker and the date,
  not just "waiting" — this becomes data on where onboarding actually breaks down across clients.
