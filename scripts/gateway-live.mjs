import fs from "node:fs";

const bridgePath = "e:/mission-control/src/lib/nemoclaw-bridge.js";
let br = fs.readFileSync(bridgePath, "utf8");
br = br.replace(
  'this.gatewayClientId = options.gatewayClientId || "cli";',
  'this.gatewayClientId = options.gatewayClientId || "openclaw-control-ui";'
);
fs.writeFileSync(bridgePath, br);
console.log("bridge default client -> openclaw-control-ui");

const dashPath = "e:/mission-control/src/components/MissionDashboard.tsx";
let s = fs.readFileSync(dashPath, "utf8");

const oldRefresh = `  const refreshGatewaySessions = useCallback(() => {
    const b = bridgeRef.current;
    if (!b?.connected) return;
    setSessionsLoading(true);
    setSessionsErr(null);
    void b.rpc("sessions.list", {}).then(
      (data) => {
        setSessionsJson(JSON.stringify(data, null, 2));
        setSessionsLoading(false);
      },
      (e) => {
        setSessionsErr(rpcErrString(e));
        setSessionsJson(null);
        setSessionsLoading(false);
      },
    );
  }, []);`;

const newRefresh = `  const refreshGatewaySessions = useCallback((opts?: { silent?: boolean }) => {
    const b = bridgeRef.current;
    if (!b?.connected) return;
    const silent = Boolean(opts?.silent);
    if (!silent) {
      setSessionsLoading(true);
      setSessionsErr(null);
    }
    void b.rpc("sessions.list", {}).then(
      (data) => {
        setSessionsJson(JSON.stringify(data, null, 2));
        if (!silent) setSessionsLoading(false);
      },
      (e) => {
        if (!silent) {
          setSessionsErr(rpcErrString(e));
          setSessionsJson(null);
          setSessionsLoading(false);
        }
      },
    );
  }, []);`;

if (s.includes("opts?: { silent?: boolean }")) {
  console.log("refresh already patched");
} else {
  s = s.replace(oldRefresh, newRefresh);
  fs.writeFileSync(dashPath, s);
  console.log("refresh patched");
}
