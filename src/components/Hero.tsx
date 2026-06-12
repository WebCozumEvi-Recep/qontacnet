export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden grid-pattern">
      {/* Right glow */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />

      <div className="max-w-container-max mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-lg items-center relative z-10 w-full py-10 md:py-16">
        {/* Left */}
        <div className="space-y-md">
          {/* Badge */}
          <div className="inline-flex items-center gap-xs px-4 py-2 rounded-full glass-card border border-primary/20 text-primary-fixed-dim text-label-sm font-semibold">
            <span className="flex h-2 w-2 rounded-full bg-primary pulse-dot" />
            Geleceğin Network Teknolojisi
          </div>

          <h1
            className="text-display-lg-mobile md:text-display-lg font-bold text-on-background max-w-[36rem] leading-tight tracking-tight"
            style={{ fontFamily: "Sora, sans-serif", letterSpacing: "-0.02em" }}
          >
            Network ekipleriniz için{" "}
            <span className="gradient-text">akıllı dijital kartvizit</span>{" "}
            sistemi
          </h1>

          <p className="text-body-lg text-on-surface-variant max-w-[32rem] leading-relaxed">
            QONTAC Network Card ile üyelerinize NFC ve QR destekli, firma onaylı,
            kişiselleştirilebilir dijital temsilci sayfaları sunun. Kurumsal kimliğinizi
            sahada tek merkezden yönetin.
          </p>

          <div className="flex flex-wrap gap-sm pt-xs">
            <a
              href="#demo"
              className="px-8 py-4 bg-primary-container text-on-primary-container font-bold rounded-xl hover:shadow-[0_0_20px_rgba(212, 175, 55,0.4)] transition-all flex items-center gap-2"
            >
              Demo Talep Et
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
            <a
              href="#sistem"
              className="px-8 py-4 glass-card text-on-surface font-medium rounded-xl hover:bg-white/10 transition-all"
            >
              Nasıl Çalışır?
            </a>
          </div>
        </div>

        {/* Right: Mockups */}
        <div className="relative h-[300px] sm:h-[400px] lg:h-[600px] flex items-center justify-center">
          {/* Background glow — sıcak altın tonu */}
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-amber-400/15 rounded-full blur-[100px] animate-pulse" />

          {/* NFC Card Mockup — premium siyah + altın */}
          <div className="absolute z-20 transform -rotate-12 hover:rotate-0 transition-transform duration-700 cursor-pointer">
            <div
              className="w-72 sm:w-80 h-44 sm:h-48 rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl overflow-hidden group relative"
              style={{
                background: "linear-gradient(145deg, #111014 0%, #1c1a17 55%, #0c0b0a 100%)",
                border: "1px solid rgba(212,175,55,0.35)",
              }}
            >
              <div className="absolute inset-0 shimmer opacity-20" />

              {/* Köşe altın çizgi süslemeleri */}
              <svg className="absolute -top-2 -left-2 w-24 h-24 opacity-60" viewBox="0 0 100 100" fill="none" stroke="url(#gold)" strokeWidth="0.8">
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#f5d77e" />
                    <stop offset="0.5" stopColor="#d4af37" />
                    <stop offset="1" stopColor="#9a7b22" />
                  </linearGradient>
                </defs>
                <path d="M0 38 A38 38 0 0 1 38 0" />
                <path d="M0 30 A30 30 0 0 1 30 0" />
                <path d="M0 22 A22 22 0 0 1 22 0" />
              </svg>
              <svg className="absolute -bottom-2 -right-2 w-24 h-24 opacity-60 rotate-180" viewBox="0 0 100 100" fill="none" stroke="url(#gold)" strokeWidth="0.8">
                <path d="M0 38 A38 38 0 0 1 38 0" />
                <path d="M0 30 A30 30 0 0 1 30 0" />
                <path d="M0 22 A22 22 0 0 1 22 0" />
              </svg>

              {/* Temassız + NFC (sağ üst) */}
              <div className="absolute top-4 right-5 flex flex-col items-center z-10" style={{ color: "#e6c66a" }}>
                <span className="material-symbols-outlined text-2xl leading-none">contactless</span>
                <span className="text-[8px] tracking-[0.2em] font-semibold mt-0.5">NFC</span>
              </div>

              {/* Merkez wordmark */}
              <div className="relative z-10 flex flex-col items-center">
                <span
                  className="font-bold text-2xl sm:text-3xl tracking-[0.12em]"
                  style={{
                    fontFamily: "Sora, sans-serif",
                    background: "linear-gradient(135deg, #f7e3a1 0%, #d4af37 50%, #a9821f 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  QONTACNET
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="h-px w-5" style={{ background: "linear-gradient(90deg, transparent, #d4af37)" }} />
                  <span className="uppercase text-[9px] sm:text-[10px] tracking-[0.28em]" style={{ color: "#c9a94a" }}>
                    Digital Network Card
                  </span>
                  <span className="h-px w-5" style={{ background: "linear-gradient(90deg, #d4af37, transparent)" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="absolute z-30 translate-x-24 translate-y-12 transform rotate-6 hidden md:block">
            <div className="w-56 h-[440px] rounded-[2.5rem] border-[8px] border-surface-container-highest glass-card p-4 overflow-hidden relative shadow-2xl">
              <div className="w-1/3 h-5 bg-surface-container-highest mx-auto rounded-b-xl mb-4" />
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-primary-container/20 border border-primary/40 p-1">
                  <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">person</span>
                  </div>
                </div>
                <div className="w-24 h-3 bg-white/20 rounded-full" />
                <div className="w-16 h-2 bg-white/10 rounded-full mb-4" />
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="h-12 glass-card rounded-lg flex items-center justify-center text-[10px] text-white/40">
                    WhatsApp
                  </div>
                  <div className="h-12 glass-card rounded-lg flex items-center justify-center text-[10px] text-white/40">
                    Katalog
                  </div>
                </div>
                <div className="w-full h-32 glass-card rounded-xl mt-2 flex items-center justify-center text-[10px] text-white/30 p-2 text-center">
                  Öne Çıkan Ürünler Alanı
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
