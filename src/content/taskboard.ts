export const REPO = "https://github.com/solomonpromise/taskboard";
export function repoUrl(path: string) {
  if (!path) return REPO;
  const isFile = /\.[a-z0-9]+$/i.test(path.split("/").pop() ?? "") || path === "Makefile" || path === "Dockerfile";
  return `${REPO}/${isFile ? "blob" : "tree"}/main/${path}`;
}
export type RepoLink = { label: string; path: string };
const L = (path: string, label = path) => ({ label, path });

/** Where each lesson lives in the Taskboard repository (from docs/book-map.md). */
export const lessonRepo: Record<number, { note: string; links: RepoLink[] }> = {
  1: { note: "The whole app: interface, logic and data.", links: [L("frontend"), L("backend/app/services"), L("backend/app/models.py")] },
  2: { note: "A hosted web app, plus a no-screen scheduled job.", links: [L("backend/app/jobs")] },
  3: { note: "Problem, users, scope and acceptance criteria.", links: [L("docs/brief.md")] },
  4: { note: "Each commit is one planned, tested, released increment.", links: [{ label: "Commit history", path: "../commits/main" }] },
  5: { note: "Real functions such as is_overdue.", links: [L("backend/app/services/dates.py"), L("backend/app/services/tasks.py")] },
  6: { note: "The task page's four screen states and its components.", links: [L("frontend/src/pages/TasksPage.tsx"), L("frontend/src/components/TaskRow.tsx"), L("frontend/src/components/TaskForm.tsx")] },
  7: { note: "Routes → services → repositories; deps.py identifies the user.", links: [L("backend/app/routes"), L("backend/app/services"), L("backend/app/repositories"), L("backend/app/deps.py")] },
  8: { note: "The API contract and the client that calls it.", links: [L("docs/api.md"), L("frontend/src/api/client.ts")] },
  9: { note: "SQLite locally, PostgreSQL via Docker.", links: [L("backend/app/models.py"), L("backend/app/db.py")] },
  10: { note: "Models, migrations, constraints and the owner index.", links: [L("backend/app/models.py"), L("backend/migrations/versions")] },
  11: { note: "Password hashing, cookies, guess limiting, CSRF and tests.", links: [L("backend/app/security.py"), L("backend/app/deps.py"), L("tests/test_auth.py")] },
  12: { note: "Component and sequence diagrams of real actions.", links: [L("docs/architecture.md")] },
  13: { note: "The repository's layout.", links: [L("README.md")] },
  14: { note: "This Git repository and its history.", links: [L("", "Repository home"), { label: "Commit history", path: "../commits/main" }] },
  15: { note: "Small commits and a pull request template.", links: [L(".github/pull_request_template.md")] },
  16: { note: "Commands, pinned versions and lockfiles.", links: [L("Makefile"), L("backend/requirements.txt"), L("frontend/package-lock.json"), L(".nvmrc"), L(".python-version")] },
  17: { note: "Example settings, config loading and ignored files.", links: [L("backend/.env.example"), L("backend/app/config.py"), L(".gitignore")] },
  18: { note: "README, AI instructions, docs and decision records.", links: [L("README.md"), L("AGENTS.md"), L("docs"), L("docs/decisions")] },
  19: { note: "Requirements turned into a design.", links: [L("docs/design.md")] },
  20: { note: "A modular monolith with layers.", links: [L("docs/decisions/002-modular-monolith.md")] },
  21: { note: "Why FastAPI, and which database.", links: [L("docs/decisions/003-fastapi.md"), L("docs/decisions/004-database.md")] },
  22: { note: "Idempotency keys, email adapter and outbox.", links: [L("backend/app/routes/tasks.py"), L("backend/app/notifications"), L("backend/app/jobs")] },
  23: { note: "Trust boundaries and recorded technical debt.", links: [L("docs/architecture.md"), L("docs/debt.md")] },
  24: { note: "Instructions written for AI tools.", links: [L("AGENTS.md"), L("docs/templates.md")] },
  25: { note: "The task format for AI tools.", links: [L("docs/templates.md"), L("AGENTS.md")] },
  26: { note: "skeleton → data → auth → tasks → labels → reminders → frontend.", links: [{ label: "Commit history", path: "../commits/main" }] },
  27: { note: "The pull request review checklist.", links: [L(".github/pull_request_template.md")] },
  28: { note: "Unit, API, permission and migration tests.", links: [L("tests"), L("frontend/src/lib/dates.test.ts")] },
  29: { note: "The time-zone rule, its tests and request-ID logs.", links: [L("tests/test_dates.py"), L("backend/app/logging_setup.py")] },
  30: { note: "Container build, compose file and runbook.", links: [L("Dockerfile"), L("docker-compose.yml"), L("docs/runbook.md")] },
  31: { note: "CI pipeline, smoke test, migrations before start.", links: [L(".github/workflows/ci.yml"), L("scripts/smoke_test.py")] },
  32: { note: "Health endpoint and JSON logs with request IDs.", links: [L("backend/app/routes/health.py"), L("backend/app/logging_setup.py")] },
  33: { note: "Backups and restore steps.", links: [L("scripts/backup.sh"), L("docs/runbook.md")] },
  34: { note: "The maintenance guide.", links: [L("docs/maintenance.md")] },
};
export function linkHref(l: RepoLink) {
  return l.path.startsWith("../") ? `${REPO}/${l.path.slice(3)}` : repoUrl(l.path);
}
