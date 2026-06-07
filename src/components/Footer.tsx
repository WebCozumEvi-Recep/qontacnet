export default function Footer() {
  return (
    <footer id="iletisim" className="bg-surface-container-lowest w-full py-xl border-t border-white/5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md px-10 max-w-container-max mx-auto">
        {/* Brand */}
        <div className="col-span-1 space-y-md">
          <div className="flex items-center gap-xs">
            <span
              className="text-headline-sm font-bold text-primary"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              QONTAC
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant text-sm">
            Geleceğin networking dünyasında yerinizi alın. Dijital, akıllı ve prestijli.
          </p>
          <div className="flex gap-sm">
            <a
              href="#"
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:text-primary transition-all text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-base">share</span>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:text-primary transition-all text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-base">public</span>
            </a>
          </div>
        </div>

        {/* Kurumsal */}
        <div>
          <h5 className="text-headline-sm text-sm mb-md text-white font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>
            Kurumsal
          </h5>
          <ul className="space-y-sm text-body-md text-on-surface-variant text-sm">
            {["Hakkımızda", "KVKK", "Gizlilik Politikası", "Kullanım Koşulları"].map((l) => (
              <li key={l}>
                <a href="#" className="hover:text-primary transition-colors">{l}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Sistem */}
        <div>
          <h5 className="text-headline-sm text-sm mb-md text-white font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>
            Sistem
          </h5>
          <ul className="space-y-sm text-body-md text-on-surface-variant text-sm">
            {["Firma Paneli", "Üye Girişi", "NFC Kart Siparişi", "Paketler"].map((l) => (
              <li key={l}>
                <a href="#" className="hover:text-primary transition-colors">{l}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* İletişim */}
        <div>
          <h5 className="text-headline-sm text-sm mb-md text-white font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>
            İletişim
          </h5>
          <ul className="space-y-sm text-body-md text-on-surface-variant text-sm">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-base">mail</span>
              info@qontac.net
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-base">phone</span>
              +90 (850) 302 40 04
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-base">location_on</span>
              Ümraniye, İstanbul / Türkiye
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-container-max mx-auto px-10 pt-lg mt-lg border-t border-white/5 text-center">
        <p className="text-label-sm text-on-surface-variant">
          © 2024 QONTAC Network. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
