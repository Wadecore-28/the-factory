import fs from "node:fs";
const p = "e:/mission-control/src/components/MissionDashboard.tsx";
let s = fs.readFileSync(p, "utf8");
if (!s.includes("MemorySkillsPanels")) {
  s = s.replace(
    `} from "lucide-react";`,
    `  BookOpen,
} from "lucide-react";
import Link from "next/link";`
  );
  s = s.replace(
    `import { AgentFactory } from "@/components/AgentFactory";`,
    `import { AgentFactory } from "@/components/AgentFactory";
import { MemorySkillsPanels } from "@/components/MemorySkillsPanels";`
  );
}
const oldStart = `      {(socketPhase === "idle" || socketPhase === "error") && (
        <section className="mb-8 rounded-xl border border-emerald-500/40`;
const newStart = `      {(socketPhase === "idle" || socketPhase === "error") && (
        <div className="mb-3 flex justify-end">
          <Link
            href="/manual"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-500/50 bg-slate-800/60 px-4 py-2 font-sans text-sm text-slate-200 transition hover:border-cyan-500/40 hover:bg-slate-800 hover:text-cyan-200"
          >
            <BookOpen className="h-4 w-4" />
            Manual
          </Link>
        </div>
        <section className="mb-8 rounded-xl border border-emerald-500/40`;
if (!s.includes("href=\"/manual\"")) s = s.replace(oldStart, newStart);

const sessEnd = `        </section>
      </div>

      <footer className="mt-12`;
const sessWithMem = `        </section>

        <MemorySkillsPanels />
      </div>

      <footer className="mt-12`;
if (!s.includes("<MemorySkillsPanels />")) s = s.replace(sessEnd, sessWithMem);

fs.writeFileSync(p, s);
console.log("dashboard patched", s.includes("Manual"), s.includes("MemorySkillsPanels"));
