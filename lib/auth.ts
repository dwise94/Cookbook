import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "cookbook-dev-secret-change-in-production"
);
const USER_COOKIE = "cookbook_user";

export type UserSession = { userId: string; username: string };

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashValue: string): Promise<boolean> {
  return compare(password, hashValue);
}

export async function createUserToken(payload: UserSession): Promise<string> {
  return new SignJWT({ userId: payload.userId, username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyUserToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof payload.userId !== "string" || typeof payload.username !== "string") return null;
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

export async function setUserCookie(payload: UserSession): Promise<void> {
  const token = await createUserToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_COOKIE)?.value;
  if (!token) return null;
  return verifyUserToken(token);
}

export async function clearUserCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE);
}

export function unauthorized(message = "You must be logged in.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "You do not have access to this cookbook.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function requireUser(): Promise<
  { user: UserSession } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { error: unauthorized() };
  return { user };
}

export async function getCookbookMembership(cookbookId: string, userId: string) {
  return prisma.cookbookMember.findUnique({
    where: { cookbookId_userId: { cookbookId, userId } },
    select: { id: true, role: true },
  });
}

export async function requireCookbookMember(cookbookId: string): Promise<
  | { user: UserSession; role: string }
  | { error: NextResponse }
> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const membership = await getCookbookMembership(cookbookId, auth.user.userId);
  if (!membership) return { error: forbidden() };
  return { user: auth.user, role: membership.role };
}

export async function requireCookbookOwner(cookbookId: string): Promise<
  | { user: UserSession }
  | { error: NextResponse }
> {
  const member = await requireCookbookMember(cookbookId);
  if ("error" in member) return member;
  if (member.role !== "owner") {
    return { error: forbidden("Only the cookbook owner can do that.") };
  }
  return { user: member.user };
}
