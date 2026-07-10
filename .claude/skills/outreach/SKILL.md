---
name: SKILL
type: skill
description: Draft personalized outreach messages for today's lead batch and move leads through the ClickUp pipeline via chat shortcuts
---

# Skill: Outreach

Works the ClickUp lead pipeline (list `AI Consulting Leads`, `CLICKUP_LIST_ID` in root `.env`). Two jobs:

1. **Draft today's batch** — pull leads sitting in `New Lead`, write a personalized message onto each ClickUp card, ready to copy into Gmail/Instagram.
2. **Chat-shortcut stage moves** — James can say "mark X as sent" instead of dragging the card himself.

ClickUp is the single source of truth for pipeline stage. `projects/landing-first-client/outreach-pipeline.md` is a research log only (Hit List of leads found) — don't write stage/status data back to it.

## When to use

- User says `/outreach`, "generate my leads for today", "draft today's outreach", "what leads do I have today"
- User says a stage-move phrase — see the table in Part 2

## Setup check — run this first

```powershell
$envPath = "C:\Users\james\OneDrive\AI\Executive Assistant\.env"
$env = @{}
Get-Content $envPath | Where-Object { $_ -match "^\s*[^#].*=" } | ForEach-Object {
    $parts = $_ -split "=", 2
    $env[$parts[0].Trim()] = $parts[1].Trim()
}
$clickupKey     = $env["CLICKUP_API_KEY"]
$clickupListId  = $env["CLICKUP_LIST_ID"]
$draftFieldId   = $env["CLICKUP_DRAFT_FIELD_ID"]

if (-not $clickupKey)    { Write-Host "MISSING: CLICKUP_API_KEY in .env" }
if (-not $clickupListId) { Write-Host "MISSING: CLICKUP_LIST_ID in .env" }
if (-not $draftFieldId)  { Write-Host "MISSING: CLICKUP_DRAFT_FIELD_ID in .env" }
```

Stop and tell the user what's missing if any of these are absent.

**Also confirm the list has the custom statuses set up** (one-time manual step James does in ClickUp):

```powershell
$list = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/list/$clickupListId" -Headers @{ Authorization = $clickupKey }
$list.statuses.status
```

Expected statuses: `New Lead`, `Message Ready`, `Sent`, `Follow-up 1`, `Follow-up 2`, `Interested`, `Call Booked`, `Client Won`, `Not Interested`. If the list still shows the ClickUp defaults (`to do`, `in progress`, `complete`) or is missing any of these, stop and tell James to add them first: **ClickUp → open the list → List Settings (⋯) → Statuses → add each status above**, grouped as: `New Lead` = Not Started; `Message Ready` / `Sent` / `Follow-up 1` / `Follow-up 2` / `Interested` / `Call Booked` = Active; `Client Won` = Done; `Not Interested` = Closed.

---

## Reference: ClickUp field mapping

| Concept | ClickUp field | Values |
|---|---|---|
| Pipeline stage | `status` | `New Lead`, `Message Ready`, `Sent`, `Follow-up 1`, `Follow-up 2`, `Interested`, `Call Booked`, `Client Won`, `Not Interested` |
| Warmth | `priority` | Hot=1 (Urgent), Warm=3 (Normal), Cold=4 (Low) |
| Trade | `tags` | `electrician`, `plumber`, `hvac`, `other` |
| Draft message | custom field `Draft Message` (id in `CLICKUP_DRAFT_FIELD_ID`) | plain text |
| Next follow-up nudge | `due_date` (native, Unix ms) | set on `Sent`/`Follow-up 1`, cleared on terminal/reply stages |

Contact info (phone/email/instagram/pain signal) lives in the task **description**, written at lead-gen time — read it from there, don't re-scrape.

---

## Part 1 — Draft today's batch

**Step 1 — Pull the queue.**

```powershell
$tasks = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/list/$clickupListId/task?include_closed=false" -Headers @{ Authorization = $clickupKey }
$newLeads = $tasks.tasks | Where-Object { $_.status.status -eq "New Lead" }
$newLeads.Count
```

