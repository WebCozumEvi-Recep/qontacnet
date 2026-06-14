import { getLocale } from "@/lib/i18n/server";
import { tx } from "@/lib/i18n/auto";

const benefits = [
  {
    icon: "branding_watermark",
    title: "Marka Standardı",
    desc: "Tüm üyelerinizin profil tasarımı sizin kurumsal kimliğinize %100 sadık kalır.",
  },
  {
    icon: "rule_folder",
    title: "Kontrollü İçerik",
    desc: "Üyelerin paylaştığı ürün bilgilerini ve fiyatları tek bir panelden yönetin.",
  },
  {
    icon: "verified_user",
    title: "Üye Aktivasyonu",
    desc: "Üyelerinizin sahaya çıkış hızını artırın ve profil onaylarını yönetin.",
  },
  {
    icon: "campaign",
    title: "Kampanya Yayını",
    desc: "Yeni bir kampanya mı var? Tek tıkla binlerce üye sayfasında aynı anda yayınlayın.",
  },
  {
    icon: "query_stats",
    title: "Lead Takibi",
    desc: "Üye sayfalarından gelen tüm müşteri taleplerini genel havuzda izleyin.",
  },
  {
    icon: "support_agent",
    title: "Satış Desteği",
    desc: "Üyelerinize profesyonel dijital araçlar sunarak satış motivasyonlarını artırın.",
  },
];

export default async function ForFirms() {
  const locale = await getLocale();
  const ui = await tx(
    {
      title: "Firmalar İçin Güçlü Avantajlar",
      sub: "Network organizasyonunuzu veriye dayalı yönetin, kontrolü elinize alın.",
      cta: "Firma Demo Talep Et",
    },
    locale,
  );
  const items = await Promise.all(
    benefits.map(async (b) => ({ ...b, ...(await tx({ title: b.title, desc: b.desc }, locale)) })),
  );
  return (
    <section id="firmalar" className="py-xl">
      <div className="max-w-container-max mx-auto px-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-md mb-xl">
          <div className="max-w-[36rem]">
            <h2
              className="text-headline-md md:text-display-lg font-bold mb-4 text-on-background"
              style={{ fontFamily: "Sora, sans-serif", lineHeight: 1.2 }}
            >
              {ui.title}
            </h2>
            <p className="text-on-surface-variant text-body-md">
              {ui.sub}
            </p>
          </div>
          <a
            href="#demo"
            className="bg-primary text-black font-bold px-8 py-3 rounded-xl hover:scale-105 transition-all whitespace-nowrap"
          >
            {ui.cta}
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-md">
          {items.map((b) => (
            <div
              key={b.title}
              className="glass-card p-md rounded-2xl hover:bg-primary/5 transition-all"
            >
              <span className="material-symbols-outlined text-primary text-4xl mb-sm block">{b.icon}</span>
              <h4
                className="text-headline-sm font-semibold mb-xs text-on-surface"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {b.title}
              </h4>
              <p className="text-on-surface-variant text-sm">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
