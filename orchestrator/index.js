import { runPlanningAgent } from "./planner.js";
import { generateRepoTree } from "./repoTree.js";
import { validatePlan } from "./planValidator.js";
import { executePlan } from "./executor.js";

console.log("Orchestrator online");

/**
 * Extracts the first valid JSON object from LLM output.
 * This MUST stay permanently.
 */
function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON object found in planner output");
  }
  return match[0];
}

async function handleCommand(command) {
  // 1️⃣ Generate repo structure summary
  const repoTree = generateRepoTree({
    root: "/repos"
  });

  // 2️⃣ Run planning agent
  const rawPlan = await runPlanningAgent({
    goal: command,
    repoSummary: `REPO TREE:\n${repoTree}`,
    constraints: [
      "Must remain BigCommerce Stencil compatible",
      "Mobile-first",
      "No breaking template APIs",
      "Prefer minimal JS bundle growth"
    ]
  });

  // 3️⃣ Parse + validate plan
  const plan = JSON.parse(extractJson(rawPlan));
  validatePlan(plan);

  console.log("=== VALIDATED EXECUTION PLAN ===");
  console.log(JSON.stringify(plan, null, 2));

  await executePlan(plan);
  console.log("✔ Execution complete");
  process.exit(0);
}

// Manual test invocation (replace later with CLI / API / Slack input)
handleCommand(
  "I want you to make this code as little lines as possible in sellercloud-sales-order.js It lives in a netlify serverless function."
);