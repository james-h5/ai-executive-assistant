---
name: SKILL
type: skill
description: 
---

# Skill: Lead Generation

On-demand Brisbane trade business lead research. Finds businesses, scrapes contact info, locates Instagram handles, checks reviews for pain signals, rates warmth, writes to `outreach-pipeline.md`, and pushes each lead to ClickUp.

## When to use
User says `/lead-gen`, "find me leads", "build a hit list", or "research [trade] businesses in [location]".

## Default target
Brisbane trade businesses (electricians, plumbers, HVAC/air conditioning). Override if the user specifies a different trade or location.

---

## Steps

### 1. Search for candidates

Use WebSearch with these queries (adjust trade/location if overridden):
- `"electrician Brisbane" -site:yellowpages.com.au -site:truelocal.com.au -site:facebook.com`
- `"plumber Brisbane" -site:yellowpages.com.au -site:truelocal.com.au -site:facebook.com`
- `"air conditioning Brisbane" -site:yellowpages.com.au -site:truelocal.com.au -site:facebook.com`
- `"HVAC Brisbane Queensland" -site:yellowpages.com.au -site:truelocal.com.au`

Run all searches in parallel. Filter results against this skip list:
- **Skip**: yellowpages.com.au, truelocal.com.au, hotfrog.com.au, yelp.com, facebook.com, linkedin.com, instagram.com, airtasker.com, hipages.com.au, seek.com.au, jims.net

Collect ~15 candidates, shortlist the best 10 (prefer small/local over large franchises).

### 2. Scrape each website

Use WebFetch on each business homepage. Extract:
- Business name
- Phone number (Australian format)
- Email address
- Whether they have: online booking, contact form, live chat (note as "has automation" if yes)

Run in batches of 3 in parallel.

### 3. Find Instagram handle

For each business:
1. Check the scraped website content for an instagram.com link
2. If not found, run WebSearch: `"[business name] Brisbane" site:instagram.com`

Record handle as `@handle` or `none found`.

### 4. Check for pain signals

For each business, run WebSearch: `"[business name]" Brisbane reviews`

Scan snippets for:
- **Review signals**: "no response", "missed call", "never called back", "slow to reply", "couldn't get through", "didn't answer", "left a message"
- **Structural signals** (from website scrape): mobile-only contact number, no contact form, no online booking â†’ note as "Mobile only, no form â€” likely manual"

Record the most useful signal as a short quote or structural note.

### 5. Rate warmth

| Rating | Criteria |
|--------|----------|
| **Hot** | Review mentions slow/missed response OR mobile-only + no form, AND active Instagram |
| **Warm** | Small crew, simple website, no visible automation |
| **Cold** | Large company, franchise signals, already automated |

### 6. Build the table

Compile all data into a markdown table. Aim for 10 leads.

### 7. Write outreach-pipeline.md

Write to `projects/landing-first-client/outreach-pipeline.md`. If the file already exists, append new leads â€” do not overwrite existing ones.

Format:
```markdown
# Outreach Pipeline

*Last updated: [date]*

## Hit List

| # | Business | Trade | Website | Instagram | Phone | Email | Pain Signal | Warmth |
|---|----------|-------|---------|-----------|-------|-------|-------------|--------|
| 1 | [name] | [trade] | [url] | @handle | [phone] | [email] | [signal] | Hot |
...

## Notes
- [Pattern or observation across the list]
- [Who to contact first and why]
```

### 8. Push each lead to ClickUp

Use Bash to POST each lead to ClickUp. Read `CLICKUP_API_TOKEN` and `CLICKUP_LIST_ID` from the `.env` file in `projects/ai-lead-generator/` (if it exists).

```bash
curl -s -X POST "https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task" \
  -H "Authorization: ${CLICKUP_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "[Warmth] BusinessName â€” Trade",
    "description": "Phone: ...\nEmail: ...\nWebsite: ...\nInstagram: ...\n\nPain Signal: ...\n\nAI Pitch: ..."
  }'
```

If the `.env` doesn't exist or credentials are missing, write the pipeline.md and tell the user to set up credentials before ClickUp push can run.

---

## AI pitch template (per lead)

When writing the ClickUp description, include a 2-3 sentence pitch:

> "[Business name] likely handles new enquiries manually â€” every missed call or slow reply is a lost job. An AI lead response system would auto-reply within 60 seconds, qualify the lead, and notify [owner] instantly, so they capture jobs even when they're on-site."

Adapt to the specific business based on what you scraped.

---

## Output summary

After completing, tell the user:
- How many leads found and their breakdown (Hot / Warm / Cold)
- File written: `projects/landing-first-client/outreach-pipeline.md`
- ClickUp: X tasks created (or: "Set up .env credentials to enable ClickUp push")
- Who to contact first and why (top 1-2 Hot leads)
