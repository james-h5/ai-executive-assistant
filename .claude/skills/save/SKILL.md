---
name: SKILL
type: skill
description: 
---

# Save Skill

**Trigger:** Run this skill when James says anything like "save", "I just did X", "I've done X", "log this", "mark done", "update progress", or reports completing something meaningful.

## Purpose
Keep a running record of what's been done across all active projects, so that when James asks "what's next?" the assistant already knows exactly where things stand — no re-explaining needed.

## Step 1: Identify What Was Done

Extract from James's message:
- **What was completed** — the specific action or deliverable
- **Which project it belongs to** — map to the relevant project folder:
  - Consulting offer/pitch/outreach â†’ `projects/landing-first-client/`
  - Demo, build work â†’ `projects/ai-consulting-portfolio/`
  - Lead gen automation â†’ `projects/ai-lead-generator/`
  - Assistant/AI OS â†’ `projects/ai-operating-system/`
  - Language â†’ `projects/language-learning/`
  - Communication â†’ `projects/communication-excellence/`
  - General / unclear â†’ `logs/progress.md`

If unclear, ask one short question: "Which project does that belong to?"

## Step 2: Update progress.md

Read the existing `progress.md` in the relevant project folder (or create it if it doesn't exist).

Append an entry in this format:

```
## [YYYY-MM-DD] [What was done]
- **Done:** [Specific description of what was completed]
- **Next:** [The single most logical next action — be specific]
```

The **Next** field is the most important — it must be a concrete, actionable step, not vague direction.

Use today's date: read `currentDate` from context if available, otherwise use the date from the daily log or ask.

## Step 3: Update the Daily Log

Check if a daily log exists for today at `logs/daily/YYYY-MM-DD.md`.

If it exists, add the completed item to the `Completed:` section under `## End of Day`.

If no log exists, skip this step.

## Step 4: Output

Reply with this format — keep it short:

---

**Saved:** [What was logged, one line]

**Next up:** [The concrete next action — specific enough to act on immediately]

---

No padding, no recap of what James already knows. Just confirm what was saved and what's next.

## Output Rules
- The "Next up" must be the single most important next action — not a list
- Be specific: "Draft the cold DM script for Instagram outreach" not "do outreach"
- If James has already done the "next" thing too, say so and ask what else they've done
- Keep the whole response under 6 lines
