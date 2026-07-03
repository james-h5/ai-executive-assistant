---
name: SKILL
type: skill
description: 
---

# Skill: Lead Generation

On-demand Brisbane trade business lead research using the Firecrawl API. Finds businesses via Firecrawl search, scrapes their websites, locates Instagram handles, checks reviews for pain signals, rates warmth, writes to `outreach-pipeline.md`, and pushes each lead to ClickUp.

## When to use
User says `/lead-gen`, "find me leads", "build a hit list", or "research [trade] businesses in [location]".

## Default target
Brisbane trade businesses (electricians, plumbers, HVAC/air conditioning). Override if the user specifies a different trade or location.

---

## Setup check — run this first

Load credentials from the EA root `.env` file using PowerShell. Stop and tell the user if anything is missing.

```powershell
$envPath = "C:\Users\james\OneDrive\AI\Executive Assistant\.env"
$env = @{}
Get-Content $envPath | Where-Object { $_ -match "^\s*[^#].*=" } | ForEach-Object {
    $parts = $_ -split "=", 2
    $env[$parts[0].Trim()] = $parts[1].Trim()
}
$firecrawlKey  = $env["FIRECRAWL_API_KEY"]
$clickupKey    = $env["CLICKUP_API_KEY"]
$clickupListId = $env["CLICKUP_LIST_ID"]

if (-not $firecrawlKey)  { Write-Host "MISSING: FIRECRAWL_API_KEY in .env" }
if (-not $clickupKey)    { Write-Host "MISSING: CLICKUP_API_KEY in .env" }
if (-not $clickupListId) { Write-Host "MISSING: CLICKUP_LIST_ID in .env" }
```

If any key is missing, stop and tell the user what to fill in before continuing.

**Also load existing pipeline domains to avoid duplicates:**

```powershell
$pipelinePath = "C:\Users\james\OneDrive\AI\Executive Assistant\projects\landing-first-client\outreach-pipeline.md"
$existingDomains = @{}
if (Test-Path $pipelinePath) {
    $pipelineContent = Get-Content $pipelinePath -Raw
    $domainMatches = [regex]::Matches($pipelineContent, '([a-zA-Z0-9-]+\.(?:com\.au|net\.au|org\.au|com|net|au))')
    foreach ($m in $domainMatches) {
        $existingDomains[$m.Groups[1].Value.ToLower()] = $true
    }
    Write-Host "Loaded $($existingDomains.Count) existing domains from pipeline — will skip these."
}
```

Skip any candidate whose domain appears in `$existingDomains`.

---

## Step 1 — Search for candidates with Firecrawl

Run these queries in sequence via the Firecrawl search API (limit 5 per query). Stop collecting once you have 25 unique candidates.

