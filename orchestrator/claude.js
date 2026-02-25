// orchestrator/claude.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function runClaudeAgent({ system, context, task }) {
  const msg = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    system,
    messages: [
      {
        role: "user",
        content: `
TASK:
${task}

CONTEXT:
${context}

INSTRUCTIONS:
- Propose changes as a unified diff only
- Do NOT include explanations
- Do NOT modify unrelated code
        `,
      },
    ],
  });

  return msg.content[0].text;
}
