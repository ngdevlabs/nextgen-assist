// orchestrator/planner.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function runPlanningAgent({ goal, repoSummary, constraints }) {
  const system = `
You are a PLANNING AGENT.
You do NOT edit code.
You ONLY produce a structured execution plan as STRICT JSON.
No markdown. No explanations. JSON only.
`;

  const user = `
GOAL:
${goal}

REPO SUMMARY:
${repoSummary}

CONSTRAINTS:
${constraints.join("\n")}

OUTPUT FORMAT (STRICT JSON):
{
  "goal": string,
  "phases": [
    {
      "phase": string,
      "description": string,
      "files": string[]
    }
  ],
  "global_rules": string[]
}

RULES:
- Only include files that plausibly exist in the repo
- No wildcards
- No duplicate files
- Phases must be sequential and logical
- Output VALID JSON ONLY
STRICT RULES:
- Output MUST be valid JSON
- No trailing commas
- No comments
- No markdown
- All strings MUST be closed
- If unsure, output an EMPTY phases array
- A file may appear in ONLY ONE phase total.
- If a file would logically belong to multiple phases, include it ONLY in the EARLIEST phase.
- Do NOT repeat file paths across phases.
`;

  const res = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content: user }],
  });

  return res.content[0].text;
}