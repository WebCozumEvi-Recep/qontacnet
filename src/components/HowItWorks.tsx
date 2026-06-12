const steps = [
  {
    icon: "corporate_fare",
    title: "1. Firma Template Oluşturur",
    desc: "Merkezi panelden marka renklerinizi ve içerik yapınızı belirleyin.",
  },
  {
    icon: "contactless_off",
    title: "2. Üye Kartını Aktive Eder",
    desc: "Üye, kendisine verilen NFC kartı saniyeler içinde kendi profiliyle eşleştirir.",
  },
  {
    icon: "touch_app",
    title: "3. Kart Okutulur Sayfa Açılır",
    desc: "Müşteri dokunuşuyla etkileyici bir dijital tanıtım dünyasına giriş yapar.",
  },
];

export default function HowItWorks() {
  return (
    <section id="sistem" className="py-xl relative">
      <div className="max-w-container-max mx-auto px-10">
        <div className="text-center mb-xl">
          <span className="text-primary font-bold tracking-widest text-label-sm uppercase mb-4 block">
            Süreç
          </span>
          <h2
            className="text-headline-md md:text-display-lg font-bold text-on-background"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Sistem Nasıl Çalışır?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-lg relative">
          {/* Connector line */}
          <div className="absolute top-24 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent hidden md:block" />

          {steps.map((s) => (
            <div key={s.title} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full glass-card border-primary/50 flex items-center justify-center mb-md bg-surface-container shadow-[0_0_30px_rgba(212, 175, 55,0.2)]">
                <span className="material-symbols-outlined text-4xl text-primary">{s.icon}</span>
              </div>
              <h3
                className="text-headline-sm font-semibold mb-xs text-on-surface"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {s.title}
              </h3>
              <p className="text-on-surface-variant text-body-md">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
