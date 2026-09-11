import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        cookbooks: [],
        username: null,
      });
    }

    const memberships = await prisma.cookbookMember.findMany({
      where: { userId: user.userId },
      select: {
        role: true,
        cookbook: {
          select: {
            id: true,
            name: true,
            _count: { select: { recipes: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      username: user.username,
      cookbooks: memberships.map((m) => ({
        id: m.cookbook.id,
        name: m.cookbook.name,
        recipeCount: m.cookbook._count.recipes,
        role: m.role,
      })),
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("My cookbooks error:", err.message, err);
    return NextResponse.json(
      {
        error: "Failed to load cookbooks.",
        details: process.env.NODE_ENV === "development" ? err.message : undefined,
        cookbooks: [],
        username: null,
      },
      { status: 500 }
    );
  }
}
