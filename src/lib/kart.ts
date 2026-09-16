import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// Sıradaki satış seri numarası: QNT-<yıl>-<4 hane>. En büyük mevcut numaraya
// dayanır, silinen kartlar çakışma yaratmaz.
async function sonrakiSeriNo(): Promise<string> {
  const yil = new Date().getFullYear();
  const rows = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(split_part("seriNo", '-', 3) AS INTEGER)) AS max
    FROM "PhysicalCard"
    WHERE "seriNo" LIKE ${`QNT-${yil}-%`} AND split_part("seriNo", '-', 3) ~ '^[0-9]+$'`;
  return `QNT-${yil}-${String((rows[0]?.max ?? 0) + 1).padStart(4, "0")}`;
}

/** "YYYY-AA-GG" ya da ISO tarih → Date; boş/geçersizse şimdi. Gün başlangıcı Türkiye saatiyle alınır. */
export function baslangicTarihi(deger: unknown): Date {
  if (typeof deger === "string" && /^\d{4}-\d{2}-\d{2}$/.test(deger)) {
    const t = new Date(`${deger}T00:00:00+03:00`);
    if (!isNaN(t.getTime())) return t;
  }
  return new Date();
}

export interface KartOlusturGirdi {
  firmaId?: string | null;
  orderId?: string | null;
  notlar?: string;
}

// Satış yapıldıkça tek kart açar. Seri no yarışında (aynı anda iki istek)
// benzersizlik hatası alınırsa birkaç kez yeniden dener.
export async function kartOlustur(g: KartOlusturGirdi) {
  for (let deneme = 0; deneme < 5; deneme++) {
    try {
      return await prisma.physicalCard.create({
        data: {
          seriNo: await sonrakiSeriNo(),
          token: randomBytes(12).toString("base64url"),
          firmaId: g.firmaId || null,
          orderId: g.orderId || null,
          notlar: (g.notlar ?? "").slice(0, 500),
        },
      });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002" || deneme === 4) throw e;
    }
  }
  throw new Error("Kart oluşturulamadı.");
}
