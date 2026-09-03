---
name: wit-practice
description: Daily 15-minute wit training — quick-fire reps, a real-moment review, and a live scenario drill to build fast, natural wit
triggers: [wit practice, practice wit, wit drill, daily wit, wit training]
version: 1.0
---

# Wit Practice Skill

**Trigger:** Run this skill when James says "wit practice", "wit drill", "practice wit", "daily wit", or similar.

## Step 1: Open the Session
Read `projects/communication-excellence/wit-practice/progress.md`.

Open with one message, no multi-question check-in:
> "Day [N] of wit practice. Streak: [X] days. Today: 3 rounds, ~15 min — quick-fire, a real moment, then a live scenario. Ready?"

If this is day 1 (no sessions logged yet), briefly explain the 3-round format in 2-3 lines first, then go straight into Round 1 — don't wait on a "yes."

## Step 2: Round 1 — Quick-Fire (5 min)
Fire off 5 rapid prompts one at a time, waiting for James's reply before the next. Pull varied categories from `projects/communication-excellence/wit-practice/drill-bank.md` (word association, roast-this-situation, absurd hypothetical, comeback-to-a-jab, caption-this).

- One prompt at a time, minimal setup, keep pace fast
- If James stalls or overthinks, nudge: "first thing that comes to mind"
- One line of real feedback after each answer — what worked, or a sharper alternative. Not a lecture.
- Don't repeat the same category mix as the last logged session (check `progress.md`)

## Step 3: Round 2 — Real Moment Review (5 min)
Ask: "Any moment today or this week where you wanted a better line and didn't have one — bar, gym, uni, wherever?"

- If he's got one: work it like `comm-coach` review mode — what he said (or didn't), 2-3 sharper alternatives, why they land
- If he's got nothing: pull a realistic situation from his actual life (bar shift, boxing gym trash talk, tutoring rapport, client small talk) from `drill-bank.md` and run it as a hypothetical instead

## Step 4: Round 3 — Live Scenario (5 min)
A short back-and-forth roleplay. Claude plays a character, James responds in real time as himself.

- Pick a scenario from `drill-bank.md`, rotating context from the last logged session (bar, gym, tutoring, consulting/client, general social) so it's not the same setting twice running
- Set the scene in one sentence, then go — Claude speaks first
- 4-6 exchanges, staying in character and reacting like a real person would (actually react if a line lands, push back or fall flat if it doesn't — no false positives)
- Break character after: one specific note on what worked, one sharper alternative for the exchange that landed weakest

## Step 5: Close & Log
- One-line summary: what's improving, one specific thing to carry forward
- If a line from the session was genuinely good, ask if he wants it saved to the keeper list
- Update `projects/communication-excellence/wit-practice/progress.md`:
  - Increment session count
  - Update streak (consecutive calendar days — reset to 1 if a day was skipped)
  - Set last session to today's date
  - Log today's category/scenario mix (so Step 2/4 can rotate next time)
  - Add any keeper lines under "Keeper Lines"
  - Note a recurring pattern under "Patterns" if this session revealed one (e.g. "fast on comebacks, slow on absurd hypotheticals")

---

## Output Rules
- Never explain why a joke is funny in the abstract — give the sharper line and let it speak for itself
- Feedback is specific and short — name the actual mechanism (timing, specificity, unexpected angle), not "nice one"
- Keep pace brisk — this is reps, not a seminar. If James is overthinking, say so and move on
- In the roleplay, react like a real person would — don't laugh at something that isn't funny
- If Round 2 surfaces something more about clarity/confidence than wit, mention it but stay in this skill — don't switch into `comm-coach` mid-session
- Whole session should run in ~15 minutes of real back-and-forth — don't let any round balloon
