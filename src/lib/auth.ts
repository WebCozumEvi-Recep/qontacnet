import { prisma } from "@/lib/prisma";
import { getSession, type Role } from "@/lib/session";

// passwordHash'i çıkararak güvenli kullanıcı kaydını döner
function strip<T extends { passwordHash?: string }>(obj: T | null) {
  if (!obj) return null;
  const { passwordHash, ...rest } = obj;
  void passwordHash;
  return rest;
}

export async function getCurrentUser(): Promise<
  { id: string; role: Role; email: string; data: Record<string, unknown> } | null
> {
  const session = await getSession();
  if (!session) return null;

  let data: Record<string, unknown> | null = null;
  if (session.role === "uye") {
    data = strip(await prisma.member.findUnique({ where: { id: session.sub } }));
  } else if (session.role === "firma") {
    data = strip(await prisma.firma.findUnique({ where: { id: session.sub } }));
  } else if (session.role === "admin") {
    data = strip(await prisma.admin.findUnique({ where: { id: session.sub } }));
  }

  if (!data) return null;
  return { id: session.sub, role: session.role, email: session.email, data };
}

// Belirli rolü zorunlu kılan koruma — API route'larda kullanılır
export async function requireRole(role: Role) {
  const session = await getSession();
  if (!session || session.role !== role) return null;
  return session;
}
