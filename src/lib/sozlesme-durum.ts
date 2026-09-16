import "server-only";
import { prisma } from "@/lib/prisma";
import { SOZLESME, type SozlesmeSlug } from "@/lib/sozlesmeler";

export interface AktifSozlesme { slug: SozlesmeSlug; baslik: string; surum: string }

/** Satın almada kullanılan sözleşmelerden aktif olanlar (sürüm = son güncelleme zamanı). */
export async function aktifSozlesmeler(): Promise<Partial<Record<SozlesmeSlug, AktifSozlesme>>> {
  const sayfalar = await prisma.customPage.findMany({
    where: { slug: { in: Object.values(SOZLESME) }, aktif: true },
    select: { slug: true, baslik: true, updatedAt: true },
  });
  return Object.fromEntries(
    sayfalar.map(s => [s.slug, { slug: s.slug as SozlesmeSlug, baslik: s.baslik, surum: s.updatedAt.toISOString() }]),
  );
}
