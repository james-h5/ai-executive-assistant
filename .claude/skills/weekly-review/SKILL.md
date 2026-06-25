---
name: weekly-review
description: End-of-week reflection and reset — review what happened, clear the decks, and set up next week
triggers: [weekly review, end of week, week review, reset for next week]
version: 1.0
---

# Weekly Review Skill

**Trigger:** Run this skill when James says anything like "weekly review", "end of week", "week review", "reset for next week", or similar.

## Step 1: Check-In
Ask these questions in a single message:

1. **How did the week feel overall?** (1–2 sentences — gut reaction, not a report)
2. **Anything that didn't get done that was supposed to?**
3. **Anything unexpected that happened — good or bad?**

Wait for James's reply before generating the review.

## Step 2: Load Context
Before generating the review, read:
- `context/current-priorities.md`
- `context/goals.md`

Check `logs/daily/` for any daily logs from the past 7 days — pull key wins, incomplete tasks, and patterns.

If ClickUp MCP is available, check for tasks completed this week and anything overdue.

## Step 3: Generate the Review
Output in this exact format:

---

### Weekly Review — Week of [DD Month YYYY]

**The Week in One Line:** [One honest sentence — was it a good week or not, and why]

**Wins:**
- [Specific thing completed or moved forward — be concrete]
- [Second win]
- [Third win — if only 1-2 real wins, list them and leave it at that; don't pad]

**Didn't Happen:**
- [Task or intention that got dropped — no judgment, just facts]
- [Another if applicable — skip section if nothing slipped]

**What Got in the Way:** [One honest line about the main blocker or distraction this week — pattern-level, not excuses]

**Key Insight:** [One thing learned or confirmed this week — about the work, about yourself, about what's working]

---

**Next Week Setup:**

**Main Focus:** [ONE thing — the single highest-leverage move toward the #1 goal next week]

**3 Things That Must Happen:**
1. [Specific, actionable — not a category, a real task]
2. [Specific, actionable]
3. [Specific, actionable]

**Drop or Defer:** [Anything on the radar that should be deprioritised or pushed — clears mental load]

*Next week builds toward: [one sentence connecting next week to the bigger vision — location-independent income, travel, financial freedom]*

---

Then ask: "Want me to save this as this week's review log?"
If yes, save to `logs/weekly/YYYY-WXX.md` (ISO week number format, e.g. `2026-W26.md`).

## Output Rules
- Honest over polished — a review that lies to make James feel better is useless
- Wins must be real and specific — "worked on consulting stuff" doesn't count
- The "3 Things" for next week are commitments, not wishes — pick things that will actually happen
- Keep it tight — the whole review should fit in one screen
- Casual and direct tone throughout
- If the week was bad, say so plainly and focus energy on next week's setup
- Don't moralize or coach — state facts and move forward
