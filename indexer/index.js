import fs from "fs-extra";
import { globSync } from "glob";
import path from "path";

const REPO_ROOT = "/repos";
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function chunkText(text) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));

    if (end === text.length) {
      break; 
    }

    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}


async function scanRepo() {
    console.log("Starting repo scan...");
    for (const file of globSync("**/*.*", {
    cwd: REPO_ROOT,
    ignore: ["**/node_modules/**", "**/.git/**"]
    })) {
        console.log(`Processing ${file}`);
        const fullPath = path.join(REPO_ROOT, file);
        const content = await fs.readFile(fullPath, "utf8");
        console.log(`Chunking ${file}`);
        const chunks = chunkText(content);
        console.log(`${file}: ${chunks.length} chunks`);
    }
}

scanRepo().catch(console.error);
