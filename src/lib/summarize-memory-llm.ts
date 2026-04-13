import OpenAI from "openai";
import type { MemoryType } from "./agent-memory";

const SummarizeSchema =
  "Return ONLY valid JSON with keys: summary (string; concise bullets allowed), memory_type (must_remember or worked). " +
  "Use must_remember for durable facts, preferences, or constraints. Use worked for successful strategies or outcomes.";

export async function summarizeChatToMemory(
  messages: { role: string; content: string }[],
): Promise<{ summary: string; memory_type: MemoryType }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const openai = new OpenAI({ apiKey: key });

  const transcript = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n")
    .slice(0, 24000);

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SummarizeSchema },
      {
        role: "user",
        content:
          "Extract core facts, successful strategies, and important context from this conversation.\n\n" +
          transcript,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { summary?: string; memory_type?: string };
  const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  const mt: MemoryType = parsed.memory_type === "worked" ? "worked" : "must_remember";
  if (!summary) throw new Error("Summarizer returned empty summary");
  return { summary, memory_type: mt };
}
