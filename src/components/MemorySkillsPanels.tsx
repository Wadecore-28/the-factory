"use client";

import { useMemo, useState } from "react";
import { Brain, Plus, Search, Trash2, Wrench } from "lucide-react";
import { useFactoryAgents, type AgentId } from "@/context/FactoryAgentsContext";

const AGENT_LABEL: Record<AgentId, string> = {
  eugene: "Eugene",
  alpha: "Alpha",
  bravo: "Bravo",
  charlie: "Charlie",
};

export function MemorySkillsPanels() {
  const { agents, addSkill, removeSkill } = useFactoryAgents();
  const [tab, setTab] = useState<"memory" | "skills">("memory");
  const [agentId, setAgentId] = useState<AgentId>("eugene");
  const [skillDraft, setSkillDraft] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  const mem = agents[agentId].memories;
  const skills = agents[agentId].skills;

  const filteredSkills = useMemo(() => {
    const q = skillFilter.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter((s) => s.toLowerCase().includes(q));
  }, [skills, skillFilter]);

  return (
    <section className="rounded-xl border border-violet-500/25 bg-tf-panel/40 p-6 lg:col-span-2">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-sans text-lg text-violet-300">
          {tab === "memory" ? <Brain className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
          {tab === "memory" ? "Memory center" : "Skill center"}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("memory")}
            className={
              "rounded border px-3 py-1 font-sans text-xs " +
              (tab === "memory"
                ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                : "border-slate-600 text-slate-400 hover:bg-slate-800/50")
            }
          >
            Hukommelse
          </button>
          <button
            type="button"
            onClick={() => setTab("skills")}
            className={
              "rounded border px-3 py-1 font-sans text-xs " +
              (tab === "skills"
                ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                : "border-slate-600 text-slate-400 hover:bg-slate-800/50")
            }
          >
            Skills
          </button>
        </div>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">
        Dashboard-hukommelse og skills gemmes lokalt i browseren (samme som XP). OpenClaws rigtige agent-hukommelse
        ligger i gatewayen — det her er dit overblik og dine noter.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-[10px] uppercase tracking-wider text-slate-500">Agent</label>
        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value as AgentId)}
          className="rounded border border-slate-600 bg-black/50 px-2 py-1 text-xs text-slate-200"
        >
          {(Object.keys(AGENT_LABEL) as AgentId[]).map((id) => (
            <option key={id} value={id}>
              {AGENT_LABEL[id]}
            </option>
          ))}
        </select>
      </div>
      {tab === "memory" ? (
        <div className="max-h-72 overflow-y-auto rounded border border-slate-700 bg-black/40 p-3 text-xs">
          {mem.length === 0 ? (
            <p className="text-slate-500">Ingen log endnu. Skriv til Eugene i fabrikken — så dukker linjer op her.</p>
          ) : (
            <ul className="space-y-2">
              {[...mem].reverse().map((line, i) => (
                <li key={i} className="border-b border-slate-800/80 pb-2 text-slate-300 last:border-0">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[160px] flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                placeholder="Find skill..."
                className="w-full rounded border border-slate-600 bg-black/50 py-1.5 pl-8 pr-2 text-xs text-slate-200 placeholder:text-slate-600"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              placeholder="Ny skill (tryk Enter)"
              className="min-w-[200px] flex-1 rounded border border-slate-600 bg-black/50 px-2 py-1.5 text-xs text-slate-200"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addSkill(agentId, skillDraft);
                  setSkillDraft("");
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                addSkill(agentId, skillDraft);
                setSkillDraft("");
              }}
              className="flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Tilføj
            </button>
          </div>
          <ul className="max-h-56 space-y-1 overflow-y-auto rounded border border-slate-700 bg-black/40 p-2 text-xs">
            {filteredSkills.length === 0 ? (
              <li className="text-slate-500">Ingen skills matcher — tilføj eller ryd søgning.</li>
            ) : (
              filteredSkills.map((sk) => (
                <li
                  key={sk}
                  className="flex items-center justify-between gap-2 rounded border border-slate-800/80 bg-slate-900/40 px-2 py-1.5"
                >
                  <span className="text-slate-200">{sk}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(agentId, sk)}
                    className="shrink-0 rounded p-1 text-slate-500 hover:bg-red-500/15 hover:text-red-300"
                    title="Fjern"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </section>
  );
}

