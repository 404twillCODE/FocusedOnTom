import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

const sqlPath = resolve(
  process.cwd(),
  "supabase/migrations/20260821120000_explore_ny.sql"
);

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.log(`No DATABASE_URL / SUPABASE_DB_URL set.
Open the Supabase SQL editor and paste:

  ${sqlPath}

Then run: npm run explore:seed
`);
    process.exit(1);
  }
  const sqlFile = readFileSync(sqlPath, "utf8");
  const sql = postgres(dbUrl, { max: 1, ssl: "require" });
  await sql.unsafe(sqlFile);
  await sql.end();
  console.log("Explore schema applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
