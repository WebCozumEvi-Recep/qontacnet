import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type Role = "uye" | "firma" | "admin";

export interface SessionPayload {
  sub: string; // kullanıcı id
  role: Role;
  email: string;
}

const COOKIE = "qontac_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 gün

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET tanımlı değil.");
  return new TextEncoder().encode(s);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      sub: payload.sub as string,
      role: payload.role as Role,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
