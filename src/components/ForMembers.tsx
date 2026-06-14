import { getLocale } from "@/lib/i18n/server";
import { tx } from "@/lib/i18n/auto";

const benefits = [
  { icon: "visibility", title: "Profesyonel Görünürlük", desc: "Üye, firma onaylı dijital sayfasıyla daha kurumsal görünür." },
  { icon: "touch_app", title: "Tek Dokunuşla İletişim", desc: "WhatsApp, telefon, e-posta ve sosyal medya bağlantıları tek yerde olur." },
  { icon: "shopping_bag", title: "Ürün Tanıtımı", desc: "Ürünler, kataloglar ve kampanyalar profesyonel şekilde sunulur." },
  { icon: "rocket_launch", title: "İş Fırsatı Anlatımı", desc: "Adaylar fırsatı, videoları ve kayıt adımlarını kolayca inceleyebilir." },
  { icon: "hub", title: "Referans Linki", desc: "Kayıt olmak isteyen kişiler doğrudan üyenin referans linkine yönlenir." },
  { icon: "group_add", title: "Aday Toplama", desc: "Bilgi isteyen kişiler otomatik olarak aday listesine eklenir." },
  { icon: "monitoring", title: "Takip Edilebilirlik", desc: "Okutma, tıklama ve form talepleri ölçümlenebilir." },
  { icon: "share", title: "Her Yerde Paylaşım", desc: "NFC kart, QR kod, link, sosyal medya bio ve WhatsApp'ta kullanılabilir." },
];

const cardIcons = [
  { icon: "person_add", bg: "#d4af37", color: "#000" },
  { icon: "call", bg: "#22c55e" },
  { icon: "mail", bg: "#3b82f6" },
  { icon: "chat", bg: "#16a34a" },
  { icon: "shopping_bag", bg: "#8b5cf6" },
  { icon: "photo_library", bg: "#ec4899" },
  { icon: "play_circle", bg: "#ef4444" },
  { icon: "link", bg: "#0ea5e9" },
];

