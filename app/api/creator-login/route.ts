import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setCreatorCookie } from "@/lib/auth";

const USERNAME_MAX = 80;

export async function POST(request: Request) {
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

  const cookbooks = await prisma.cookbook.findMany({
    where: { creatorName: username },
    select: { id: true, name: true, passwordHash: true },
  });

  const matching: { id: string; name: string }[] = [];
  for (const c of cookbooks) {
    const ok = await verifyPassword(password, c.passwordHash);
    if (ok) matching.push({ id: c.id, name: c.name });
  }

  if (matching.length === 0) {
    return NextResponse.json(
      { error: "No cookbooks found with that username and password." },
      { status: 401 }
    );
  }

  await setCreatorCookie({
    creatorUsername: username,
    cookbookIds: matching.map((c) => c.id),
  });

  return NextResponse.json({
    cookbooks: matching.map((c) => ({ id: c.id, name: c.name })),
  });
}
