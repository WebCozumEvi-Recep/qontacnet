import { prisma } from "@/lib/prisma";

export async function getSiteSettings() {
  try {
    return await prisma.siteSettings.findUnique({ where: { id: "site" } });
  } catch {
    return null;
  }
}

export async function getAktifSayfalar() {
  try {
    return await prisma.customPage.findMany({
      where: { aktif: true },
      orderBy: [{ sira: "asc" }, { createdAt: "asc" }],
      select: { slug: true, baslik: true },
    });
  } catch {
    return [];
  }
}
