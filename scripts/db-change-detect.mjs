import { execSync } from "node:child_process";
const sh = (c) => execSync(c, { encoding: "utf8", stdio: ["ignore","pipe","pipe"] }).trim();

const BASE_SHA = process.env.BASE_SHA;
if (!BASE_SHA) { console.error("db-change-detect: BASE_SHA env not provided."); process.exit(1); }

try { sh(`git cat-file -e ${BASE_SHA}^{commit}`); }
catch { sh(`git fetch --no-tags --prune --depth=1 origin ${BASE_SHA}`); }

const diff = sh(`git diff --name-only ${BASE_SHA}..HEAD`).split("\n").filter(Boolean);

const touchesAppDb = diff.some((p) =>
  p.startsWith("src/") || p.startsWith("web/") || p.startsWith("db/") || p.startsWith("supabase/schema_inferred.sql")
);
const hasMigration = diff.some((p) => p.startsWith("supabase/migrations/") && p.endsWith(".sql"));

if (touchesAppDb && !hasMigration) {
  console.error("DB-affecting app files changed but no migration found. Add one under supabase/migrations/.");
  process.exit(1);
}
console.log("db-change-detect: ok");