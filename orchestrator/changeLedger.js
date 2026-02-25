import pkg from "pg";
const { Client } = pkg;

const db = new Client({
  connectionString: process.env.POSTGRES_URL
});

await db.connect();

export async function getChangeHistory(repo, filePath) {
  const res = await db.query(
    `
    SELECT change_intent, rules, created_at
    FROM change_ledger
    WHERE repo = $1 AND file_path = $2
    ORDER BY created_at DESC
    LIMIT 5
    `,
    [repo, filePath]
  );

  return res.rows;
}