export default async function ForMembers() {
  const locale = await getLocale();
  const ui = await tx(
    {
      badge: "Üyeler İçin",
      h1: "Üyeleriniz sahada daha profesyonel görünür,",
      h2: "fırsatları daha kolay takip eder",
      intro:
        "QONTAC Network Card, üyelerin birebir görüşmelerde, sosyal medyada ve saha çalışmalarında kendilerini daha kurumsal temsil etmesini sağlar. Kart okutulduğunda ziyaretçi; iletişim bilgilerine, ürünlere, iş fırsatına, sosyal medya hesaplarına ve bilgi talep formuna tek noktadan ulaşır.",
      cta1: "Kart Sayfasını İncele",
      cta2: "Üye Olarak Nasıl Kullanılır?",
      name: "Ahmet Yılmaz",
      role: "Üst Düzey Yönetici",
      org: "Qontac Network",
      products: "Öne Çıkan Ürünler",
      closeH1: "Her tanışma",
      closeH2: "takip edilebilir bir fırsata",
      closeH3: "dönüşür",
      closeP:
        "QONTAC Network Card sayesinde üyeler, tanıştıkları kişileri kaybetmez. Kart okutulur, dijital sayfa açılır, ziyaretçi bilgi alır, form bırakır veya doğrudan iletişime geçer. Böylece her görüşme daha profesyonel, daha düzenli ve daha ölçülebilir hale gelir.",
    },
    locale,
  );
  const items = await Promise.all(
    benefits.map(async (b) => ({ ...b, ...(await tx({ title: b.title, desc: b.desc }, locale)) })),
  );
  return (
    <section id="uyeler" className="py-24 relative overflow-hidden" style={{ background: "#0d0b09" }}>
      {/* Arka plan altın NFC sinyal efekti */}
      <div className="absolute top-1/4 right-0 w-[40rem] h-[40rem] pointer-events-none opacity-50" aria-hidden>
        <svg viewBox="0 0 400 400" fill="none" className="w-full h-full">
          {[60, 110, 160, 210].map((r, i) => (
            <circle key={r} cx="300" cy="200" r={r} stroke="url(#nfcGold)" strokeWidth="1" opacity={0.5 - i * 0.1} />
          ))}
          <defs>
            <linearGradient id="nfcGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f5d77e" />
              <stop offset="1" stopColor="#9a7b22" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Üst: sol metin + sağ mockup */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Sol */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {ui.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white mb-5" style={{ fontFamily: "Sora, sans-serif" }}>
              {ui.h1}{" "}
              <span className="gradient-text">{ui.h2}</span>
            </h2>
            <p className="text-[#AAB3C5] text-lg leading-relaxed mb-8">
              {ui.intro}
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#sistem" className="px-7 py-3.5 bg-primary-container text-on-primary-container font-bold rounded-xl hover:scale-[1.02] transition-all flex items-center gap-2">
                {ui.cta1}
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </a>
              <a href="#demo" className="px-7 py-3.5 glass-card text-on-surface font-medium rounded-xl hover:bg-white/10 transition-all">
                {ui.cta2}
              </a>
            </div>
          </div>

          {/* Sağ: telefon mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-[280px] h-[560px] rounded-[3rem] border-[10px] shadow-2xl overflow-hidden p-1" style={{ background: "#000", borderColor: "#1a1a1a" }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20" />
              <div className="h-full w-full overflow-hidden pt-9 pb-6 px-3.5" style={{ background: "#050816" }}>
                {/* Profil kutusu */}
                <div className="relative rounded-[1.5rem] p-4 mb-4 text-center overflow-hidden glass-card">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(212,175,55,0.18) 0%, transparent 60%)" }} />
                  <div className="relative z-10 inline-block mb-2.5">
                    <div className="w-[4.5rem] h-[4.5rem] rounded-full border-4 overflow-hidden flex items-center justify-center mx-auto" style={{ borderColor: "rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.12)" }}>
                      <span className="material-symbols-outlined text-4xl text-primary">person</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-surface-dim flex items-center justify-center" style={{ background: "#d4af37" }}>
                      <span className="material-symbols-outlined text-[13px] text-black">verified</span>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-white font-bold text-base" style={{ fontFamily: "Sora, sans-serif" }}>{ui.name}</h4>
                    <p className="text-primary text-xs font-medium">{ui.role}</p>
                    <p className="text-[11px] text-on-surface-variant">{ui.org}</p>
                  </div>
                </div>
                {/* Yuvarlak ikon grid */}
                <div className="grid grid-cols-4 gap-x-2.5 gap-y-3.5 justify-items-center mb-4 px-1">
                  {cardIcons.map((a, i) => (
                    <div key={i} className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg" style={{ background: a.bg }}>
                      <span className="material-symbols-outlined text-base" style={{ color: a.color ?? "#fff" }}>{a.icon}</span>
                    </div>
                  ))}
                </div>
                {/* Firma modülü kartı */}
                <div className="glass-card rounded-2xl p-3.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="material-symbols-outlined text-primary text-sm">collections</span>
                    <span className="text-xs font-semibold text-on-surface">{ui.products}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/10" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 8 fayda kartı */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {items.map((b) => (
            <div
              key={b.title}
              className="group relative overflow-hidden rounded-2xl p-5 glass-card transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(212,175,55,0.12) 0%, transparent 55%)" }}
              />
              <div
                className="relative z-10 w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                style={{
                  background: "linear-gradient(145deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 100%)",
                  border: "1px solid rgba(212,175,55,0.30)",
                }}
              >
                <span className="material-symbols-outlined text-xl text-primary">{b.icon}</span>
              </div>
              <h3 className="relative z-10 text-white font-bold text-sm mb-1.5">{b.title}</h3>
              <p className="relative z-10 text-[#AAB3C5] text-[13px] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Kapanış */}
        <div className="relative rounded-3xl p-8 lg:p-12 text-center overflow-hidden glass-card" style={{ border: "1px solid rgba(212,175,55,0.20)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 60%)" }} />
          <h3 className="relative z-10 text-2xl lg:text-3xl font-bold text-white mb-4" style={{ fontFamily: "Sora, sans-serif" }}>
            {ui.closeH1} <span className="gradient-text">{ui.closeH2}</span> {ui.closeH3}
          </h3>
          <p className="relative z-10 text-[#AAB3C5] text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
            {ui.closeP}
          </p>
        </div>
      </div>
    </section>
  );
}
