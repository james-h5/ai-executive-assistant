---
type: template
title: Client Intake Form Template
use_for: Post-signing information gathering — the source data the actual build is built from
---

# Client Intake Form Template

Send/run this right after the services agreement is signed, before any build work starts. This is
the single source of truth the system gets built from — the discovery call and audit told you
*whether* to build something; this form tells you exactly *what* to build. Run it as a 15-20 minute
call (better) or a written form (faster, lower-fidelity) depending on the client.

---

## Form Structure

```
# Client Intake — [Business Name]
Completed: [date] | Completed by: [owner name] + James

## 1. Business Basics
- Business name / trading name:
- Owner name(s):
- Trade / services offered:
- Service area (suburbs/region):
- Years in business:

## 2. Contact Channels (what the system needs to plug into)
- Primary phone number (the one customers actually call/text):
- Does this number also receive personal calls, or is it business-only?
- Website contact form? (Y/N, link if yes)
- Instagram/Facebook DMs used for enquiries? (Y/N, handle if yes)
- Any other channel enquiries come through (email, Google Business Profile, referral only, etc.):

## 3. Business Tone & Voice
- How do you normally text/talk to a new customer? (casual, formal, matey, straight-to-business)
- Any phrases/words you'd never use, or always use?
- Sample of a real message you've sent a customer (if available) — this is the single best input
  for making the AI sound like the owner, not like a chatbot

## 4. Qualifying Questions (what you actually need to know before calling someone back)
- What info do you need from a new enquiry before it's worth a callback?
  (e.g. job type, location, urgency, budget range, property type)
- Any enquiry types that should NOT go through the automated flow (e.g. genuine emergencies —
  these should bypass the system and ring through immediately)

## 5. Existing Customers
- Roughly how many regular/repeat customers do you have?
- How do you currently keep track of them, if at all? (paper, spreadsheet, memory, none)
- Can you provide a list (name + phone) so the system can recognize them and skip the
  new-lead qualification questions? (This is the #1 objection tradies raise — nobody wants
  their regulars getting a robotic "please answer these 4 questions" reply.)

## 6. Notification Preferences
- How do you want to be notified of a new lead? (SMS, email, both)
- How fast do you check your phone during a normal work day?
- Anything you don't want to be notified about (e.g. don't wake me before 7am)?

## 7. FAQs / Common Questions
- What are the 3-5 questions customers ask most often that a reply could pre-empt?
  (e.g. "do you charge a call-out fee", "are you licensed/insured", "do you work weekends")

## 8. Sign-off
- Reviewed and confirmed by client: [Y/N]
- Any information still outstanding, and who's chasing it:
```

## Notes
- Section 3 (tone/voice) is the highest-leverage section — a generic "professional AI assistant"
  voice is the single biggest thing that makes a system feel like a bot instead of the business owner.
- If the client can't produce an existing-customer list, that's fine — note it and ship without
  that feature initially rather than blocking the whole build on it.
- This form doubles as the spec doc for the actual build — the "source of truth" language matters,
  don't let it drift out of sync with what actually gets shipped.
