import { NextResponse } from "next/server";
import { getRouteUser } from "@/lib/supabase/route-auth";
import { summarizeChatToMemory } from "@/lib/summarize-memory-llm";

export const runtime = "nodejs";

type Body = {
  messages?: { role: string; content: string }[];
};

export async function POST(request: Request, ctx: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await ctx.params;
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

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const normalized = messages
    .filter((m) => m && typeof m.content === "string" && typeof m.role === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 12000) }));

  if (normalized.length === 0) {
    return NextResponse.json({ error: "messages[] required" }, { status: 400 });
  }

  const { data: agent, error: agentErr } = await supabase
    .from("agents")
    .select("id")
    .eq("id", agentId)
    .maybeSingle();

  if (agentErr || !agent?.id) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  let summaryPack: Awaited<ReturnType<typeof summarizeChatToMemory>>;
  try {
    summaryPack = await summarizeChatToMemory(normalized);
  } catch (e) {
    console.error("[memory/summarize] llm", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Summarization failed" },
      { status: 502 },
    );
  }

  const { data: inserted, error: insErr } = await supabase
    .from("agent_memory")
    .insert({
      agent_id: agentId,
      memory_type: summaryPack.memory_type,
      description: summaryPack.summary,
    })
    .select("id, memory_type, description, created_at")
    .single();

  if (insErr) {
    console.error("[memory/summarize] insert", insErr);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, row: inserted });
}
