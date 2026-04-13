import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getRouteUser } from "@/lib/supabase/route-auth";
import {
  formatMemoriesForSystemPrompt,
  rankMemoriesByRelevance,
  type AgentMemoryRow,
} from "@/lib/agent-memory";

export const runtime = "nodejs";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type Body = {
  agentId?: string;
  messages?: ChatMessage[];
  memoryLimit?: number;
};

function lastUserText(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") return messages[i].content;
  }
  return "";
}

export async function POST(request: Request) {
  const { user, supabase } = await getRouteUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!agentId || messages.length === 0) {
    return NextResponse.json({ error: "agentId and messages[] required" }, { status: 400 });
  }

  const normalized: ChatMessage[] = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "system"))
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 12000) }));

  const { data: agent, error: agentErr } = await supabase
    .from("agents")
    .select("id, name")
    .eq("id", agentId)
    .maybeSingle();

  if (agentErr || !agent?.id) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const { data: memRows, error: memErr } = await supabase
    .from("agent_memory")
    .select("id, agent_id, memory_type, description, created_at")
    .eq("agent_id", agentId)
    .in("memory_type", ["must_remember", "worked", "failed"])
    .order("created_at", { ascending: false })
    .limit(80);

  if (memErr) {
    console.error("[chat] agent_memory", memErr);
    return NextResponse.json({ error: memErr.message }, { status: 500 });
  }

  const limit = Math.min(24, Math.max(4, Number(body.memoryLimit) || 12));
  const ranked = rankMemoriesByRelevance((memRows ?? []) as AgentMemoryRow[], lastUserText(normalized), limit);
  const memoryBlock = formatMemoriesForSystemPrompt(ranked);

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const openai = new OpenAI({ apiKey: key });

  const agentName = typeof agent.name === "string" && agent.name.trim() ? agent.name.trim() : "Agent";
  const systemPreamble =
    `You are "${agentName}", an agent in "The Factory" dashboard. Be concise, actionable, and professional.\n` +
    (memoryBlock ? memoryBlock + "\n" : "");

  const outbound: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPreamble },
    ...normalized.map((m) => ({ role: m.role, content: m.content })),
  ];

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model,
      temperature: 0.6,
      messages: outbound,
    });
  } catch (e) {
    console.error("[chat] openai", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "OpenAI request failed" },
      { status: 502 },
    );
  }

  const reply = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!reply) {
    return NextResponse.json({ error: "Empty model response" }, { status: 502 });
  }

  return NextResponse.json({ reply });
}
