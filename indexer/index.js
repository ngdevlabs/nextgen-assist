import fs from "fs-extra";
import { globSync } from "glob";
import path from "path";
import pkg from "pg";
import OpenAI from "openai";
import crypto from "crypto";
const { Client } = pkg;

const REPO_ROOT = "/repos";
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function hashContent(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}


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
    model: "text-embedding-3-small",
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
        const contentHash = hashContent(content);
        const repo = getRepoName(file);

        // check existing hash
        const existing = await db.query(
            `SELECT content_hash FROM indexed_files WHERE repo = $1 AND file_path = $2`,
            [repo, file]
        );

        if (existing.rowCount && existing.rows[0].content_hash === contentHash) {
            continue; // unchanged file → skip
        }

        await db.query(
            `DELETE FROM code_chunks WHERE repo = $1 AND file_path = $2`,
            [repo, file]
        );

        const chunks = chunkText(content);
        console.log(`${file}: ${chunks.length} chunks`);
        let i = 0;

        for (const chunk of chunks) {

            const embedding = await embed(chunk);

            await db.query(
            `INSERT INTO code_chunks (repo, file_path, chunk_index, content, embedding)
            VALUES ($1, $2, $3, $4, $5)`,
            [repo, file, i, chunk, `[${embedding.join(",")}]`]
            );
            
            i++;

        }

        await db.query(
            `
            INSERT INTO indexed_files (repo, file_path, content_hash)
            VALUES ($1, $2, $3)
            ON CONFLICT (repo, file_path)
            DO UPDATE SET content_hash = EXCLUDED.content_hash
            `,
            [repo, file, contentHash]
        );


    }
}

try {
  await scanRepo();
} catch (err) {
  console.error(err);
} finally {
  await db.end();
}