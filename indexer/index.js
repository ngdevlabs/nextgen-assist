import fs from "fs-extra";
import { globSync } from "glob";
import path from "path";
import pkg from "pg";
import OpenAI from "openai";
const { Client } = pkg;

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

const db = new Client({
  connectionString: process.env.POSTGRES_URL
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

await db.connect();

async function embed(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text
  });
  return res.data[0].embedding;
}

async function scanRepo() {
    function getRepoName(filePath) {
        return filePath.split(path.sep)[0];
    }
    console.log("Starting repo scan...");
    for (const file of globSync("**/*.*", {
    cwd: REPO_ROOT,
    ignore: ["**/node_modules/**", "**/.git/**"]
    })) {
        const fullPath = path.join(REPO_ROOT, file);
        const content = await fs.readFile(fullPath, "utf8");
        console.log(`Chunking ${file}`);
        const chunks = chunkText(content);
        console.log(`${file}: ${chunks.length} chunks`);

        let i = 0;
        for (const chunk of chunks) {

            const embedding = await embed(chunk);

            await db.query(
            `INSERT INTO code_chunks (repo, file_path, chunk_index, content, embedding)
            VALUES ($1, $2, $3, $4, $5)`,
            [getRepoName(file), file, i, chunk, `[${embedding.join(",")}]`]
            );
            
            i++;

        }

    }
}

try {
  await scanRepo();
} catch (err) {
  console.error(err);
} finally {
  await db.end();
}