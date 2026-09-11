/**
 * Production schema sync for Vercel builds.
 * Set FORCE_DB_RESET=1 for a one-time wipe when the schema is incompatible
 * with existing rows (then remove the env var so future deploys keep data).
 */
const { execSync } = require("child_process");

const forceReset = process.env.FORCE_DB_RESET === "1";
const args = forceReset ? "db push --force-reset" : "db push";

if (forceReset) {
  console.warn(
    "FORCE_DB_RESET=1: resetting the database (all existing data will be deleted)."
  );
}

execSync(`npx prisma ${args}`, { stdio: "inherit", env: process.env });
