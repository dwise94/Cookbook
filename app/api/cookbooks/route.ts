import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { nanoid } from "nanoid";

const NAME_MAX = 100;

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if ("error" in auth) return auth.error;

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Cookbook name is required." }, { status: 400 });
    }
    if (name.length > NAME_MAX) {
      return NextResponse.json(
        { error: `Cookbook name must be at most ${NAME_MAX} characters.` },
        { status: 400 }
      );
    }

    const id = nanoid(12);
    const inviteToken = nanoid(24);

    await prisma.cookbook.create({
      data: {
        id,
        name,
        ownerId: auth.user.userId,
        inviteToken,
        members: {
          create: {
            userId: auth.user.userId,
            role: "owner",
          },
        },
      },
    });

    return NextResponse.json({ id, name, inviteToken });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Create cookbook error:", err.message, err);
    const prismaCode =
      e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : undefined;
    return NextResponse.json(
      {
        error: "Failed to create cookbook.",
        details: err.message,
        code: prismaCode,
      },
      { status: 500 }
    );
  }
}
