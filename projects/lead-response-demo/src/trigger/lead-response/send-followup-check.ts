import { task } from "@trigger.dev/sdk";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "..", "data");

interface BusinessProfile {
  businessName: string;
  ownerName: string;
  tone: { style: string; sampleMessage: string };
}

const businessProfile: BusinessProfile = JSON.parse(
  readFileSync(join(dataDir, "business-profile.json"), "utf-8")
);

interface FollowupCheckPayload {
  customerName: string;
  phone: string;
  originalMessage: string;
  // In production this fires automatically ~24h after the initial reply if the
  // customer hasn't responded. A real 24h wait isn't practical to demo live, so
  // this is a manually-triggerable stand-in: pass whichever scenario you want to see.
  repliedWithin24h: boolean;
}

interface FollowupCheckResult {
  followUpSent: boolean; // always false — dashboard-only, describes what WOULD be sent
  followUpMessage: string | null;
}

export const sendFollowupCheck = task({
  id: "send-followup-check",
  retry: { maxAttempts: 2 },

  run: async (payload: FollowupCheckPayload): Promise<FollowupCheckResult> => {
    if (payload.repliedWithin24h) {
      console.log(
        `${payload.customerName} already replied within 24h — no follow-up needed.`
      );
      return { followUpSent: false, followUpMessage: null };
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not set");

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const prompt = `You are drafting a short, friendly SMS follow-up for ${businessProfile.ownerName}, owner of ${businessProfile.businessName}.

Business tone/voice: ${businessProfile.tone.style}
Sample of how the owner actually texts: "${businessProfile.tone.sampleMessage}"

A customer enquired 24 hours ago and hasn't replied since the initial auto-reply. Draft a brief,
low-pressure nudge checking if they still need the job done — in the owner's voice, not a
corporate chatbot.

Customer name: ${payload.customerName}
Original message: "${payload.originalMessage}"

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "followUpMessage": "the SMS follow-up to send"
}`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const jsonStr = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let parsed: { followUpMessage: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Claude returned invalid JSON:", rawText);
      throw new Error("Failed to parse follow-up message from Claude");
    }

    // Dashboard-only demo: nothing is actually sent. This log + the return value
    // are the entire "delivery" — visible in the trigger.dev dashboard.
    console.log("--- Would send follow-up ---");
    console.log(parsed.followUpMessage);

    return { followUpSent: false, followUpMessage: parsed.followUpMessage };
  },
});