```powershell
function Search-Firecrawl($query, $apiKey) {
    $body = @{ query = $query; limit = 5 } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "https://api.firecrawl.dev/v1/search" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $apiKey"; "Content-Type" = "application/json" } `
        -Body $body
    return $resp.data
}
```

Use suburb-level queries so Firecrawl returns less prominent businesses rather than the same top-ranked results. Rotate through Brisbane suburbs:

Queries to run (limit 5 per query, stop at 25 unique candidates):
- `"electrician Ipswich Queensland local"`
- `"electrician Logan Brisbane residential"`
- `"electrician Redlands Bay Area electrician"`
- `"electrician Northside Brisbane small business"`
- `"plumber Ipswich Queensland local"`
- `"plumber Logan City small business"`
- `"plumber Redlands Queensland residential"`
- `"air conditioning Ipswich Queensland local"`
- `"air conditioning Logan small business"`
- `"HVAC Redlands Brisbane small business"`

**Skip these domains** (directories, social, franchises, already in pipeline):
`facebook.com`, `linkedin.com`, `instagram.com`, `twitter.com`, `yellowpages.com.au`, `truelocal.com.au`, `hotfrog.com.au`, `yelp.com`, `google.com`, `seek.com.au`, `indeed.com`, `airtasker.com`, `hipages.com.au`, `jims.net`

Also skip any domain in `$existingDomains` (loaded from the existing pipeline above).

Deduplicate by domain. Collect the best 15 candidates, then shortlist 10 (prefer small/local over franchises based on title and URL).

---

## Step 2 — Scrape each website with Firecrawl

For each of the 10 shortlisted businesses:

```powershell
function Scrape-Website($url, $apiKey) {
    $body = @{
        url = $url
        formats = @("markdown")
        onlyMainContent = $true
    } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "https://api.firecrawl.dev/v1/scrape" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $apiKey"; "Content-Type" = "application/json" } `
        -Body $body
    return $resp.data.markdown
}
```

From the scraped markdown, extract:
- Business name
- Phone number (Australian format)
- Email address
- Any instagram.com link in the page
- Whether they have: online booking form, contact form, live chat (flag as "has automation")

Cap content at 6000 characters before processing.

---

## Step 3 — Find Instagram handle

1. First check if the scraped website content contains an instagram.com link — use that
2. If not found, search Firecrawl: query = `"[business name] Brisbane site:instagram.com"`, limit 3
   ```powershell
   $igResults = Search-Firecrawl '"[business name] Brisbane" site:instagram.com' $firecrawlKey
   $igUrl = ($igResults | Where-Object { $_.url -match "instagram\.com/" } | Select-Object -First 1).url
   if ($igUrl -match 'instagram\.com/([^/?#]+)') { $handle = "@$($Matches[1])" }
   ```

Record as `@handle` or `none found`.

---

## Step 4 — Check for pain signals

For each business, run a Firecrawl search: `'"[business name]" Brisbane reviews'`, limit 3.

Scan the title and description snippets for:
- **Review signals**: "no response", "missed call", "never called back", "slow to reply", "couldn't get through", "didn't answer", "left a message", "no call back"
- **Structural signals** (from website scrape): mobile-only number with no contact form â†’ note as "Mobile only, no form"
- **Hours signals**: office hours listed as M–F only â†’ note as "After-hours enquiries go to voicemail"

Quote the most useful signal verbatim or note it structurally.

---

## Step 5 — Rate warmth

| Rating | Criteria |
|--------|----------|
| **Hot** | Review quote confirming slow/missed response, OR mobile-only with no form AND no 24/7 mention |
| **Warm** | Small crew, simple site, contact form but no booking, no visible automation |
| **Cold** | Large company, franchise, already has booking/chat automation, OR advertises 24/7 availability |

**Important:** Before rating a mobile-only number as Hot, check whether the scraped content contains "24/7", "24 hour", "24-hour", "around the clock", or "always available". If it does, the business is actively answering calls — downgrade to Warm. The pitch only lands where there's a genuine missed-call problem.

```powershell
$is24x7 = $content -match '24/7|24 hour|24-hour|around the clock|always available|available anytime'
```

---

## Step 6 — Write outreach-pipeline.md

Write to `projects/landing-first-client/outreach-pipeline.md`. If the file already exists, **append** new leads after any existing ones — do not overwrite.

Format:
```markdown
# Outreach Pipeline

*Last updated: [date]*

## Hit List

| # | Business | Trade | Website | Instagram | Phone | Email | Pain Signal | Warmth |
|---|----------|-------|---------|-----------|-------|-------|-------------|--------|
| 1 | [name]   | [trade] | [url] | @handle   | [phone] | [email] | [signal] | Hot |

---

## Notes
- [Pattern or observation]
- [Who to contact first and why — top 2 Hot leads]

---

## Status
| # | Business | Status | Notes |
|---|----------|--------|-------|
| 1 | [name]   | Not contacted | |
```

---

## Step 7 — Push each lead to ClickUp

For each lead, POST to ClickUp using PowerShell:

```powershell
function Push-ToClickUp($lead, $apiKey, $listId) {
    $name = "[$($lead.Warmth)] $($lead.BusinessName) — $($lead.Trade)"
    $desc = @"
Phone: $($lead.Phone)
Email: $($lead.Email)
Website: $($lead.Website)
Instagram: $($lead.Instagram)

Pain Signal: $($lead.PainSignal)

AI Pitch:
$($lead.BusinessName) likely handles new enquiries manually — every missed call or slow reply is a lost job. An AI lead response system would auto-reply within 60 seconds, qualify the lead, and notify the owner instantly, so they capture jobs even when they're on-site.
"@
    $body = @{ name = $name; description = $desc } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/list/$listId/task" `
        -Method POST `
        -Headers @{ Authorization = $apiKey; "Content-Type" = "application/json" } `
        -Body $body
}
```

If ClickUp push fails for a lead, log the error and continue — don't abort the whole run.

---

## Output summary

Tell the user:
- **Leads found:** X total (X Hot / X Warm / X Cold)
- **File written:** `projects/landing-first-client/outreach-pipeline.md`
- **ClickUp:** X tasks created (or specific errors if any failed)
- **Contact first:** top 1–2 Hot leads and why
