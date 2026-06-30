---
name: README
type: project
description: 
---

# AI Trade Lead Generator

Finds and qualifies Brisbane trade business leads (electricians, plumbers, HVAC) automatically every Monday morning. Pushes enriched leads to ClickUp with contact info, Instagram handle, pain signals, and warmth rating.

## What it does

1. **Searches** for Brisbane trade businesses using Firecrawl â€” filters out directories, franchises, and social media
2. **Scrapes** each business website for contact info
3. **Finds Instagram** handle via search + website scrape
4. **Checks reviews** for pain signals (missed calls, slow response)
5. **Rates warmth** (Hot / Warm / Cold) via Claude
6. **Pushes to ClickUp** with full enrichment + AI pitch

Runs every Monday at 8am AEST.

## Setup

### 1. Copy env template
```bash
cp .env.example .env
```

Fill in each value:
- `FIRECRAWL_API_KEY` â€” [firecrawl.dev/app/api-keys](https://firecrawl.dev/app/api-keys)
- `ANTHROPIC_API_KEY` â€” [console.anthropic.com/api-keys](https://console.anthropic.com/api-keys)
- `CLICKUP_API_TOKEN` â€” ClickUp > Settings > Apps
- `CLICKUP_LIST_ID` â€” right-click your outreach list in ClickUp > Copy link > grab ID from URL
- `TRIGGER_SECRET_KEY` â€” cloud.trigger.dev > your project > API keys

### 2. Install dependencies
```bash
cd "projects/ai-lead-generator"
npm install
```

### 3. Update trigger.config.ts (if using a new project)
If you created a new trigger.dev project, update the `project` field in `trigger.config.ts` with your new project ID.

If reusing the existing project (`proj_omtdpuzktsfskxspmnos`), no change needed.

### 4. Add env vars to trigger.dev dashboard
Go to cloud.trigger.dev > your project > Environment Variables.
Add every key from your `.env` to BOTH staging and prod environments.
This is the #1 cause of production failures.

### 5. Test locally
```bash
npm run dev
```
Then use `mcp__trigger__trigger_task` to fire a test run.

### 6. Deploy
After confirming it works locally:
```bash
npm run deploy
```

## Files

```
src/trigger/trade-leads/
  find-leads.ts     â€” scheduled search (Monday 8am AEST)
  process-lead.ts   â€” scrape + extract + ClickUp push per business
```

## Adapting search targets

Edit `SEARCH_QUERIES` in `find-leads.ts` to change the industries or locations.
