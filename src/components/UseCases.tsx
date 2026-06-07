import SectionTitle from "./ui/SectionTitle";

const useCases = [
  { icon: "🤝", label: "Birebir görüşmeler" },
  { icon: "🏪", label: "Stand toplantıları" },
  { icon: "🎤", label: "Seminerler" },
  { icon: "🛍️", label: "Ürün tanıtımları" },
  { icon: "🔗", label: "Sosyal medya bio linki" },
  { icon: "💬", label: "WhatsApp paylaşımı" },
  { icon: "📧", label: "E-posta imzası" },
  { icon: "🎥", label: "Webinar kayıtları" },
  { icon: "🆕", label: "Yeni üye onboarding" },
  { icon: "👑", label: "Lider ekip yönetimi" },
];

export default function UseCases() {
  return (
    <section className="py-24 grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          badge="Kullanım Alanları"
          title="Network ekiplerinin her"
          highlight="temas noktasında kullanılır"
          subtitle="Fiziksel veya dijital, her ortamda profesyonel temsilci deneyimi."
        />

        <div className="flex flex-wrap justify-center gap-4">
          {useCases.map((u) => (
            <div key={u.label}
              className="flex items-center gap-3 px-5 py-3 rounded-full glass glass-hover cursor-default">
              <span className="text-xl">{u.icon}</span>
              <span className="text-sm font-medium text-[#AAB3C5]">{u.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
