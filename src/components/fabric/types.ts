export type AgentWorkspaceRole =
  | "manager"
  | "creator"
  | "researcher"
  | "wordsmith"
  | "developer"
  | "closer";

export type WorkspaceCell = {
  id: string;
  name: string;
  color: string;
  agentKey: string | null;
  /** Thematic room layout; slots 7–8 stay `null` (under construction). */
  role: AgentWorkspaceRole | null;
};
