import Anthropic from "@anthropic-ai/sdk";
import type { VideoSummary } from "../db/schema";

const client = new Anthropic();

const SYSTEM_PROMPT = `You extract the key knowledge from Theo Browne's (@t3dotgg) YouTube videos so developers can learn without watching.
You must respond with valid JSON only — no markdown, no prose, no code fences.
The JSON must match this exact shape:
{
  "oneLiner": "Theo's main take or opinion from the video.",
  "keyTakeaways": [
    { "text": "A concrete, opinionated takeaway." }
  ],
  "categories": ["category1", "category2"]
}
Rules:
- oneLiner: max 120 characters. Capture Theo's opinion or stance, not a neutral description. Write it as a standalone take.
- keyTakeaways: 3–5 items. Focus on what Theo thinks, recommends, or discovered. Be specific — name the tools, libraries, patterns, or ideas he discusses. Each item should transmit one piece of actionable knowledge. No timestamps.
- categories: 1–4 tags from the provided list when applicable; create new ones only if none fit`;

export async function summarizeTranscript(
  transcript: string,
  existingCategories: string[]
): Promise<VideoSummary> {
  const categoriesHint =
    existingCategories.length > 0
      ? `Existing categories (reuse when appropriate): ${existingCategories.join(", ")}.`
      : "No existing categories yet — create appropriate ones.";

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${categoriesHint}\n\nTranscript:\n${transcript}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = JSON.parse(text) as VideoSummary;
  return parsed;
}
