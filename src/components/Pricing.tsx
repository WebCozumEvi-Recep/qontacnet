const plans = [
  {
    name: "Başlangıç",
    desc: "Butik network ekipleri için ideal",
    features: ["50 Üyeye Kadar", "1 Firma Template", "Temel Analizler"],
    popular: false,
    btnLabel: "İletişime Geç",
    btnStyle: "glass-card hover:bg-white/10",
  },
  {
    name: "Profesyonel",
    desc: "Büyüyen organizasyonlar için",
    features: [
      "500 Üyeye Kadar",
      "3 Firma Template",
      "Gelişmiş Lead Yönetimi",
      "Marka Özelleştirme",
    ],
    popular: true,
    btnLabel: "Teklif Al",
    btnStyle: "bg-primary text-black hover:shadow-[0_0_20px_rgba(212, 175, 55,0.4)]",
  },
  {
    name: "Kurumsal",
    desc: "Global devler için özel çözüm",
    features: ["Sınırsız Üye", "API Entegrasyonu", "Dedicated Panel"],
    popular: false,
    btnLabel: "Bize Ulaşın",
    btnStyle: "glass-card hover:bg-white/10",
  },
];

export default function Pricing() {
  return (
    <section id="paketler" className="py-xl">
      <div className="max-w-container-max mx-auto px-10">
        <div className="text-center mb-xl">
          <h2
            className="text-headline-md md:text-display-lg font-bold text-on-background"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Size Uygun Paketi Seçin
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-lg">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`glass-card p-lg rounded-[2rem] flex flex-col items-center text-center relative ${
                p.popular ? "border-primary/40 bg-primary/5 scale-105" : "border-white/5"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-4 bg-primary text-black text-xs font-bold px-4 py-1 rounded-full">
                  EN ÇOK TERCİH EDİLEN
                </div>
              )}

              <span
                className="text-headline-sm font-semibold mb-xs text-on-surface block"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {p.name}
              </span>
              <p className="text-on-surface-variant mb-md text-sm">{p.desc}</p>
              <div
                className="text-headline-md font-bold mb-lg text-on-surface"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                TEKLİF AL
              </div>

              <ul className="space-y-sm mb-lg w-full text-left">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="material-symbols-outlined text-tertiary text-base">check</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#demo"
                className={`w-full py-4 rounded-xl font-bold transition-all text-center block ${p.btnStyle}`}
              >
                {p.btnLabel}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
