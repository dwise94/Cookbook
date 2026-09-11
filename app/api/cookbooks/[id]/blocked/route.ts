import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCookbookOwner } from "@/lib/auth";

const NAME_MAX = 80;

function sanitize(s: string): string {
  return s.trim().slice(0, NAME_MAX);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cookbookId } = await params;
  const auth = await requireCookbookOwner(cookbookId);
  if ("error" in auth) return auth.error;

  const list = await prisma.blockedSubmitter.findMany({
    where: { cookbookId },
    orderBy: { createdAt: "desc" },
    select: { id: true, submitterName: true, createdAt: true },
  });
  return NextResponse.json({ blocked: list });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cookbookId } = await params;
  const auth = await requireCookbookOwner(cookbookId);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const submitterName = sanitize(
    typeof (body as Record<string, unknown>).submitterName === "string"
      ? ((body as Record<string, unknown>).submitterName as string)
      : ""
  );
  if (!submitterName) {
    return NextResponse.json({ error: "Username to block is required." }, { status: 400 });
  }

  await prisma.blockedSubmitter.upsert({
    where: {
      cookbookId_submitterName: { cookbookId, submitterName },
    },
    create: { cookbookId, submitterName },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cookbookId } = await params;
  const auth = await requireCookbookOwner(cookbookId);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const submitterName = url.searchParams.get("submitterName");
  if (id) {
    await prisma.blockedSubmitter.deleteMany({
      where: { id, cookbookId },
    });
  } else if (submitterName) {
    const name = sanitize(submitterName);
    if (name) {
      await prisma.blockedSubmitter.deleteMany({
        where: { cookbookId, submitterName: name },
      });
    }
  } else {
    return NextResponse.json({ error: "Provide id or submitterName." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
