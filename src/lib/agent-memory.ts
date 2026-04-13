export type MemoryType = "must_remember" | "must_forget" | "worked" | "failed";

export type AgentMemoryRow = {
  id: string;
  agent_id: string;
  memory_type: MemoryType;
  description: string;
  created_at: string;
};

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * Lightweight retrieval without pgvector: recency plus token overlap vs latest user text.
 */
export function rankMemoriesByRelevance(
  rows: AgentMemoryRow[],
  latestUserText: string,
  limit: number,
): AgentMemoryRow[] {
  if (rows.length === 0) return [];
  const q = tokenize(latestUserText);
  const now = Date.now();
  const scored = rows.map((r) => {
    const ageMs = Math.max(0, now - new Date(r.created_at).getTime());
    const recency = 1 / (1 + ageMs / (1000 * 60 * 60 * 24));
    const desc = tokenize(r.description);
    let overlap = 0;
    for (const w of q) {
      if (desc.has(w)) overlap += 1;
    }
    const typeBoost =
      r.memory_type === "must_remember"
        ? 0.35
        : r.memory_type === "worked"
          ? 0.2
          : r.memory_type === "failed"
            ? 0.05
            : 0;
    const score = overlap * 1.0 + recency * 0.6 + typeBoost;
    return { r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.r);
}

export function formatMemoriesForSystemPrompt(rows: AgentMemoryRow[]): string {
  if (rows.length === 0) return "";
  const lines = rows.map(
    (m) => `- [${m.memory_type}] ${m.description.replace(/\s+/g, " ").trim()}`,
  );
  return (
    "Long-term memory (from prior sessions; treat as factual context unless contradicted by the user):\n" +
    lines.join("\n")
  );
}
