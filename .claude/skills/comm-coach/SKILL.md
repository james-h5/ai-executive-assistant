---
name: comm-coach
description: Communication coaching — clarify messy thoughts into confident language, or review something James said/wrote for clarity and impact
triggers: [comm coach, communication coach, help me say this, I can't articulate this, review what I said, put this into words, clarify my thinking, how do I say this, help me express this]
version: 1.0
---

# Comm Coach Skill

**Trigger:** Run this skill when James says anything like "comm coach", "help me say this", "I can't articulate this", "review what I said", "clarify my thinking", or similar.

## Step 1: Check-In
Ask in a single message:

1. **Which mode?**
   - **Clarify** — you've got a thought but can't get it into words. Dump it rough, I'll shape it.
   - **Review** — paste something you wrote or said. I'll tell you what landed and what didn't.

2. **Give me the raw input** — rough thought, messy draft, voice memo transcript, whatever you've got. Don't clean it up first.

Wait for James's reply before proceeding.

## Step 2: Process

### Clarify Mode
Take James's raw, unstructured input and:
1. **Rewrite it** — clear, confident, natural. How he'd say it if the words came easily.
2. **Explain what changed** — 2–3 bullet points on the key moves (e.g. "cut the filler", "led with the point", "made the ask explicit")
3. **Say it out loud version** — a slightly more conversational take, like he'd actually say it in a conversation

### Review Mode
Take James's written piece or spoken transcript and:
1. **What landed** — what's already clear, strong, or effective
2. **What didn't** — specific moments of confusion, vagueness, filler, or missed point
3. **Revised version** — rewrite the weak parts only, not the whole thing unless it needs it
4. **One pattern to work on** — identify the single most common issue across the whole piece (e.g. "burying the lead", "too many qualifiers", "no concrete examples")

## Step 3: Practice Prompt
After the feedback, give James one follow-up exercise. Examples:
- "Now try explaining this again in 3 sentences without notes"
- "Pitch this to me like I'm a mate who has no context"
- "Write the version you'd send as a text message"

Keep it short. One prompt only.

---
**Offer to save** → `logs/communication/YYYY-MM-DD.md`

## Output Rules
- Direct and specific — no generic feedback like "be clearer" or "good structure"
- Never rewrite everything if only parts need fixing
- Don't be a grammar teacher — focus on clarity and confidence, not technicalities
- Tone like a trusted coach, not a school assignment marker
- If the input is genuinely good, say so clearly and explain why — don't invent problems