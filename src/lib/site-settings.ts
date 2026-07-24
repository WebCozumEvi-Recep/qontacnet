import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export const SITE_SETTINGS_TAG = "site-settings";

type SiteSettings = Awaited<ReturnType<typeof prisma.siteSettings.findUnique>>;

/**
 * Site ayarları (logo, favicon, kod enjeksiyonu, iletişim bilgileri).
 *
 * Ayarlar nadiren değişir ama neredeyse her sayfada okunur; her istekte DB'ye
 * gitmek TTFB'yi doğrudan veritabanına bağlıyordu. Burada önbelleğe alınır ve
 * admin panelinden kayıt yapıldığında {@link revalidateSiteSettings} ile
 * anında tazelenir.
 */
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      return await prisma.siteSettings.findUnique({ where: { id: "site" } });
    } catch {
      // DB erişilemezse sayfa yine de render edilsin
      return null;
    }
  },
  ["site-settings"],
  { tags: [SITE_SETTINGS_TAG], revalidate: 3600 },
);

/**
 * Admin ayar kaydından sonra çağrılır; önbelleği anında geçersiz kılar.
 *
 * `expire: 0` seçilir çünkü admin kaydettiği değişikliği hemen görmeli —
 * varsayılan "max" profili bir istek boyunca eski içeriği servis ederdi.
 * (`updateTag` daha doğrudan olurdu ama yalnız Server Action içinde çalışır.)
 */
export function revalidateSiteSettings(): void {
  revalidateTag(SITE_SETTINGS_TAG, { expire: 0 });
}
