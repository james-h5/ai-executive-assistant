---
name: learn-language
description: Conversational language practice — scenario-based sessions to build enough confidence to speak with locals while travelling
triggers: [learn language, practice Italian, practice Japanese, practice French, practice German, language practice, language lesson, teach me Italian, teach me Japanese, teach me French, teach me German, language drill]
version: 2.0
---

# Learn Language Skill

**Trigger:** Run this skill when James says anything like "practice Italian", "Japanese lesson", "teach me French", "language practice", "language drill", or similar.

## Step 1: Determine Today's Language

Read `projects/language-learning/schedule.md` and match today's month to get the language for this month.

Then read the progress file for that language: `projects/language-learning/progress/[language].md`

Open the session with a single message — no multi-question check-in:

> "Today's language: **[Language]** (month [X] of the rotation).
> Sessions completed: [N] | Last session: [date or —]
> Next up: **[Next Recommended Scenario]** — go with that, or want something else?"

Wait for James's reply. If he confirms, proceed with the suggested scenario. If he names a different scenario, use that instead.

## Step 2: Run the Session (30 min)

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
- After each of James's replies, give a brief note if he used something wrong or a better alternative exists — keep it light, not nitpicky

### Part C — Vocab Recap
End with a quick list of everything covered — key words and phrases only, no explanations. Something James can screenshot and refer back to.

## Step 3: Update Progress File

After the session ends, update `projects/language-learning/progress/[language].md`:

- Increment session count by 1
- Set last session to today's date
- Add the scenario to "Scenarios Covered" with today's date
- Append all new vocab and phrases from Part C to the "Vocab & Phrases Taught" running list
- Advance "Next Recommended Scenario" to the next one in the cycle:
  1. Introductions — who you are, where you're from, what you do
  2. Ordering food and drinks
  3. Asking for directions
  4. Small talk / making friends
  5. At the bar / social situations
  6. Shopping and markets
  *(After all 6 are covered, loop back to #1 and go deeper)*

---

## Output Rules
- Fun and encouraging — this is about enjoying travel, not passing a test
- No grammar theory unless James specifically asks
- Focus on useful, realistic phrases — things you'd actually say
- Pronunciation guides must be readable at a glance
- If James makes a mistake in the dialogue, gently correct and move on — don't dwell