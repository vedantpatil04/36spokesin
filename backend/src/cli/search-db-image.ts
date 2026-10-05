import "reflect-metadata";
import pg from "pg";

async function main(): Promise<void> {
  try {
    process.loadEnvFile();
  } catch {}

  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const isSsl =
    databaseUrl.includes("sslmode=require") ||
    databaseUrl.includes("supabase.co") ||
    databaseUrl.includes("pooler.supabase.com");
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  });

  const term = "080bc1fc";
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND data_type IN ('text', 'character varying');
    `);

    for (const row of res.rows) {
      const { table_name, column_name } = row;
      try {
        const match = await client.query(
          `SELECT "${column_name}" FROM "${table_name}" WHERE "${column_name}" ILIKE $1 LIMIT 5;`,
          [`%${term}%`]
        );
        if (match.rows.length > 0) {
          console.log(`FOUND in table: ${table_name}, column: ${column_name}`);
          console.log(match.rows);
        }
      } catch {}
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
