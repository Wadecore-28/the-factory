"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getEugeneAgentUuid, isEugeneLlmConfigured } from "@/lib/factory-llm";

const STORAGE_KEY = "the-factory-agents-v1";

export type AgentId = "eugene" | "alpha" | "bravo" | "charlie";

export type AgentSnapshot = {
  activity: "idle" | "working";
  zone: "lounge" | "station";
  currentTask: string;
  xp: number;
  memories: string[];
  skills: string[];
};

export type EugeneChatTurn = {
  id: string;
  role: "user" | "eugene" | "system";
  text: string;
  at: number;
};

export type GatewayBinder = {
  rpc: (method: string, params: Record<string, unknown>) => Promise<unknown>;
  methods: Set<string>;
  methodsStrict: boolean;
};

type FactoryAgentsContextValue = {
  agents: Record<AgentId, AgentSnapshot>;
  eugeneChat: EugeneChatTurn[];
  selectedSessionKey: string;
  setSelectedSessionKey: (k: string) => void;
  sendToEugene: (text: string, options: { mirrorToGateway: boolean }) => Promise<void>;
  /** Summarize recent Eugene chat via LLM and store in Supabase `agent_memory` (requires auth + env). */
  archiveEugeneLongTermMemory: () => Promise<{ ok: boolean; error?: string }>;
  /** True when NEXT_PUBLIC_* env is set for Supabase + Eugene agent UUID + LLM flag. */
  eugeneLlmConfigured: boolean;
  setAgentZone: (id: AgentId, zone: AgentSnapshot["zone"]) => void;
  setAgentActivity: (id: AgentId, activity: AgentSnapshot["activity"]) => void;
  allToLounge: () => void;
  allToStations: () => void;
  markTaskDone: (id: AgentId) => void;
  resetProgress: () => void;
  bindGateway: (binder: GatewayBinder | null) => void;
  ingestGatewayFrame: (msg: unknown) => void;
  lastGatewayMirror: string | null;
  addSkill: (id: AgentId, skill: string) => void;
  removeSkill: (id: AgentId, skill: string) => void;
};

function defaultAgent(task: string, skills: string[]): AgentSnapshot {
  return {
    activity: "idle",
    zone: "station",
    currentTask: task,
    xp: 0,
    memories: [],
    skills: [...skills],
  };
}

const DEFAULT_AGENTS: Record<AgentId, AgentSnapshot> = {
  eugene: defaultAgent("Koordinering & delegation", [
    "Delegation",
    "Gateway sync",
    "Session routing",
  ]),
  alpha: defaultAgent("Research", ["Research synthesis", "Angle mining", "Competitor scan"]),
  bravo: defaultAgent("Build", ["Node.js", "Scripting", "Next.js UI"]),
  charlie: defaultAgent("Verify", ["QA review", "Build/lint check", "Risk pass"]),
};

function uid() {
  return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

function capMemories(list: string[], max = 40) {
  return list.slice(-max);
}

function loadPersisted(): Record<AgentId, AgentSnapshot> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as { agents?: Record<string, unknown> };
    if (!j.agents || typeof j.agents !== "object") return null;
    const out = { ...DEFAULT_AGENTS };
    for (const id of Object.keys(DEFAULT_AGENTS) as AgentId[]) {
      const row = j.agents[id];
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      out[id] = {
        activity: r.activity === "working" ? "working" : "idle",
        zone: r.zone === "lounge" ? "lounge" : "station",
        currentTask: typeof r.currentTask === "string" ? r.currentTask : out[id].currentTask,
        xp: typeof r.xp === "number" && Number.isFinite(r.xp) ? Math.max(0, r.xp) : out[id].xp,
        memories: Array.isArray(r.memories)
          ? r.memories.filter((x): x is string => typeof x === "string").slice(-40)
          : out[id].memories,
        skills: Array.isArray(r.skills)
          ? r.skills.filter((x): x is string => typeof x === "string").slice(0, 60)
          : out[id].skills,
      };
    }
    return out;
  } catch {
    return null;
  }
}

