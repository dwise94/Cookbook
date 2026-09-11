import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setUserCookie } from "@/lib/auth";

const USERNAME_MAX = 80;

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
    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, passwordHash: true },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    await setUserCookie({ userId: user.id, username: user.username });

    return NextResponse.json({ id: user.id, username: user.username });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Login error:", err.message, err);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
