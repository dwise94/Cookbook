/**
 * Copy the local Easy Bake Chicken recipe into production "Bois Cookbook".
 *
 * Option A — contribute link (preferred):
 *   node scripts/copy-dev-recipe-to-prod.mjs --contribute-url "https://.../cookbook/ID/contribute/TOKEN"
 *
 * Option B — production DATABASE_URL:
 *   set PRODUCTION_DATABASE_URL=postgresql://...
 *   node scripts/copy-dev-recipe-to-prod.mjs
 */
const { PrismaClient } = require("@prisma/client");
const { nanoid } = require("nanoid");

const RECIPE = {
  name: "Easy Bake Chicken",
  submitterName: "David",
  ingredients:
    "1 tbsp salt\n1 tbsp paprika\n1 tbsp garlic powder\n1 tbsp onion powder\nChicken breasts (thawed)",
  instructions: JSON.stringify([
    "Preheat oven to 360 degrees.",
    "Lay out chicken breasts on aluminum foil covered baking sheet.",
    "Combine all spices into small bowl or jar",
    "Cover chicken in olive oil (use vegetable oil if needed). I used a brush to do this and it worked great.",
    "Dip chicken in spice mixture, make sure to cover both sides.",
    "Place baking sheet in oven. Cook at 360 degrees for 25 mins. Make sure internal temperature of chicken is 165 degrees F.",
  ]),
};

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function viaContributeUrl(url) {
  const match = url.match(/\/cookbook\/([^/]+)\/contribute\/([^/?#]+)/);
  if (!match) {
    throw new Error("URL must look like /cookbook/[id]/contribute/[token]");
  }
  const [, cookbookId, contributeToken] = match;
  const origin = new URL(url).origin;
  const res = await fetch(`${origin}/api/cookbooks/${cookbookId}/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contributeToken,
      submitterName: RECIPE.submitterName,
      name: RECIPE.name,
      ingredients: RECIPE.ingredients,
      instructions: RECIPE.instructions,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.details || `HTTP ${res.status}`);
  }
  console.log("Added via contribute API:", data.id || data);
}

async function viaDatabaseUrl() {
  const url = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;
  if (!url || url.startsWith("file:")) {
    throw new Error(
      "Set PRODUCTION_DATABASE_URL to your Vercel Postgres connection string."
    );
  }
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const cookbooks = await prisma.cookbook.findMany({
      where: { name: { contains: "Bois", mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (cookbooks.length === 0) {
      const all = await prisma.cookbook.findMany({ select: { id: true, name: true } });
      throw new Error(
        `No cookbook matching "Bois". Found: ${all.map((c) => c.name).join(", ") || "(none)"}`
      );
    }
    if (cookbooks.length > 1) {
      console.log(
        "Multiple matches:",
        cookbooks.map((c) => c.name).join(", "),
        "— using first."
      );
    }
    const cookbook = cookbooks[0];
    const existing = await prisma.recipe.findFirst({
      where: { cookbookId: cookbook.id, name: RECIPE.name },
    });
    if (existing) {
      console.log(`"${RECIPE.name}" already exists in ${cookbook.name} (${existing.id}). Skipping.`);
      return;
    }
    const created = await prisma.recipe.create({
      data: {
        id: nanoid(12),
        cookbookId: cookbook.id,
        name: RECIPE.name,
        submitterName: RECIPE.submitterName,
        ingredients: RECIPE.ingredients,
        instructions: RECIPE.instructions,
        editToken: nanoid(32),
      },
    });
    console.log(`Added "${created.name}" to ${cookbook.name} (${created.id}).`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const contributeUrl = getArg("--contribute-url");
  if (contributeUrl) {
    await viaContributeUrl(contributeUrl);
    return;
  }
  await viaDatabaseUrl();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
