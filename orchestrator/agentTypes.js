// orchestrator/agentTypes.js

export const AgentType = {
  ORCHESTRATOR: "orchestrator",
  FILE: "file",
};

export function createFileAgent({ filePath, instructions }) {
  return {
    type: AgentType.FILE,
    scope: {
      filePath,
    },
    instructions,
  };
}
