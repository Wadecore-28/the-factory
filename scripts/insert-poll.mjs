import fs from "node:fs";
const p = "e:/mission-control/src/components/MissionDashboard.tsx";
let s = fs.readFileSync(p, "utf8");
if (s.includes("12000")) {
  console.log("poll exists");
  process.exit(0);
}
const needle = `  }, []);

  const connect = useCallback(async () => {`;
const ins = `  }, []);

  useEffect(() => {
    if (socketPhase !== "live") return;
    const t = window.setInterval(() => {
      refreshGatewaySessions({ silent: true });
    }, 12000);
    return () => clearInterval(t);
  }, [socketPhase, refreshGatewaySessions]);

  const connect = useCallback(async () => {`;
if (!s.includes(needle)) {
  console.error("needle not found");
  process.exit(1);
}
s = s.replace(needle, ins);
fs.writeFileSync(p, s);
console.log("poll inserted");
