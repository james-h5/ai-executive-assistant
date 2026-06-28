---
name: README
type: project
description: 
---

# James OS Dashboard

## Setup

1. `config.js` is already set up with your ClickUp API key.
2. Open a terminal in this folder and run:

```
python -m http.server 8000
```

3. Open [http://localhost:8000](http://localhost:8000) in Chrome or Edge.

## Tabs

| Tab | Data Source |
|---|---|
| Daily Focus | ClickUp API (live) |
| Habits | Browser localStorage |
| Goals | Hardcoded Q3 2026 goals + localStorage for progress |
| Finances | localStorage (income actuals, consulting pipeline) |
| Trading | localStorage (trade journal, P&L) |

## Updating Goals / Finances

Goals are defined in `tabs/goals.js` â†’ `GOALS_DATA`. Update quarterly.

Income streams are in `tabs/finances.js` â†’ `INCOME_STREAMS`. Actuals are editable in-dashboard and saved to localStorage.

## Resetting Data

To clear all local data: open browser DevTools â†’ Application â†’ Local Storage â†’ clear keys starting with `jamesOS_`.
