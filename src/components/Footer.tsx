import Link from "next/link";
import { getSiteSettings, getAktifSayfalar } from "@/lib/site";

const SOSYAL: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "sosyalLinkedin", label: "LinkedIn", icon: <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" /> },
  { key: "sosyalInstagram", label: "Instagram", icon: <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" /> },
  { key: "sosyalX", label: "X", icon: <path d="M18.9 1.1h3.7l-8 9.2 9.4 12.5h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.1h7.6l5.2 6.9 6.1-6.9m-1.3 19.5h2L6.5 3.2H4.4l13.2 17.4Z" /> },
  { key: "sosyalFacebook", label: "Facebook", icon: <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" /> },
  { key: "sosyalYoutube", label: "YouTube", icon: <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73Z" /> },
  { key: "sosyalWebsite", label: "Web", icon: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m6.93 6h-2.95a15.7 15.7 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8M12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96M4.26 14a7.82 7.82 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26m.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16m2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.7 15.7 0 0 0 8.03 8M12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96M14.34 14H9.66a14.4 14.4 0 0 1 0-4h4.68a14.4 14.4 0 0 1 0 4m.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a7.99 7.99 0 0 1-4.33 3.56M16.36 14a16.5 16.5 0 0 0 0-4h3.38a7.82 7.82 0 0 1 0 4h-3.38Z" /> },
];

export default async function Footer() {
  const [s, sayfalar] = await Promise.all([getSiteSettings(), getAktifSayfalar()]);

  const logoUrl = s?.logoUrl || "";
  const logoText = s?.logoText || "QONTAC";
  const aciklama = s?.iletisimAciklama || "Geleceğin networking dünyasında yerinizi alın. Dijital, akıllı ve prestijli.";
  const firmaUnvan = "WAQUR TEKNOLOJİ TARIM MADENCİLİK SAN. VE TİC. LTD. ŞTİ.";
  const email = s?.iletisimEmail || "info@qontac.net";
  const telefon = s?.iletisimTelefon || "+90 850 302 40 04";
  const adres = s?.iletisimAdres || "Çakmak Mh. Alemdağ Cd. No:488/3 Ümraniye / İstanbul";
  const sRec = (s ?? {}) as unknown as Record<string, string>;
  const sosyal = SOSYAL.filter(x => sRec[x.key]);

  return (
    <footer id="iletisim" className="bg-surface-container-lowest w-full py-xl border-t border-white/5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md px-6 md:px-10 max-w-container-max mx-auto">
        {/* Brand */}
        <div className="col-span-1 space-y-md">
          <div className="flex items-center gap-xs">
            {logoUrl ? (
              <img src={logoUrl} alt={logoText} className="h-9 max-w-[170px] object-contain" />
            ) : (
              <span className="text-headline-sm font-bold text-primary" style={{ fontFamily: "Sora, sans-serif" }}>{logoText}</span>
            )}
          </div>
          <p className="text-body-md text-on-surface-variant text-sm">{aciklama}</p>
          {sosyal.length > 0 && (
            <div className="flex gap-sm flex-wrap">
              {sosyal.map(x => (
                <a key={x.key} href={sRec[x.key]} target="_blank" rel="noopener noreferrer" title={x.label}
                  className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:text-primary transition-all text-on-surface-variant">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">{x.icon}</svg>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Kurumsal — admin'den yönetilen özel sayfalar (yoksa gizle) */}
        {sayfalar.length > 0 && (
          <div>
            <h5 className="text-headline-sm text-sm mb-md text-white font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>
              Kurumsal
            </h5>
            <ul className="space-y-sm text-body-md text-on-surface-variant text-sm">
              {sayfalar.map((p) => (
                <li key={p.slug}>
                  <Link href={`/sayfa/${p.slug}`} className="hover:text-primary transition-colors">{p.baslik}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* İletişim — admin'den yönetilir */}
        <div>
          <h5 className="text-headline-sm text-sm mb-md text-white font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>
            İletişim
          </h5>
          <ul className="space-y-sm text-body-md text-on-surface-variant text-sm">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-base">business</span>
              <span className="font-semibold text-white/90">{firmaUnvan}</span>
            </li>
            {email && (
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-base">mail</span>
                <a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a>
              </li>
            )}
            {telefon && (
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-base">phone</span>
                <a href={`tel:${telefon.replace(/[^\d+]/g, "")}`} className="hover:text-primary transition-colors">{telefon}</a>
              </li>
            )}
            {adres && (
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-base">location_on</span>
                {adres}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-container-max mx-auto px-6 md:px-10 pt-lg mt-lg border-t border-white/5 text-center">
        <p className="text-label-sm text-on-surface-variant">
          © {new Date().getFullYear()} {logoText} Network. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
