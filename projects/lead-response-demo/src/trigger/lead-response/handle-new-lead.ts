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
  trade: string;
  serviceArea: string;
  monitoredPhone: string;
  tone: { style: string; sampleMessage: string };
  qualifyingQuestions: string[];
  urgentBypassKeywords: string[];
  notificationPrefs: {
    channel: string;
    quietHoursStart: string;
    quietHoursEnd: string;
    note: string;
  };
  faqs: { question: string; answer: string }[];
}

interface Customer {
  name: string;
  phone: string;
  notes: string;
}

const businessProfile: BusinessProfile = JSON.parse(
  readFileSync(join(dataDir, "business-profile.json"), "utf-8")
);
const customers: Customer[] = JSON.parse(
  readFileSync(join(dataDir, "customers.json"), "utf-8")
);

interface NewEnquiryPayload {
  customerName: string;
  phone: string;
  message: string;
  channel: "SMS" | "Missed Call" | "Web Form" | "Instagram DM";
}

interface HandleNewLeadResult {
  matchedExistingCustomer: boolean;
  matchedCustomerName: string | null;
  urgent: boolean;
  customerFacingReply: string | null;
  ownerNotification: string;
  notificationHeldUntilQuietHoursEnd: boolean;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-9);
}

function findCustomer(phone: string): Customer | null {
  const normalized = normalizePhone(phone);
  return (
    customers.find((c) => normalizePhone(c.phone) === normalized) ?? null
  );
}

function isUrgent(message: string): boolean {
  const lower = message.toLowerCase();
  return businessProfile.urgentBypassKeywords.some((kw) =>
    lower.includes(kw.toLowerCase())
  );
}

function isWithinQuietHours(): boolean {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
  const { quietHoursStart, quietHoursEnd } = businessProfile.notificationPrefs;
  return hhmm >= quietHoursStart && hhmm < quietHoursEnd;
}

export const handleNewLead = task({
  id: "handle-new-lead",
  retry: { maxAttempts: 2 },

  run: async (payload: NewEnquiryPayload): Promise<HandleNewLeadResult> => {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not set");

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });
    const matchedCustomer = findCustomer(payload.phone);
    const urgent = isUrgent(payload.message);

    let prompt: string;

    if (matchedCustomer) {
      // Existing customer: no qualifying questions, owner-notification only.
      prompt = `You are drafting a short SMS notification for ${businessProfile.ownerName}, owner of ${businessProfile.businessName} (${businessProfile.trade}).

A known/existing customer just got in touch. Do NOT draft any reply to the customer — regulars skip the qualifying-questions flow entirely, per business rules.

Customer: ${matchedCustomer.name} (existing customer — notes: ${matchedCustomer.notes})
Channel: ${payload.channel}
Message: "${payload.message}"
${urgent ? "This message matches an URGENT/gas-safety bypass keyword — flag it clearly as urgent." : ""}

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "ownerNotification": "short SMS-style notification, e.g. '${matchedCustomer.name} texted - existing customer, wants to book a job. Check details.'"
}`;
    } else {
      // New contact: draft both a customer-facing qualifying reply and an owner notification.
      prompt = `You are drafting SMS messages for ${businessProfile.ownerName}, owner of ${businessProfile.businessName} (${businessProfile.trade}), servicing ${businessProfile.serviceArea}.

Business tone/voice: ${businessProfile.tone.style}
Sample of how the owner actually texts: "${businessProfile.tone.sampleMessage}"

A NEW contact (not an existing customer) just got in touch. ${
        urgent
          ? "This message matches an URGENT/gas-safety bypass keyword (gas leak / smell gas / urgent no hot water) - do NOT ask the normal qualifying questions. Instead, acknowledge urgency and say the owner will call right away."
          : `Draft a reply that sounds like the owner (not a corporate chatbot) and asks for whichever of these qualifying details aren't already in their message: ${businessProfile.qualifyingQuestions.join(
              ", "
            )}.`
      }

Customer name: ${payload.customerName}
Channel: ${payload.channel}
Message: "${payload.message}"

If relevant, these FAQs can inform the reply (only mention if directly relevant, don't force it):
${businessProfile.faqs.map((f) => `- ${f.question} ${f.answer}`).join("\n")}

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "customerFacingReply": "the SMS reply to send the customer, in the owner's voice",
  "ownerNotification": "short SMS-style notification to the owner summarizing who this is and what they want"
}`;
    }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const jsonStr = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let parsed: { customerFacingReply?: string; ownerNotification: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Claude returned invalid JSON:", rawText);
      throw new Error("Failed to parse lead response from Claude");
    }

    const result: HandleNewLeadResult = {
      matchedExistingCustomer: Boolean(matchedCustomer),
      matchedCustomerName: matchedCustomer?.name ?? null,
      urgent,
      customerFacingReply: parsed.customerFacingReply ?? null,
      ownerNotification: parsed.ownerNotification,
      notificationHeldUntilQuietHoursEnd: !urgent && isWithinQuietHours(),
    };

    // Dashboard-only demo: nothing is actually sent anywhere. This log + the
    // task's return value are the entire "delivery" — visible in the
    // trigger.dev dashboard's Output/Logs tabs when triggered via
    // mcp__trigger__trigger_task.
    console.log("--- Would send to customer ---");
    console.log(result.customerFacingReply ?? "(none - existing customer, skipped)");
    console.log("--- Would notify owner ---");
    console.log(
      result.notificationHeldUntilQuietHoursEnd
        ? `[held until ${businessProfile.notificationPrefs.quietHoursEnd}] ${result.ownerNotification}`
        : result.ownerNotification
    );

    return result;
  },
});
