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
          <div className="relative mx-auto w-[320px] h-[640px] rounded-[3rem] border-[10px] border-surface-dim shadow-2xl overflow-hidden p-1" style={{ background: "#000" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />
            <div className="h-full w-full overflow-y-auto pt-10 pb-8 px-4" style={{ background: "#050816" }}>
              {/* Profil kutusu */}
              <div className="relative rounded-[1.75rem] p-5 mb-4 text-center overflow-hidden glass-card">
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(212,175,55,0.18) 0%, transparent 60%)" }} />
                <div className="relative z-10 inline-block mb-3">
                  <div className="w-20 h-20 rounded-full border-4 overflow-hidden flex items-center justify-center mx-auto" style={{ borderColor: "rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.12)" }}>
                    <span className="material-symbols-outlined text-4xl text-primary">person</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-surface-dim flex items-center justify-center" style={{ background: "#d4af37" }}>
                    <span className="material-symbols-outlined text-[13px] text-black">verified</span>
                  </div>
                </div>
                <div className="relative z-10">
                  <h4 className="text-white font-bold text-lg" style={{ fontFamily: "Sora, sans-serif" }}>Ahmet Yılmaz</h4>
                  <p className="text-primary text-sm font-medium">Üst Düzey Yönetici</p>
                  <p className="text-xs text-on-surface-variant">Qontac Network</p>
                </div>
              </div>

              {/* Yuvarlak ikon grid — aksiyonlar + üye modülleri */}
              <div className="grid grid-cols-4 gap-x-3 gap-y-4 justify-items-center mb-5 px-1">
                {[
                  { icon: "person_add", bg: "#d4af37", color: "#000" },
                  { icon: "call", bg: "#22c55e" },
                  { icon: "mail", bg: "#3b82f6" },
                  { icon: "chat", bg: "#16a34a" },
                  { icon: "shopping_bag", bg: "#8b5cf6" },
                  { icon: "photo_library", bg: "#ec4899" },
                  { icon: "play_circle", bg: "#ef4444" },
                  { icon: "link", bg: "#0ea5e9" },
                ].map((a, i) => (
                  <div key={i} className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: a.bg }}>
                    <span className="material-symbols-outlined text-lg" style={{ color: a.color ?? "#fff" }}>{a.icon}</span>
                  </div>
                ))}
              </div>

              {/* Firma modülü kartı */}
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-base">collections</span>
                  <span className="text-sm font-semibold text-on-surface">Öne Çıkan Ürünler</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/10" />
                  ))}
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