function parseDelegation(text: string): { targets: AgentId[]; summary: string } {
  const lower = text.toLowerCase();
  const targets: AgentId[] = [];
  const push = (id: AgentId) => {
    if (!targets.includes(id)) targets.push(id);
  };
  if (/\balpha\b|research|undersog|undersøg|analys/i.test(lower)) push("alpha");
  if (/\bbravo\b|byg|build|implement|kode|code/i.test(lower)) push("bravo");
  if (/\bcharlie\b|verif|test|qa|tjek|check/i.test(lower)) push("charlie");
  if (targets.length === 0 && /alle|everyone|team|i alle/i.test(lower)) {
    push("alpha");
    push("bravo");
    push("charlie");
  }
  return { targets, summary: text.trim() };
}

function eugeneReplyFor(_text: string, targets: AgentId[]): string {
  if (targets.length === 0) {
    return (
      "Forstaaet. Jeg holder overblikket. Naevn Alpha, Bravo eller Charlie (eller opgavetype: research/build/verify), " +
      "saa uddelegerer jeg til den rigtige under-agent."
    );
  }
  const names = targets.map((t) => (t === "alpha" ? "Alpha" : t === "bravo" ? "Bravo" : "Charlie"));
  return (
    "Delegation sendt: " +
    names.join(", ") +
    " er sat paa opgaven og flyttet til station. Logget i hukommelse."
  );
}

const Ctx = createContext<FactoryAgentsContextValue | null>(null);

