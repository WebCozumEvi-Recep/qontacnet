import { prisma } from "@/lib/prisma";

// Benzersiz, artan sipariş numarası üretir: SIP-<yıl>-<sayı>.
// Kayıt sayısına değil mevcut en büyük numaraya dayanır — silinen
// siparişler numara çakışmasına yol açmaz.
export async function nextSiparisNo(): Promise<string> {
  const yil = new Date().getFullYear();
  const rows = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(split_part("siparisNo", '-', 3) AS INTEGER)) AS max
    FROM "Order"
    WHERE "siparisNo" LIKE ${`SIP-${yil}-%`} AND split_part("siparisNo", '-', 3) ~ '^[0-9]+$'`;
  const lastNum = rows[0]?.max ?? 1300;
  return `SIP-${yil}-${lastNum + 1}`;
}
