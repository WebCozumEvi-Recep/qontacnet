import { prisma } from "@/lib/prisma";

type Sablon = { id: string; aktif: boolean };

/**
 * Her şablon için o şablonu kullanan üye sayısını hesaplar.
 * - templateId'si o şablona eşit olan üyeler sayılır.
 * - Varsayılan (aktif) şablona ayrıca templateId'si null olan üyeler eklenir
 *   (çünkü şablon seçmemiş üyeler firmanın varsayılan şablonunu kullanır).
 */
export async function sablonKullananSayilari<T extends Sablon>(
  firmaId: string,
  templates: T[],
): Promise<(T & { memberCount: number })[]> {
  const grouped = await prisma.member.groupBy({
    by: ["templateId"],
    where: { firmaId },
    _count: { _all: true },
  });

  const countByTid = new Map<string | null, number>(
    grouped.map((g) => [g.templateId, g._count._all]),
  );
  const nullCount = countByTid.get(null) ?? 0;

  return templates.map((t) => ({
    ...t,
    memberCount: (countByTid.get(t.id) ?? 0) + (t.aktif ? nullCount : 0),
  }));
}
