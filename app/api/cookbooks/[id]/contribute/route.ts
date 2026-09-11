import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Legacy contribute token check → maps to invite token. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cookbookId } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  const cookbook = await prisma.cookbook.findUnique({
    where: { id: cookbookId },
    select: { id: true, inviteToken: true },
  });
  if (!cookbook || !token || cookbook.inviteToken !== token) {
    return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
