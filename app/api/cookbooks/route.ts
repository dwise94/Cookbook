import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { nanoid } from "nanoid";

const NAME_MAX = 100;
const CREATOR_NAME_MAX = 80;
const PASSWORD_MIN = 6;

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!username) {
      return NextResponse.json(
        { error: "Your username is required." },
        { status: 400 }
      );
    }
    if (username.length > CREATOR_NAME_MAX) {
      return NextResponse.json(
        { error: `Username must be at most ${CREATOR_NAME_MAX} characters.` },
        { status: 400 }
      );
    }
    if (password.length < PASSWORD_MIN) {
      return NextResponse.json(
        { error: `Password must be at least ${PASSWORD_MIN} characters.` },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: "Cookbook name is required." },
        { status: 400 }
      );
    }
    if (name.length > NAME_MAX) {
      return NextResponse.json(
        { error: `Cookbook name must be at most ${NAME_MAX} characters.` },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const id = nanoid(12);
    const contributeToken = nanoid(24);

    await prisma.cookbook.create({
      data: {
        id,
        name,
        creatorName: username,
        passwordHash,
        contributeToken,
      },
    });

    return NextResponse.json({ id, name, contributeToken });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Create cookbook error:", err.message, err);
    const message =
      process.env.NODE_ENV === "development"
        ? err.message
        : "Failed to create cookbook.";
    return NextResponse.json(
      { error: "Failed to create cookbook.", details: process.env.NODE_ENV === "development" ? err.message : undefined },
      { status: 500 }
    );
  }
}
