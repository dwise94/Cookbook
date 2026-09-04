import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "cookbook-dev-secret-change-in-production"
);
const ADMIN_COOKIE = "cookbook_admin";
const CREATOR_COOKIE = "cookbook_creator";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export async function createAdminToken(cookbookId: string): Promise<string> {
  return new SignJWT({ cookbookId, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<{ cookbookId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "admin" || typeof payload.cookbookId !== "string") return null;
    return { cookbookId: payload.cookbookId };
  } catch {
    return null;
  }
}

export async function setAdminCookie(cookbookId: string): Promise<void> {
  const token = await createAdminToken(cookbookId);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getAdminCookbookId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyAdminToken(token);
  return payload?.cookbookId ?? null;
}

export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export type CreatorPayload = { creatorUsername: string; cookbookIds: string[] };

export async function createCreatorToken(payload: CreatorPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyCreatorToken(token: string): Promise<CreatorPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof payload.creatorUsername !== "string" || !Array.isArray(payload.cookbookIds)) return null;
    return {
      creatorUsername: payload.creatorUsername,
      cookbookIds: payload.cookbookIds.filter((id): id is string => typeof id === "string"),
    };
  } catch {
    return null;
  }
}

export async function setCreatorCookie(payload: CreatorPayload): Promise<void> {
  const token = await createCreatorToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(CREATOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getCreatorPayload(): Promise<CreatorPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CREATOR_COOKIE)?.value;
  if (!token) return null;
  return verifyCreatorToken(token);
}

export async function clearCreatorCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CREATOR_COOKIE);
}
