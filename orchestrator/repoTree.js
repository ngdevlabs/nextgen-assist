// orchestrator/repoTree.js
import { globSync } from "glob";

export function generateRepoTree({ root = "/repos", maxFiles = 200 }) {
  const files = globSync("**/*.*", {
    cwd: root,
    ignore: ["**/node_modules/**", "**/.git/**"]
  });

  return files
    .slice(0, maxFiles)
    .map(f => `- ${f}`)
    .join("\n");
}