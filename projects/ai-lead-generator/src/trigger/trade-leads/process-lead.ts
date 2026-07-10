import { task } from "@trigger.dev/sdk";
import Anthropic from "@anthropic-ai/sdk";

interface LeadInfo {
  businessName: string;
  trade: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  instagramHandle: string;
  painSignal: string;
  warmth: "Hot" | "Warm" | "Cold";
  aiPitch: string;
}

export const processLead = task({
  id: "process-trade-lead",
  retry: { maxAttempts: 2 },

  run: async (payload: { url: string; title: string }) => {
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const clickupApiKey = process.env.CLICKUP_API_KEY;
    const clickupListId = process.env.CLICKUP_LIST_ID;

    if (!firecrawlApiKey) throw new Error("FIRECRAWL_API_KEY is not set");
    if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    if (!clickupApiKey) throw new Error("CLICKUP_API_KEY is not set");
    if (!clickupListId) throw new Error("CLICKUP_LIST_ID is not set");

    // 1. Scrape the business website
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: payload.url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    let websiteContent = "";
    if (scrapeResponse.ok) {
      const scrapeData = (await scrapeResponse.json()) as {
        data: { markdown: string };
      };
      websiteContent = scrapeData.data?.markdown ?? "";
    } else {
      console.warn(`Scrape failed for ${payload.url}:`, scrapeResponse.status);
    }

    if (websiteContent.length > 6000) {
      websiteContent = websiteContent.slice(0, 6000);
    }

    // 2. Search for Instagram handle
    const igQuery = `${payload.title} Brisbane site:instagram.com`;
    const igResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: igQuery, limit: 3 }),
    });

    let instagramHint = "none found";
    if (igResponse.ok) {
      const igData = (await igResponse.json()) as {
        data: Array<{ url: string }>;
      };
      const igResult = igData.data?.find((r) =>
        r.url.includes("instagram.com/")
      );
      if (igResult) {
        const match = igResult.url.match(/instagram\.com\/([^/?#]+)/);
        instagramHint = match ? `@${match[1]}` : igResult.url;
      }
    }

    // Also check website content for Instagram links
    if (instagramHint === "none found") {
      const igFromSite = websiteContent.match(/instagram\.com\/([^/?#\s"']+)/);
      if (igFromSite) instagramHint = `@${igFromSite[1]}`;
    }

    // 3. Check Google reviews for pain signals
    const reviewQuery = `"${payload.title}" Brisbane reviews no response missed call`;
    const reviewResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: reviewQuery, limit: 3 }),
    });

    let reviewSnippets = "";
    if (reviewResponse.ok) {
      const reviewData = (await reviewResponse.json()) as {
        data: Array<{ title: string; description?: string }>;
      };
      reviewSnippets = (reviewData.data ?? [])
        .map((r) => `${r.title}: ${r.description ?? ""}`)
        .join("\n")
        .slice(0, 2000);
    }

    // 4. Extract contact info, pain signal, warmth + generate pitch via Claude
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `You are helping an AI consultant qualify leads for an AI Lead Response + Follow-Up System targeting small Brisbane trade businesses (electricians, plumbers, HVAC).

Website URL: ${payload.url}
Page title: ${payload.title}
Website content:
${websiteContent || "(No content scraped — use URL and title to infer)"}

Instagram found: ${instagramHint}

Review snippets:
${reviewSnippets || "(No review data found)"}

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "businessName": "the business name",
  "trade": "Electrician | Plumber | HVAC | Other",
  "contactName": "owner or manager name if visible, otherwise empty string",
  "email": "email if found, otherwise empty string",
  "phone": "Australian phone number if found, otherwise empty string",
  "website": "${payload.url}",
  "instagramHandle": "${instagramHint}",
  "painSignal": "Specific evidence of slow/missed response (review quote or structural note like 'mobile only, no contact form'). If none found write 'none detected'.",
  "warmth": "Hot if reviews show slow/missed response OR if they have only a mobile number with no form; Warm if small crew, simple site, no visible automation; Cold if looks like a large company, franchise, or already automated",
  "aiPitch": "2-3 sentences specific to this business explaining how an AI lead response system would help them — mention the 60-second auto-reply, lead qualification, and owner notification. Be concrete."
}`,
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const jsonStr = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let lead: LeadInfo;
    try {
      lead = JSON.parse(jsonStr) as LeadInfo;
    } catch {
      console.error("Claude returned invalid JSON:", rawText);
      throw new Error("Failed to parse lead info from Claude");
    }

    // 5. Push to ClickUp
    // Status/priority/tags match the shape the `outreach` skill and lead-gen skill expect —
    // see .claude/skills/outreach/SKILL.md for the full field mapping.
    const description = [
      `📞 Phone: ${lead.phone || "Not found"}`,
      `📧 Email: ${lead.email || "Not found"}`,
      `👤 Contact: ${lead.contactName || "Not found"}`,
      `🌐 Website: ${lead.website}`,
      `📸 Instagram: ${lead.instagramHandle}`,
      ``,
      `🔥 Pain Signal: ${lead.painSignal}`,
      `🌡️ Warmth: ${lead.warmth}`,
      ``,
      `💡 AI Pitch:`,
      lead.aiPitch,
    ].join("\n");

    const priorityByWarmth: Record<LeadInfo["warmth"], number> = {
      Hot: 1,
      Warm: 3,
      Cold: 4,
    };

    const clickupResponse = await fetch(
      `https://api.clickup.com/api/v2/list/${clickupListId}/task`,
      {
        method: "POST",
        headers: {
          Authorization: clickupApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${lead.businessName} — ${lead.trade}`,
          description,
          status: "New Lead",
          priority: priorityByWarmth[lead.warmth],
          tags: [lead.trade.toLowerCase()],
        }),
      }
    );

    if (!clickupResponse.ok) {
      const error = await clickupResponse.text();
      throw new Error(`ClickUp API error (${clickupResponse.status}): ${error}`);
    }

    console.log(`Created ClickUp task for: ${lead.businessName} (${lead.warmth})`);
    return { businessName: lead.businessName, warmth: lead.warmth };
  },
});
