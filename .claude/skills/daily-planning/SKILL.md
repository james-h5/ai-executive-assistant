---
name: daily-planning
description: Morning kickoff — generate a structured daily plan based on priorities and commitments
triggers: [plan my day, what should I do today, morning kickoff, daily planning]
version: 1.0
---

# Daily Planning Skill

**Trigger:** Run this skill when James says anything like "plan my day", "what should I do today", "morning kickoff", "daily planning", or similar.

## Step 1: Check-In
Ask both of these questions in a single message:

1. **What's on today?** Any hard commitments? (bartending shift, boxing training, uni, appointments — and what time)
2. **Anything specific you want to push forward today** that's not already in the system?

Wait for James's reply before generating the plan.

## Step 2: Load Context
Before generating the plan, read:
- `@context/current-priorities.md`
- `@context/goals.md`

If ClickUp MCP is available, check for any tasks due or scheduled for today.

Check `logs/daily/` for the most recent daily log file — if one exists, pull any incomplete items as rollovers.

## Step 3: Generate the Plan
Output the plan in this exact format:

---

### Today's Plan — [Weekday, DD Month YYYY]

**Main Focus:** [ONE thing — the single highest-leverage move toward the #1 goal today]

**Blocks:**
- Morning: [specific task with enough detail to act on immediately]
- Afternoon: [specific task with enough detail to act on immediately]
- Evening: [specific task — or if shift/training, note it: "Bartending shift" / "Boxing training"]

**Quick Win:** [One thing achievable in under 30 minutes — done first to build momentum]

**Don't Drop:** [One small nudge toward a long-term goal that isn't urgent today but shouldn't go cold]

**Rollover from yesterday:** [Incomplete tasks from the previous daily log — skip this section if no prior log exists]

*Today builds toward: [one sentence connecting this day to the bigger vision — location-independent income, travel, financial freedom]*

---

Then ask: "Want me to save this as today's log?"
If yes, save the plan to `logs/daily/YYYY-MM-DD.md`.

## Output Rules
- Always plan for a full, productive day — no scaling back
- Casual and direct tone — no padding
- Tasks must be specific: "Spend 90 mins building the client intake form in Notion" not "work on consulting stuff"
- Always 3 blocks — forces prioritisation, maximises the day
- If a hard commitment fills the evening block, note it and pack the remaining blocks harder
- Anything not completed today rolls over automatically to the next day's plan
- Keep the whole output tight — James doesn't need essays, he needs a clear direction
