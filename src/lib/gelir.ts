import { prisma } from "@/lib/prisma";

const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

// Gelir sayılan siparişler: ödemesi alınmış site siparişleri ve admin'in elle
// girdiği siparişler; iptaller hariç.
export const GELIR_SIPARIS = { odemeDurum: { in: ["ODENDI", "MANUEL"] }, durum: { not: "IPTAL" as const } };

export interface AylikGelir { ay: string; yil: number; tutar: number; siparis: number; adet: number; referansli: number }

// Son 12 ayın (bu ay dahil) sipariş geliri — firmalar aracı olduğu için gelir
// paket ücretinden değil satışlardan gelir.
export async function aylikGelir(): Promise<AylikGelir[]> {
  const simdi = new Date();
  const baslangic = new Date(simdi.getFullYear(), simdi.getMonth() - 11, 1);
  const siparisler = await prisma.order.findMany({
    where: { ...GELIR_SIPARIS, createdAt: { gte: baslangic } },
    select: { tutar: true, adet: true, firmaId: true, createdAt: true },
  });

  const aylar: AylikGelir[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(baslangic.getFullYear(), baslangic.getMonth() + i, 1);
    return { ay: AYLAR[d.getMonth()], yil: d.getFullYear(), tutar: 0, siparis: 0, adet: 0, referansli: 0 };
  });
  for (const s of siparisler) {
    const i = (s.createdAt.getFullYear() - baslangic.getFullYear()) * 12 + s.createdAt.getMonth() - baslangic.getMonth();
    const a = aylar[i];
    if (!a) continue;
    a.tutar += s.tutar;
    a.siparis += 1;
    a.adet += s.adet;
    if (s.firmaId) a.referansli += s.tutar;
  }
  return aylar;
}
