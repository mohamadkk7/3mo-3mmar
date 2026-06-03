import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "factory_session";
const SESSION_DAYS = 30;
const STATIC_USER_ID = "owner";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET غير مُعرّف أو قصير جداً في ملف .env");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  email: string;
};

export function getConfiguredLogin() {
  return {
    email: (process.env.SEED_EMAIL || "test@test.com").trim().toLowerCase(),
    password: process.env.SEED_PASSWORD || "test1234",
  };
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId === "string" && typeof payload.email === "string") {
      return { userId: payload.userId, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}

/** يرجع المستخدم الحالي أو null. التطبيق يستخدم حساباً ثابتاً من البيئة. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const configured = getConfiguredLogin();
  if (
    session.userId !== STATIC_USER_ID ||
    session.email.toLowerCase() !== configured.email
  ) {
    return null;
  }

  return { id: STATIC_USER_ID, email: configured.email };
}

export async function verifyCredentials(email: string, password: string) {
  const configured = getConfiguredLogin();
  if (email.trim().toLowerCase() !== configured.email) return null;
  if (password !== configured.password) return null;
  return { id: STATIC_USER_ID, email: configured.email };
}
