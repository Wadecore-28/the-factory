import fs from "fs";
const p = "src/components/AgentFactory.tsx";
let t = fs.readFileSync(p, "utf8");
t = t.replace(
  `style={{ minHeight: "min(88vh, 820px)" }}`,
  `className="min-h-[900px] lg:min-h-[min(120vh,1200px)]" style={{ minHeight: "max(900px, min(120vh, 1200px))" }}`,
);
// section already has className - need to merge
