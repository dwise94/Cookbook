import { NextResponse } from "next/server";
import { requireCookbookOwner } from "@/lib/auth";

/** Owner session check for manage page (replaces password admin cookie). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cookbookId } = await params;
  const auth = await requireCookbookOwner(cookbookId);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ ok: true, username: auth.user.username });
}

export async function DELETE() {
  return NextResponse.json({ ok: true });
}
