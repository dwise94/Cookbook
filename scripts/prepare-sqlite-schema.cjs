/**
 * Builds prisma/schema.sqlite.prisma from schema.prisma for local file-DB (SQLite).
 * Production keeps schema.prisma on PostgreSQL for Vercel.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "prisma", "schema.prisma");
const targetPath = path.join(root, "prisma", "schema.sqlite.prisma");

const source = fs.readFileSync(sourcePath, "utf8");
if (!source.includes('provider = "postgresql"')) {
  console.error('Expected prisma/schema.prisma to use provider = "postgresql".');
  process.exit(1);
}

const sqliteSchema = source.replace(
  'provider = "postgresql"',
  'provider = "sqlite"'
);

fs.writeFileSync(targetPath, sqliteSchema);
console.log("Prepared prisma/schema.sqlite.prisma for local SQLite.");
