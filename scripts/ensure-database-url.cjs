/**
 * Ensures DATABASE_URL exists for Prisma CLI (generate / db push).
 * Vercel Postgres often only injects POSTGRES_PRISMA_URL / POSTGRES_URL.
 */
const fs = require("fs");
const path = require("path");

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (!url) {
  console.error(
    "Missing database URL. Set DATABASE_URL, or connect Vercel Postgres (POSTGRES_PRISMA_URL)."
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  // Prisma CLI reads DATABASE_URL from the environment or a local .env file.
  const envPath = path.join(process.cwd(), ".env");
  fs.writeFileSync(envPath, `DATABASE_URL="${url.replace(/"/g, '\\"')}"\n`);
  console.log("Wrote DATABASE_URL from POSTGRES_* for Prisma CLI.");
} else {
  console.log("DATABASE_URL is set.");
}
