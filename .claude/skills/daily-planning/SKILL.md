---
name: daily-planning
description: Morning kickoff — generate a structured daily plan based on priorities and commitments
triggers: [plan my day, what should I do today, morning kickoff, daily planning]
version: 1.1
---

# Daily Planning Skill

**Trigger:** Run this skill when James says anything like "plan my day", "what should I do today", "morning kickoff", "daily planning", or similar.

## Step 0: Lock In

Output this immediately — before any questions, before loading anything:

---

You're building a life most people never get — $10k/month, location-independent, doing whatever you want. Japan was the preview. This is how you get back there and stay there. Every day you lock in is a day closer. Let's go.

**Morning Routine — do these now:**
- [ ] Drink a full glass of water
- [ ] 10 minutes in the sun (get outside)
- [ ] No phone or social media until this list is done
- [ ] 50 push-ups
- [ ] Quick movement — stretch, shadowbox, walk around the block

---

Then proceed to Step 1.

## Step 1: Load Calendar

Read the calendar export file at `projects/ai-operating-system/dashboard/calendar-export.json`.

If the file exists:
- Parse it and filter events where `date` matches today (YYYY-MM-DD format)
- Sort by `time` field
- Use these as the hard commitments — no need to ask James what's on
- If there are events, display a brief one-liner: "I can see you have: [event list]" before generating the plan

If the file doesn't exist or is empty/unreadable:
- Ask: "Quick — anything on today? (shifts, boxing, appointments, times?)"
- And: "Anything specific you want to push forward?"
- Wait for reply before proceeding

> Note: The calendar-export.json is synced from the AI OS calendar via the "Sync to file" button. If today's events look wrong, ask James to sync the calendar first.

Even if the calendar file has today's events, always ask: **"Anything specific you want to push forward today?"** — this captures work intentions that won't be in the calendar.

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

**Habits:** Complete habits in the Operating System

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