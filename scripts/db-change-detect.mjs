// Passes if this PR includes at least one migration when app code touches DB-facing files.
import { execSync } from "node:child_process";

const base = process.env.GITHUB_BASE_REF || "origin/main";
const diff = execSync(`git diff --name-only ${base}...`, { encoding: "utf8" }).split("\n");

const touchedAppDbFiles = diff.some(p =>
  p.startsWith("src/") || p.startsWith("web/") || p.startsWith("db/") || p.startsWith("supabase/schema_inferred.sql")
);

const hasMigration = diff.some(p => p.startsWith("supabase/migrations/") && p.endsWith(".sql"));

if (touchedAppDbFiles && !hasMigration) {
  console.error("DB-affecting app files changed but no migration added. Add a SQL file under supabase/migrations/.");
  process.exit(1);
}

console.log("db-change-detect: ok");