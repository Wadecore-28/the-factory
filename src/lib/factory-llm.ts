/** Client-safe: only NEXT_PUBLIC_* env vars. */
export function isEugeneLlmConfigured(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_LLM_CHAT === "1" &&
    Boolean(process.env.NEXT_PUBLIC_EUGENE_AGENT_UUID?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
  );
}

export function getEugeneAgentUuid(): string | null {
  const v = process.env.NEXT_PUBLIC_EUGENE_AGENT_UUID?.trim();
  return v || null;
}
