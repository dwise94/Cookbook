import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setUserCookie } from "@/lib/auth";

const USERNAME_MAX = 80;
const PASSWORD_MIN = 6;

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }
    if (username.length > USERNAME_MAX) {
      return NextResponse.json({ error: "Username is too long." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores." },
        { status: 400 }
      );
    }
    if (password.length < PASSWORD_MIN) {
      return NextResponse.json(
        { error: `Password must be at least ${PASSWORD_MIN} characters.` },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, passwordHash },
      select: { id: true, username: true },
    });

    await setUserCookie({ userId: user.id, username: user.username });

    return NextResponse.json({ id: user.id, username: user.username });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Signup error:", err.message, err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