**Step 2 — Check queue depth.** If `$newLeads.Count` is less than 5, tell James the queue is low and ask whether to run `/lead-gen` first before drafting. Don't run it automatically — it spends Firecrawl credits.

**Step 3 — Draft up to 5.** Take the first 5 (or all, if fewer). For each task:

1. Read the description for phone/email/instagram/pain signal.
2. Pick the channel: Instagram DM if a handle is present, otherwise email.
3. Pick the template from `references/examples/outreach-templates.md` that best matches the stored pain signal (mobile-only → A, after-hours → B, manual/form-only → C; email version uses D's framing).
4. Write the message yourself — you're already running inside Claude, no separate API call needed. Personalize the hook line using the specific detail already in the task (don't reuse a generic hook).
5. Push the draft to the card:

```powershell
function Set-DraftMessage($taskId, $message) {
    $body = @{ value = $message } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/task/$taskId/field/$draftFieldId" `
        -Method POST -Headers @{ Authorization = $clickupKey; "Content-Type" = "application/json" } -Body $body
}
function Set-Status($taskId, $status) {
    $body = @{ status = $status } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/task/$taskId" `
        -Method PUT -Headers @{ Authorization = $clickupKey; "Content-Type" = "application/json" } -Body $body
}
```

Set the field, then set status → `Message Ready`.

**Step 4 — Present the batch in chat.** For each lead: business name, channel, the drafted message (verbatim, ready to copy). Close with a one-line reminder: *"Once sent, drag the card to Sent or tell me 'mark [business] as sent.'"*

---

## Part 2 — Chat-shortcut stage moves

**Finding the task:** GET all open tasks in the list, match the business name (the part of the task name before the ` — `) case-insensitively against what the user said. If more than one match, ask which one. If none, say so — don't guess.

```powershell
$tasks = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/list/$clickupListId/task?include_closed=false" -Headers @{ Authorization = $clickupKey }
$match = $tasks.tasks | Where-Object { $_.name -match [regex]::Escape($businessNameGuess) }
```

**Phrase → action table:**

| User says | New status | Due date | Also draft a message? |
|---|---|---|---|
| "mark X as sent" | `Sent` | +3 days | no |
| "X didn't reply" / "move X to follow-up" | `Follow-up 1` (or `Follow-up 2` if already at `Follow-up 1`) | +4 days | yes — Follow-up template, see below |
| "X replied" / "X is interested" | `Interested` | cleared | no |
| "booked a call with X" | `Call Booked` | cleared | no |
| "X signed" / "we won X" | `Client Won` | cleared | no |
| "X said no" / "not interested" | `Not Interested` | cleared | no |
| "draft a follow-up for X" (standalone, any stage) | unchanged | unchanged | yes — draft only, don't move status |

For due-date math:

```powershell
function Set-Followup($taskId, $status, $daysFromNow) {
    $body = @{ status = $status }
    if ($null -ne $daysFromNow) {
        $body.due_date = [DateTimeOffset]::UtcNow.AddDays($daysFromNow).ToUnixTimeMilliseconds()
        $body.due_date_time = $true
    } else {
        $body.due_date = $null
    }
    Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/task/$taskId" `
        -Method PUT -Headers @{ Authorization = $clickupKey; "Content-Type" = "application/json" } -Body ($body | ConvertTo-Json)
}
```

When moving into `Follow-up 1` or `Follow-up 2` (or on a standalone "draft a follow-up for X"), write a fresh short nudge using the Follow-up 1 / Follow-up 2 template from `references/examples/outreach-templates.md` into the `Draft Message` field (same `Set-DraftMessage` function as Part 1) — don't re-send the original pitch.

After any move, confirm back to James in one line: *"[Business] → [new status]"* (plus the drafted follow-up text if one was written).

---

## Output summary

**Part 1:** Leads drafted (count), listed with channel + message. Queue depth remaining in `New Lead`.
**Part 2:** Which lead moved, to what stage, and whether a follow-up was drafted.