export function FactoryAgentsProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Record<AgentId, AgentSnapshot>>(DEFAULT_AGENTS);
  const [eugeneChat, setEugeneChat] = useState<EugeneChatTurn[]>([]);
  const eugeneChatRef = useRef<EugeneChatTurn[]>([]);
  const [selectedSessionKey, setSelectedSessionKey] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [lastGatewayMirror, setLastGatewayMirror] = useState<string | null>(null);
  const binderRef = useRef<GatewayBinder | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const eugeneLlmConfigured = useMemo(() => isEugeneLlmConfigured(), []);

  useEffect(() => {
    eugeneChatRef.current = eugeneChat;
  }, [eugeneChat]);

  useEffect(() => {
    const loaded = loadPersisted();
    if (loaded) setAgents(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ agents }));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [agents, hydrated]);

  const bumpXp = useCallback((ids: AgentId[], amount: number) => {
    setAgents((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        const a = next[id];
        if (!a) continue;
        next[id] = { ...a, xp: a.xp + amount };
      }
      return next;
    });
  }, []);

  const bindGateway = useCallback((binder: GatewayBinder | null) => {
    binderRef.current = binder;
  }, []);

  const scheduleEugeneIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setAgents((prev) => ({
        ...prev,
        eugene: { ...prev.eugene, activity: "idle" },
      }));
    }, 15000);
  }, []);

  const ingestGatewayFrame = useCallback(
    (msg: unknown) => {
      if (!msg || typeof msg !== "object") return;
      const m = msg as Record<string, unknown>;
      if (m.type !== "event") return;
      const ev = typeof m.event === "string" ? m.event : "";
      if (
        ev.includes("session.message") ||
        ev === "chat" ||
        ev.startsWith("chat.") ||
        ev.includes("agent")
      ) {
        setAgents((prev) => ({
          ...prev,
          eugene: { ...prev.eugene, activity: "working", zone: "station" },
        }));
        scheduleEugeneIdle();
      }
    },
    [scheduleEugeneIdle],
  );

  const archiveEugeneLongTermMemory = useCallback(async () => {
    if (!isEugeneLlmConfigured()) {
      return { ok: false as const, error: "LLM/Supabase ikke konfigureret (env)" };
    }
    const agentUuid = getEugeneAgentUuid();
    if (!agentUuid) return { ok: false as const, error: "Mangler NEXT_PUBLIC_EUGENE_AGENT_UUID" };

    const sb = createSupabaseBrowserClient();
    if (!sb) return { ok: false as const, error: "Supabase client kunne ikke oprettes" };

    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session?.access_token) {
      return { ok: false as const, error: "Ikke logget ind (Supabase Auth)" };
    }

    const turns = eugeneChatRef.current;
    if (turns.length === 0) {
      return { ok: false as const, error: "Tom chat" };
    }

    const messages = turns.slice(-40).map((t) => ({
      role: t.role === "eugene" ? "assistant" : t.role === "user" ? "user" : "system",
      content: t.text,
    }));

    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentUuid)}/memory/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        return { ok: false as const, error: data.error ?? `HTTP ${res.status}` };
      }
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Netværksfejl" };
    }
  }, []);

  const trySessionsSend = useCallback(
    async (message: string) => {
      const binder = binderRef.current;
      if (!binder || !selectedSessionKey.trim())
        return { ok: false as const, note: "Ingen session valgt" };
      const key = selectedSessionKey.trim();
      const params: Record<string, unknown> = { key, message };
      try {
        if (!binder.methodsStrict || binder.methods.has("sessions.send")) {
          await binder.rpc("sessions.send", params);
          return { ok: true as const, note: "sessions.send" };
        }
      } catch {
        /* fall through */
      }
      try {
        if (!binder.methodsStrict || binder.methods.has("chat.send")) {
          await binder.rpc("chat.send", { sessionKey: key, message });
          return { ok: true as const, note: "chat.send" };
        }
      } catch (e) {
        return { ok: false as const, note: e instanceof Error ? e.message : "RPC fejlede" };
      }
      return { ok: false as const, note: "Gateway annoncerer ikke sessions.send / chat.send" };
    },
    [selectedSessionKey],
  );

  const sendToEugene = useCallback(
    async (text: string, options: { mirrorToGateway: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userTurn: EugeneChatTurn = { id: uid(), role: "user", text: trimmed, at: Date.now() };
      const merged = [...eugeneChatRef.current, userTurn].slice(-80);
      setEugeneChat(merged);
      eugeneChatRef.current = merged;

      const { targets, summary } = parseDelegation(trimmed);
      const now = new Date().toISOString().slice(11, 19);

      setAgents((prev) => {
        const next = { ...prev };
        next.eugene = {
          ...next.eugene,
          activity: "working",
          zone: "station",
          currentTask: targets.length ? "Uddelegerer" : "Command deck",
          memories: capMemories([...next.eugene.memories, `[${now}] Du: ${trimmed.slice(0, 200)}`]),
        };
        for (const id of targets) {
          next[id] = {
            ...next[id],
            activity: "working",
            zone: "station",
            currentTask: summary.slice(0, 120),
            memories: capMemories([
              ...next[id].memories,
              `[${now}] Opgave fra Eugene: ${summary.slice(0, 220)}`,
            ]),
          };
        }
        return next;
      });

      bumpXp(["eugene", ...targets], 12 + Math.min(40, Math.floor(trimmed.length / 20)));

      let reply = eugeneReplyFor(trimmed, targets);

      if (eugeneLlmConfigured) {
        const agentUuid = getEugeneAgentUuid();
        const sb = createSupabaseBrowserClient();
        if (agentUuid && sb) {
          const {
            data: { session },
          } = await sb.auth.getSession();
          if (session?.access_token) {
            const messages = merged.slice(-30).map((t) => ({
              role:
                t.role === "eugene" ? ("assistant" as const) : t.role === "user" ? ("user" as const) : ("system" as const),
              content: t.text,
            }));
            try {
              const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ agentId: agentUuid, messages }),
              });
              const data = (await res.json()) as { reply?: string; error?: string };
              if (res.ok && typeof data.reply === "string" && data.reply.trim()) {
                reply = data.reply.trim();
              }
            } catch {
              /* keep deterministic reply */
            }
          }
        }
      }

      const eugeneTurn: EugeneChatTurn = { id: uid(), role: "eugene", text: reply, at: Date.now() };
      const withReply = [...eugeneChatRef.current, eugeneTurn].slice(-80);
      setEugeneChat(withReply);
      eugeneChatRef.current = withReply;

      setAgents((prev) => ({
        ...prev,
        eugene: {
          ...prev.eugene,
          memories: capMemories([
            ...prev.eugene.memories,
            `[${now}] Eugene: ${reply.slice(0, 200)}`,
          ]),
          activity: targets.length ? "working" : "idle",
        },
      }));

      if (options.mirrorToGateway) {
        const r = await trySessionsSend(`[The Factory / Eugene] ${trimmed}`);
        setLastGatewayMirror(r.ok ? `Sendt via ${r.note}` : `Ikke sendt til gateway: ${r.note}`);
        const withGw = [
          ...eugeneChatRef.current,
          {
            id: uid(),
            role: "system" as const,
            text: r.ok ? `Gateway: besked sendt (${r.note}).` : `Gateway: ${r.note}`,
            at: Date.now(),
          },
        ].slice(-80);
        setEugeneChat(withGw);
        eugeneChatRef.current = withGw;
      } else {
        setLastGatewayMirror(null);
      }
    },
    [bumpXp, trySessionsSend, eugeneLlmConfigured],
  );

  const setAgentZone = useCallback((id: AgentId, zone: AgentSnapshot["zone"]) => {
    setAgents((prev) => ({
      ...prev,
      [id]: { ...prev[id], zone },
    }));
  }, []);

  const setAgentActivity = useCallback((id: AgentId, activity: AgentSnapshot["activity"]) => {
    setAgents((prev) => ({
      ...prev,
      [id]: { ...prev[id], activity },
    }));
  }, []);

  const allToLounge = useCallback(() => {
    setAgents((prev) => {
      const next = { ...prev };
      (Object.keys(next) as AgentId[]).forEach((id) => {
        next[id] = { ...next[id], zone: "lounge", activity: "idle" };
      });
      return next;
    });
  }, []);

  const allToStations = useCallback(() => {
    setAgents((prev) => {
      const next = { ...prev };
      (Object.keys(next) as AgentId[]).forEach((id) => {
        next[id] = { ...next[id], zone: "station" };
      });
      return next;
    });
  }, []);

  const addSkill = useCallback((id: AgentId, skill: string) => {
    const t = skill.trim();
    if (!t) return;
    setAgents((prev) => {
      const a = prev[id];
      if (!a) return prev;
      if (a.skills.some((x) => x.toLowerCase() === t.toLowerCase())) return prev;
      return { ...prev, [id]: { ...a, skills: [...a.skills, t].slice(0, 80) } };
    });
  }, []);

  const removeSkill = useCallback((id: AgentId, skill: string) => {
    setAgents((prev) => {
      const a = prev[id];
      if (!a) return prev;
      return { ...prev, [id]: { ...a, skills: a.skills.filter((x) => x !== skill) } };
    });
  }, []);

  const markTaskDone = useCallback(
    (id: AgentId) => {
      setAgents((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          activity: "idle",
          currentTask:
            id === "eugene" ? "Koordinering & delegation" : DEFAULT_AGENTS[id].currentTask,
        },
      }));
      bumpXp([id], 8);
    },
    [bumpXp],
  );

  const resetProgress = useCallback(() => {
    setAgents(DEFAULT_AGENTS);
    setEugeneChat([]);
    eugeneChatRef.current = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<FactoryAgentsContextValue>(
    () => ({
      agents,
      eugeneChat,
      selectedSessionKey,
      setSelectedSessionKey,
      sendToEugene,
      archiveEugeneLongTermMemory,
      eugeneLlmConfigured,
      setAgentZone,
      setAgentActivity,
      allToLounge,
      allToStations,
      markTaskDone,
      resetProgress,
      bindGateway,
      ingestGatewayFrame,
      lastGatewayMirror,
      addSkill,
      removeSkill,
    }),
    [
      agents,
      eugeneChat,
      selectedSessionKey,
      sendToEugene,
      archiveEugeneLongTermMemory,
      eugeneLlmConfigured,
      setAgentZone,
      setAgentActivity,
      allToLounge,
      allToStations,
      markTaskDone,
      resetProgress,
      bindGateway,
      ingestGatewayFrame,
      lastGatewayMirror,
      addSkill,
      removeSkill,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFactoryAgents() {
  const x = useContext(Ctx);
  if (!x) throw new Error("useFactoryAgents requires FactoryAgentsProvider");
  return x;
}

export function extractSessionOptions(data: unknown): { key: string; label: string }[] {
  const rows: { key: string; label: string }[] = [];
  const visit = (obj: unknown) => {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(visit);
      return;
    }
    const o = obj as Record<string, unknown>;
    const key =
      (typeof o.key === "string" && o.key) ||
      (typeof o.sessionKey === "string" && o.sessionKey) ||
      (typeof o.id === "string" && o.id) ||
      "";
    if (!key) return;
    const label =
      (typeof o.label === "string" && o.label) ||
      (typeof o.title === "string" && o.title) ||
      (typeof o.name === "string" && o.name) ||
      key.slice(0, 48);
    rows.push({ key, label: label + " | " + key.slice(0, 24) });
  };
  visit(data);
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.key)) return false;
    seen.add(r.key);
    return true;
  });
}


