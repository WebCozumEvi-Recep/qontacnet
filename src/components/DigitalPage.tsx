const featureList = [
  "WhatsApp, Telegram ve Arama butonları",
  "Ürün ve servis listeleme modülleri",
  "Referans linkleri ve yeni üye kayıt formu",
  "Dinamik video ve doküman paylaşımı",
];

export default function DigitalPage() {
  return (
    <section className="py-xl bg-surface-container-high overflow-hidden">
      <div className="max-w-container-max mx-auto px-10 grid lg:grid-cols-2 gap-lg items-center">
        {/* Phone Mockup */}
        <div className="order-2 lg:order-1">
          <div className="relative mx-auto w-[320px] h-[640px] bg-black rounded-[3rem] border-[10px] border-surface-dim shadow-2xl overflow-hidden p-1">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />
            <div className="h-full w-full bg-surface-container-lowest overflow-y-auto pt-12 pb-8 px-4">
              {/* Profile */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 mb-4">
                  <div className="w-full h-full rounded-full bg-surface-dim flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-primary">person</span>
                  </div>
                </div>
                <h4 className="text-white font-bold text-xl">Ahmet Yılmaz</h4>
                <p className="text-primary text-sm">Üst Düzey Yönetici</p>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <div className="w-full p-4 glass-card rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-base">chat</span>
                  </div>
                  <span className="text-sm font-medium text-on-surface">WhatsApp İle İletişim</span>
                </div>
                <div className="w-full p-4 glass-card rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-base">shopping_bag</span>
                  </div>
                  <span className="text-sm font-medium text-on-surface">Ürün Kataloğu</span>
                </div>
                <div className="w-full p-4 glass-card rounded-2xl flex items-center gap-3 border-tertiary/30 bg-tertiary/5">
                  <div className="w-10 h-10 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                  </div>
                  <span className="text-sm font-medium text-on-surface">Hemen Üye Ol</span>
                </div>
                <div className="w-full p-4 glass-card rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-base">event</span>
                  </div>
                  <span className="text-sm font-medium text-on-surface">Randevu Al</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="order-1 lg:order-2 space-y-md">
          <h2
            className="text-headline-md md:text-display-lg font-bold text-on-background"
            style={{ fontFamily: "Sora, sans-serif", lineHeight: 1.2 }}
          >
            Kartvizitten fazlası:{" "}
            <span className="text-primary">kişisel satış sayfası</span>
          </h2>
          <p className="text-body-lg text-on-surface-variant leading-relaxed">
            Üyeleriniz artık sadece telefon numarası paylaşmıyor. Tek bir dokunuşla tüm iş
            dünyasını müşterilerine sunuyor.
          </p>
          <ul className="space-y-sm">
            {featureList.map((f) => (
              <li key={f} className="flex items-center gap-xs font-medium text-on-surface">
                <span className="material-symbols-outlined text-tertiary">check_circle</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
