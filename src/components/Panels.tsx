import SectionTitle from "./ui/SectionTitle";

const panels = [
  {
    title: "Firma Paneli",
    icon: "🏢",
    color: "#00D4FF",
    items: ["Üye yönetimi", "Template yönetimi", "Ürün ve kampanya yönetimi", "Lead raporları", "Kart aktivasyon takibi"],
    mockupRows: [
      { label: "Aktif Üyeler", value: "1.240", color: "#18E6A7" },
      { label: "Kart Okutma", value: "8.430", color: "#00D4FF" },
      { label: "Lead Formu", value: "312", color: "#7C3AED" },
    ],
  },
  {
    title: "Üye Uygulaması",
    icon: "📱",
    color: "#7C3AED",
    items: ["Profil düzenleme", "Kart aktivasyonu", "QR paylaşımı", "Gelen talepler", "İstatistikler"],
    mockupRows: [
      { label: "Profil Görüntülenme", value: "248", color: "#18E6A7" },
      { label: "WhatsApp Tıklama", value: "64", color: "#00D4FF" },
      { label: "Referans Kayıt", value: "12", color: "#7C3AED" },
    ],
  },
  {
    title: "Platform Admin",
    icon: "⚙️",
    color: "#18E6A7",
    items: ["Firma yönetimi", "Kart üretimi", "Lisans yönetimi", "Sipariş takibi", "Gelir raporları"],
    mockupRows: [
      { label: "Toplam Firma", value: "87", color: "#18E6A7" },
      { label: "Aktif Kart", value: "24.500", color: "#00D4FF" },
      { label: "Aylık Sipariş", value: "1.820", color: "#7C3AED" },
    ],
  },
];

export default function Panels() {
  return (
    <section className="py-24" style={{ background: "#0B1020" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          badge="Yönetim Panelleri"
          title="Firma, üye ve platform yönetimi"
          highlight="tek yapıda"
          subtitle="Her rol için özel panel: firma kontrolü, üye özgürlüğü, platform şeffaflığı."
        />

        <div className="grid md:grid-cols-3 gap-6">
          {panels.map((p) => (
            <div key={p.title} className="glass p-6 glass-hover">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${p.color}18`, border: `1px solid ${p.color}40` }}>
                  {p.icon}
                </div>
                <h3 className="text-white font-bold text-base">{p.title}</h3>
              </div>

              {/* Mock dashboard */}
              <div className="mb-5 space-y-2">
                {p.mockupRows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-2 px-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-[#AAB3C5] text-xs">{r.label}</span>
                    <span className="font-bold text-sm" style={{ color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {p.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#AAB3C5]">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
