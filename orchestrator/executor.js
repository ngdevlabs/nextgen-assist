import fs from "fs-extra";
import path from "path";
import { getFileContext } from "./retriever.js";
import { runClaudeAgent } from "./claude.js";
import { getChangeHistory } from "./changeLedger.js";
import { writeLedgerEntry } from "./writeLedger.js";

const REPO_ROOT = "/repos";

/**
 * Executes a validated plan by rewriting files directly.
 * No diffs. No approval. No git.
 */
export async function executePlan(plan) {
  for (const phase of plan.phases) {
    for (const filePath of phase.files) {
      const repo = filePath.split(path.sep)[0];
      const absPath = path.join(REPO_ROOT, filePath);

      if (!fs.existsSync(absPath)) {
        throw new Error(`File not found at execution time: ${filePath}`);
      }

      // 1️⃣ Load current file context
      const fileContext = await getFileContext({ filePath });

      // 2️⃣ Load recent change intent history
      const changeHistory = await getChangeHistory(repo, filePath);

      // 3️⃣ Ask Claude for FULL rewritten file
      const updatedContent = await runClaudeAgent({
        system: `
You are a FILE REWRITE AGENT.

Rules:
- You may ONLY modify this file: ${filePath}
- Output the FULL updated file contents
- NO markdown
- NO explanations
- Preserve formatting unless changes are required
- Respect prior change intent history
`,
        context: `
=== CURRENT FILE ===
${fileContext}

=== RECENT CHANGE INTENT HISTORY ===
${JSON.stringify(changeHistory, null, 2)}
`,
        task: `
GOAL:
${plan.goal}

PHASE:
${phase.phase}

PHASE DESCRIPTION:
${phase.description}
`
      });

      // 4️⃣ Write updated file to disk
      await fs.writeFile(absPath, updatedContent, "utf8");

      // 5️⃣ Record intent in change ledger
      await writeLedgerEntry({
        repo,
        filePath,
        intent: `${plan.goal} — ${phase.phase}`,
        rules: plan.constraints || []
      });

      console.log(`✔ Updated ${filePath}`);
    }
  }
}