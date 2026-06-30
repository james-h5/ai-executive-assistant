---
name: daily-planning
description: Morning kickoff — generate a structured daily plan based on priorities and commitments
triggers: [plan my day, what should I do today, morning kickoff, daily planning]
version: 1.1
---

# Daily Planning Skill

**Trigger:** Run this skill when James says anything like "plan my day", "what should I do today", "morning kickoff", "daily planning", or similar.

## Step 1: Check-In
Ask both of these questions in a single message:

1. **What's on today?** Any hard commitments? (bartending shift, boxing training, uni, appointments — and what time)
2. **Anything specific you want to push forward today** that's not already in the system?

Wait for James's reply before generating the plan.

## Step 2: Load Context and Run Diagnostic

Before generating the plan, read all of the following:
- `context/current-priorities.md`
- `context/goals.md`
- `context/work.md`
- `context/me.md`

If ClickUp MCP is available, check for any tasks due or scheduled for today.

Check `logs/daily/` for the most recent daily log file — if one exists, pull any incomplete items as rollovers, and note patterns of what's been worked on vs avoided.

**Then run this diagnostic internally — do not output it:**

Against the top goal ($10k/month location-independent income), ask:
- What is the single biggest bottleneck right now?
- Is James working on the bottleneck, or working around it?
- What is being avoided that matters most?
- What feels productive but isn't moving the needle?

Hold the answer as the diagnostic result. It drives Step 3 — specifically the Main Focus and task blocks. Do not surface the full diagnosis in the plan output.

## Step 3: Generate the Plan

Output the plan in this exact format:

---

### Today's Plan — [Weekday, DD Month YYYY]

**Main Focus:** [ONE thing — derived from the bottleneck identified in the diagnostic, not just whatever feels urgent. The single highest-leverage move toward removing the current constraint.]

**Strategic context:** [One sentence — why this focus matters today, naming the bottleneck plainly. E.g. "The constraint right now is X, so everything else waits."]

**Blocks:**
- Morning: [specific task with enough detail to act on immediately]
- Afternoon: [specific task with enough detail to act on immediately]
- Evening: [specific task — or if shift/training, note it: "Bartending shift" / "Boxing training"]

**Quick Win:** [One thing achievable in under 30 minutes — done first to build momentum]

**Don't Drop:** [One small nudge toward a long-term goal that isn't urgent today but shouldn't go cold]

**Rollover from yesterday:** [Incomplete tasks from the previous daily log — skip this section if no prior log exists]

**Daily Skills:**
- Language practice — `/learn-language`
- Communication coaching — `/comm-coach`

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
- Main Focus must come from the diagnostic bottleneck — if the bottleneck is getting the first client, the Main Focus is a client acquisition action, not a build task
- Strategic context is one sentence only — name the bottleneck, don't explain it at length