export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden grid-pattern">
      {/* Right glow */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />

      <div className="max-w-container-max mx-auto px-10 grid lg:grid-cols-2 gap-lg items-center relative z-10 w-full py-16">
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
            <span className="text-primary-container">akıllı dijital kartvizit</span>{" "}
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
              className="px-8 py-4 bg-primary-container text-on-primary-container font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all flex items-center gap-2"
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
        <div className="relative h-[600px] flex items-center justify-center">
          {/* Background glow */}
          <div className="absolute w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />

          {/* NFC Card Mockup */}
          <div className="absolute z-20 transform -rotate-12 hover:rotate-0 transition-transform duration-700 cursor-pointer">
            <div className="w-80 h-48 rounded-2xl glass-card border-white/20 p-6 flex flex-col justify-between shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 shimmer opacity-30" />
              <div className="flex justify-between items-start relative z-10">
                <span
                  className="font-bold text-xl text-primary tracking-widest"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  QONTAC
                </span>
                <span className="material-symbols-outlined text-primary text-3xl">nfc</span>
              </div>
              <div className="relative z-10">
                <p className="font-bold text-white tracking-widest text-lg">
                  #### #### #### ####
                </p>
                <p className="text-white/60 mt-1 uppercase tracking-widest text-xs">
                  NETWORK REPRESENTATIVE
                </p>
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
