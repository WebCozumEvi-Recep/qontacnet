import { prisma } from "@/lib/prisma";

type Okunan = { data: { ad?: string; soyad?: string; email?: string; telefon?: string; unvan?: string; firmaId?: string | null } };

// Admin üye formundan gelen ortak alanları doğrular (ekleme ve düzenleme).
// Yalnız gövdede bulunan alanlar döner; e-posta benzersizliği ve firma varlığı kontrol edilir.
export async function uyeAlanlariniOku(
  body: Record<string, unknown>,
  { mevcutId, zorunlu = false }: { mevcutId?: string; zorunlu?: boolean },
): Promise<Okunan | { hata: string }> {
  const data: Okunan["data"] = {};
  const metin = (k: string, max: number) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : undefined);

  const ad = metin("ad", 100);
  if (ad !== undefined || zorunlu) {
    if (!ad) return { hata: "Ad zorunludur." };
    data.ad = ad;
  }
  const soyad = metin("soyad", 100);
  if (soyad !== undefined) data.soyad = soyad;
  const telefon = metin("telefon", 50);
  if (telefon !== undefined) data.telefon = telefon;
  const unvan = metin("unvan", 150);
  if (unvan !== undefined) data.unvan = unvan;

  const email = metin("email", 200)?.toLowerCase();
  if (email !== undefined || zorunlu) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { hata: "Geçerli bir e-posta girin." };
    const sahibi = await prisma.member.findUnique({ where: { email }, select: { id: true } });
    if (sahibi && sahibi.id !== mevcutId) return { hata: "Bu e-posta başka bir üyede kayıtlı." };
    data.email = email;
  }

  if ("firmaId" in body) {
    const firmaId = typeof body.firmaId === "string" && body.firmaId ? body.firmaId : null;
    if (firmaId && !(await prisma.firma.findUnique({ where: { id: firmaId }, select: { id: true } }))) {
      return { hata: "Firma bulunamadı." };
    }
    data.firmaId = firmaId;
  }

  return { data };
}
