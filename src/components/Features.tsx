import { getLocale } from "@/lib/i18n/server";
import { tx, txList } from "@/lib/i18n/auto";

const features = [
  { icon: "nfc", label: "NFC Desteği" },
  { icon: "qr_code_2", label: "Dinamik QR" },
  { icon: "dashboard_customize", label: "Firma Template" },
  { icon: "article", label: "Lead Formları" },
  { icon: "analytics", label: "Gelişmiş Analitik" },
  { icon: "language", label: "Çoklu Dil" },
  { icon: "contact_page", label: "VCF İndirme" },
  { icon: "share", label: "Sosyal Linkler" },
  { icon: "mail", label: "E-Posta Bildirimi" },
  { icon: "security", label: "KVKK Uyumlu" },
  { icon: "cloud_sync", label: "Anlık Senkronize" },
  { icon: "video_library", label: "Video Galeri" },
];

export default async function Features() {
  const locale = await getLocale();
  const ui = await tx({ title: "Profesyonel Özellikler" }, locale);
  const labels = await txList(features.map((f) => f.label), locale);
  const items = features.map((f, i) => ({ ...f, label: labels[i] }));
  return (
    <section id="ozellikler" className="py-xl bg-surface-container-lowest">
      <div className="max-w-container-max mx-auto px-10">
        <div className="text-center mb-xl">
          <h2
            className="text-headline-md md:text-display-lg font-bold text-on-background"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            {ui.title}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
          {items.map((f) => (
            <div
              key={f.label}
              className="glass-card p-sm rounded-xl flex items-center gap-xs group"
            >
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                {f.icon}
              </span>
              <span className="text-label-md text-on-surface">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
