import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCreatorPayload } from "@/lib/auth";

export async function GET() {
  const payload = await getCreatorPayload();
  if (!payload || payload.cookbookIds.length === 0) {
    return NextResponse.json({ cookbooks: [], creatorUsername: payload?.creatorUsername ?? null });
  }

  const cookbooks = await prisma.cookbook.findMany({
    where: { id: { in: payload.cookbookIds } },
    select: { id: true, name: true, _count: { select: { recipes: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    creatorUsername: payload.creatorUsername,
    cookbooks: cookbooks.map((c) => ({
      id: c.id,
      name: c.name,
      recipeCount: c._count.recipes,
    })),
  });
}
