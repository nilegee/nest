// Robust DB-change detector for PRs.
// Pass: if DB-facing app files changed AND a migration exists under supabase/migrations/.
// Inputs: BASE_SHA from the workflow (github.event.pull_request.base.sha)

import { execSync } from "node:child_process";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

const BASE_SHA = process.env.BASE_SHA;
if (!BASE_SHA) {
  console.error("db-change-detect: BASE_SHA env not provided.");
  process.exit(1);
}

// Ensure base commit exists locally (handles forks / shallow checkout)
try {
  sh(`git cat-file -e ${BASE_SHA}^{commit}`);
} catch {
  sh(`git fetch --no-tags --prune --depth=1 origin ${BASE_SHA}`);
}

// Changed files introduced by this PR
const diff = sh(`git diff --name-only ${BASE_SHA}..HEAD`)
  .split("\n")
  .filter(Boolean);

// App files that *may* impact DB usage
const touchesAppDb = diff.some((p) =>
  p.startsWith("src/") ||
  p.startsWith("web/") ||
  p.startsWith("db/") ||
  p.startsWith("supabase/schema_inferred.sql")
);

// At least one migration present?
const hasMigration = diff.some(
  (p) => p.startsWith("supabase/migrations/") && p.endsWith(".sql")
);

if (touchesAppDb && !hasMigration) {
  console.error(
    "DB-affecting app files changed but no migration found. " +
    "Add a timestamped SQL file under supabase/migrations/."
  );
  process.exit(1);
}

console.log("db-change-detect: ok");