// orchestrator/retriever.js
import pkg from "pg";
const { Client } = pkg;

const db = new Client({
  connectionString: process.env.POSTGRES_URL
});

await db.connect();

export async function getFileContext({ filePath, limit = 8 }) {
  const res = await db.query(
    `
    SELECT content
    FROM code_chunks
    WHERE file_path = $1
    ORDER BY chunk_index
    LIMIT $2
    `,
    [filePath, limit]
  );

  return res.rows.map(r => r.content).join("\n\n");
}
