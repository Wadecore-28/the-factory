import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = dirname(fileURLToPath(import.meta.url));
const mc = join(root, "..");
process.chdir(mc);
const dashPath = "src/components/MissionDashboard.tsx";
let dash = fs.readFileSync(dashPath, "utf8");
if (!dash.includes("MissionAgentsProvider")) {
  dash = dash.replace(
    `import { AgentFactory } from "@/components/AgentFactory";`,
    `import { AgentFactory } from "@/components/AgentFactory";
import {
  MissionAgentsProvider,
  useMissionAgents,
  extractSessionOptions,
} from "@/context/MissionAgentsContext";`
  );
  dash = dash.replace(
    "export default function MissionDashboard() {",
    "function MissionDashboardInner() {"
  );
  dash = dash.replace(
    `  const [gatewayFeed, setGatewayFeed] = useState<GatewayFeedItem[]>([]);

  useEffect(() => {`,
    `  const [gatewayFeed, setGatewayFeed] = useState<GatewayFeedItem[]>([]);
  const { bindGateway, ingestGatewayFrame } = useMissionAgents();

  const sessionOptions = useMemo(() => {
    if (!sessionsJson) return [];
    try {
      return extractSessionOptions(JSON.parse(sessionsJson));
    } catch {
      return [];
    }
  }, [sessionsJson]);

  useEffect(() => {
    if (socketPhase !== "live") {
      bindGateway(null);
      return;
    }
    const b = bridgeRef.current;
    if (!b) {
      bindGateway(null);
      return;
    }
    bindGateway({
      rpc: (method, params) => b.rpc(method, params),
      methods: new Set(gatewayMethods),
      methodsStrict,
    });
    return () => bindGateway(null);
  }, [socketPhase, gatewayMethods, methodsStrict, bindGateway]);

  useEffect(() => {`
  );
  dash = dash.replace(
    `    b.on("frame", (raw) => {
      const line = summarizeGatewayFrame(raw);
      if (!line) return;`,
    `    b.on("frame", (raw) => {
      ingestGatewayFrame(raw);
      const line = summarizeGatewayFrame(raw);
      if (!line) return;`
  );
  dash = dash.replace(
    "<AgentFactory />",
    `<AgentFactory
          socketPhase={socketPhase}
          sessionOptions={sessionOptions}
          onRefreshSessions={refreshGatewaySessions}
          sessionsLoading={sessionsLoading}
          gatewayMethods={gatewayMethods}
          methodsStrict={methodsStrict}
        />`
  );
  dash +=
    `

export default function MissionDashboard() {
  return (
    <MissionAgentsProvider>
      <MissionDashboardInner />
    </MissionAgentsProvider>
  );
}
`;
  fs.writeFileSync(dashPath, dash);
  console.log("MissionDashboard patched");
} else {
  console.log("MissionDashboard already patched");
}
