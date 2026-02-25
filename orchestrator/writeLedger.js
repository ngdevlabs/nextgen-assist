import pkg from "pg";
const { Client } = pkg;

const db = new Client({
  connectionString: process.env.POSTGRES_URL
});

await db.connect();

/**
 * Records the intent behind a file change.
 * This does NOT apply changes — it only logs rationale.
 */
export async function writeLedgerEntry({
  repo,
  filePath,
  intent,
  rules = []
}) {
  await db.query(
    `
    INSERT INTO change_ledger (repo, file_path, change_intent, rules)
    VALUES ($1, $2, $3, $4)
    `,
    [repo, filePath, intent, rules]
  );
}