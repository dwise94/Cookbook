import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  const cookbook = await prisma.cookbook.findUnique({
    where: { id },
    select: { id: true, contributeToken: true },
  });
  if (!cookbook) {
    return NextResponse.json({ error: "Cookbook not found." }, { status: 404 });
  }
  if (!token || cookbook.contributeToken !== token) {
    return NextResponse.json({ error: "Invalid contribute link." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
