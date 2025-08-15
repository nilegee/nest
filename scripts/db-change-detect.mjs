// Robust DB-change detector for PRs (works for forks and shallow clones)
//
// Passes if: when DB-facing app files change, the PR also includes
// at least one SQL file under supabase/migrations/.
//
// Inputs from workflow:
//   - BASE_SHA: the PR base commit SHA (github.event.pull_request.base.sha)

import { execSync } from "node:child_process";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

const BASE_SHA = process.env.BASE_SHA;
if (!BASE_SHA) {
  console.error("db-change-detect: BASE_SHA env not provided.");
  process.exit(1);
}

// Ensure we have the base commit locally; fetch if needed (handles forks)
try {
  sh(`git cat-file -e ${BASE_SHA}^{commit}`);
} catch {
  // Fetch from the default origin; checkout sets remote for base repo
  // This is safe even for forks with fetch-depth=0
  sh(`git fetch --no-tags --prune --depth=1 origin ${BASE_SHA}`);
}

// Diff base..HEAD (two dots = changes introduced by this PR)
const diff = sh(`git diff --name-only ${BASE_SHA}..HEAD`)
  .split("\n")
  .filter(Boolean);

// App/DB-touching paths
const touchesAppDb = diff.some((p) =>
  p.startsWith("src/") ||
  p.startsWith("web/") ||
  p.startsWith("db/") ||
  p.startsWith("supabase/schema_inferred.sql")
);

// Migration present?
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