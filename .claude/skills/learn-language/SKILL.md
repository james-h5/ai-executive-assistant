---
name: learn-language
description: Conversational language practice — scenario-based sessions to build enough confidence to speak with locals while travelling
triggers: [learn language, practice Italian, practice Japanese, practice French, practice German, language practice, language lesson, teach me Italian, teach me Japanese, teach me French, teach me German, language drill]
version: 1.0
---

# Learn Language Skill

**Trigger:** Run this skill when James says anything like "practice Italian", "Japanese lesson", "teach me French", "language practice", "language drill", or similar.

## Step 1: Check-In
Ask all three of these in a single message:

1. **Which language?** (Italian, Japanese, French, German, other?)
2. **What scenario?** (e.g. ordering food, introductions, asking for directions, shopping, making friends, at the bar)
3. **How long have you got?** (quick 10 mins or a full session?)

Wait for James's reply before starting.

## Step 2: Run the Session

### Part A — Key Phrases
Teach 5–10 phrases relevant to the scenario. Format each as:

| Phrase | Pronunciation | Meaning |
|---|---|---|
| [phrase in target language] | [phonetic guide] | [English meaning] |

Keep pronunciation guides simple and readable — no IPA symbols. Write it how it sounds.

### Part B — Practice Dialogue
Run a short back-and-forth dialogue. James plays himself, Claude plays a local.

- Set the scene in one sentence
- Claude goes first to kick it off
- Keep it 6–10 exchanges
- After each of James's replies, give a brief note if he used something wrong or a better alternative exists — but keep it light, not nitpicky

### Part C — Vocab Recap
End with a quick list of everything covered — key words and phrases only, no explanations. Something James can screenshot and refer back to.

---
**Offer to save** → `logs/language/YYYY-MM-DD--[language].md`

## Output Rules
- Fun and encouraging — this is about enjoying travel, not passing a test
- No grammar theory unless James specifically asks
- Focus on useful, realistic phrases — things you'd actually say
- Pronunciation guides must be readable at a glance
- Keep the whole session tight — 10 mins quick, 20–30 mins full
- If James makes a mistake in the dialogue, gently correct and move on — don't dwell