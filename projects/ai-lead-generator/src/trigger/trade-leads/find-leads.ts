import { schedules } from "@trigger.dev/sdk";
import { processLead } from "./process-lead.js";

const SEARCH_QUERIES = [
  "electrician Brisbane small business",
  "electrician Brisbane residential local",
  "electrician Brisbane sole trader Queensland",
  "plumber Brisbane small business",
  "plumber Brisbane residential local",
  "plumber Brisbane sole trader Queensland",
  "air conditioning Brisbane small business",
  "HVAC Brisbane Queensland small business",
  "air conditioning installation Brisbane local",
  "refrigeration mechanic Brisbane Queensland",
];

const SKIP_DOMAINS = [
  "facebook.com", "linkedin.com", "instagram.com", "twitter.com",
  "yellowpages.com.au", "truelocal.com.au", "hotfrog.com.au",
  "yelp.com", "google.com", "seek.com.au", "indeed.com",
  "airtasker.com", "hipages.com.au", "serviceseeking.com.au",
  "jims.net", "whereis.com", "white-pages.com.au",
];

export const findLeads = schedules.task({
  id: "find-trade-leads",
  // Monday 8am AEST (Brisbane, UTC+10) = Sunday 10pm UTC
  cron: "0 22 * * 0",

  run: async () => {
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) throw new Error("FIRECRAWL_API_KEY is not set");

    const leads: Array<{ url: string; title: string }> = [];
    const seenDomains = new Set<string>();

    for (const query of SEARCH_QUERIES) {
      if (leads.length >= 25) break;

      const response = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, limit: 5 }),
      });

      if (!response.ok) {
        console.error(`Search failed for "${query}":`, response.status);
        continue;
      }

      const data = (await response.json()) as {
        data: Array<{ url: string; title: string }>;
      };

      for (const result of data.data ?? []) {
        if (leads.length >= 25) break;

        let domain: string;
        try {
          domain = new URL(result.url).hostname.replace("www.", "");
        } catch {
          continue;
        }

        if (seenDomains.has(domain)) continue;
        if (SKIP_DOMAINS.some((skip) => domain.includes(skip))) continue;

        seenDomains.add(domain);
        leads.push({ url: result.url, title: result.title });
      }
    }

    console.log(`Found ${leads.length} trade businesses — dispatching jobs`);

    for (const lead of leads) {
      const domain = new URL(lead.url).hostname.replace("www.", "");
      await processLead.trigger(
        { url: lead.url, title: lead.title },
        { idempotencyKey: `trade-lead-${domain}-${new Date().toISOString().slice(0, 10)}` }
      );
    }

    return { dispatched: leads.length };
  },
});
