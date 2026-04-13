import fs from "node:fs";
const p = "e:/mission-control/src/context/MissionAgentsContext.tsx";
let s = fs.readFileSync(p, "utf8");
if (s.includes("addSkill:")) {
  console.log("context already has skills");
  process.exit(0);
}
s = s.replace(
  `  memories: string[];
};`,
  `  memories: string[];
  skills: string[];
};`
);
s = s.replace(
  `  lastGatewayMirror: string | null;
};`,
  `  lastGatewayMirror: string | null;
  addSkill: (id: AgentId, skill: string) => void;
  removeSkill: (id: AgentId, skill: string) => void;
};`
);
s = s.replace(
  `const defaultAgent = (task: string): AgentSnapshot => ({
  activity: "idle",
  zone: "station",
  currentTask: task,
  xp: 0,
  memories: [],
});

const DEFAULT_AGENTS: Record<AgentId, AgentSnapshot> = {
  eugene: defaultAgent("Koordinering & delegation"),
  alpha: defaultAgent("Research"),
  bravo: defaultAgent("Build"),
  charlie: defaultAgent("Verify"),
};`,
  `function defaultAgent(task: string, skills: string[]): AgentSnapshot {
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
};`
);
s = s.replace(
  `        memories: Array.isArray(r.memories)
          ? r.memories.filter((x): x is string => typeof x === "string").slice(-40)
          : out[id].memories,
      };
    }
    return out;`,
  `        memories: Array.isArray(r.memories)
          ? r.memories.filter((x): x is string => typeof x === "string").slice(-40)
          : out[id].memories,
        skills: Array.isArray(r.skills)
          ? r.skills.filter((x): x is string => typeof x === "string").slice(0, 60)
          : out[id].skills,
      };
    }
    return out;`
);
const insertAfterMark = `  const markTaskDone = useCallback(`;
const addCb = `  const addSkill = useCallback((id: AgentId, skill: string) => {
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

`;
if (!s.includes("const addSkill = useCallback")) s = s.replace(insertAfterMark, addCb + insertAfterMark);
s = s.replace(
  `      resetProgress,
      bindGateway,
      ingestGatewayFrame,
      lastGatewayMirror,
    }),`,
  `      resetProgress,
      bindGateway,
      ingestGatewayFrame,
      lastGatewayMirror,
      addSkill,
      removeSkill,
    }),`
);
s = s.replace(
  `      resetProgress,
      bindGateway,
      ingestGatewayFrame,
      lastGatewayMirror,
    ],
  );`,
  `      resetProgress,
      bindGateway,
      ingestGatewayFrame,
      lastGatewayMirror,
      addSkill,
      removeSkill,
    ],
  );`
);
fs.writeFileSync(p, s);
console.log("context skills ok");
