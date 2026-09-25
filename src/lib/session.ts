import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type Role = "uye" | "firma" | "admin";

export interface SessionPayload {
  sub: string; // kullanıcı id
  role: Role;
  email: string;
}

const COOKIE = "qontac_session";
// Admin bir üyenin hesabına geçtiğinde kendi oturum jetonu burada saklanır; "Admin'e dön" ile geri yüklenir.
const ADMIN_DONUS_COOKIE = "qontac_admin_donus";
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
  store.delete(ADMIN_DONUS_COOKIE);
}

function cookieAyar(maxAge: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge };
}

/** Mevcut admin oturumunu saklayıp verilen üyenin oturumunu açar. */
export async function uyeOlarakGir(uye: { id: string; email: string }) {
  const store = await cookies();
  const adminToken = store.get(COOKIE)?.value;
  if (adminToken) store.set(ADMIN_DONUS_COOKIE, adminToken, cookieAyar(60 * 60 * 8));
  await createSession({ sub: uye.id, role: "uye", email: uye.email });
}

/** Admin başka bir hesaba geçmiş mi? (saklanan jeton geçerli bir admin oturumu olmalı) */
export async function adminDonusJetonu(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ADMIN_DONUS_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin" ? token : null;
  } catch {
    return null;
  }
}

/** Saklanan admin oturumunu geri yükler. Başarılıysa true. */
export async function adminOturumunaDon(): Promise<boolean> {
  const token = await adminDonusJetonu();
  const store = await cookies();
  store.delete(ADMIN_DONUS_COOKIE);
  if (!token) return false;
  store.set(COOKIE, token, cookieAyar(MAX_AGE));
  return true;
}
