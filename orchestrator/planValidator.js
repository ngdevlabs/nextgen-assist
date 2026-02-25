// orchestrator/planValidator.js
import fs from "fs";
import path from "path";

const REPO_ROOT = "/repos";

export function validatePlan(plan) {
  let seen = new Set();

  if (!plan.phases || !Array.isArray(plan.phases)) {
    throw new Error("Invalid plan: missing phases");
  }

  for (const phase of plan.phases) {
    if (!Array.isArray(phase.files)) {
      throw new Error(`Invalid phase "${phase.phase}": files must be array`);
    }

    for (const file of phase.files) {
      if (file.includes("*")) {
        throw new Error(`Wildcard not allowed: ${file}`);
      }

      if (seen.has(file)) continue;
      seen.add(file);

      const fullPath = path.join(REPO_ROOT, file);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File does not exist: ${file}`);
      }
    }
  }

  return true;
}