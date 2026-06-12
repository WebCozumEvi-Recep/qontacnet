import GlassCard from "./ui/GlassCard";
import SectionTitle from "./ui/SectionTitle";

const benefits = [
  {
    icon: "🌟",
    title: "Profesyonel görünürlük",
    desc: "Kartınızı okutan herkes sizi, firmanızı ve ürünlerinizi tek sayfada görür. İlk izlenim güçlü olur.",
  },
  {
    icon: "📲",
    title: "Kolay iletişim",
    desc: "WhatsApp, telefon, e-posta, sosyal medya ve kişilere kaydetme butonları tek yerde. İletişim kolaylaşır.",
  },
  {
    icon: "🎯",
    title: "Daha kolay anlatım",
    desc: "Ürünleri, iş fırsatını ve tanıtım videolarını sayfanız sizin yerinize sunar. Sizi daha iyi anlatır.",
  },
  {
    icon: "🔗",
    title: "Referans linki",
    desc: "Kayıt olmak isteyen kişiler doğrudan sizin referans linkinizle yönlenir. Sponsor takibi otomatik.",
  },
  {
    icon: "📊",
    title: "Takip edilebilirlik",
    desc: "Kaç kişi kartınızı okuttu, hangi butona tıkladı, kim bilgi bıraktı — hepsini görebilirsiniz.",
  },
];

export default function ForMembers() {
  return (
    <section id="uyeler" className="py-24" style={{ background: "#0d0b09" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          badge="Üyeler İçin"
          title="Üyeleriniz sadece kart değil,"
          highlight="profesyonel tanıtım aracı kullanır"
          subtitle="Her üye, yanında hazır ve kurumsal bir dijital temsilci sayfası taşır."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <GlassCard key={b.title} className="border-l-2" style={{ borderLeftColor: "#18E6A7" }}>
              <div className="text-3xl mb-4">{b.icon}</div>
              <h3 className="text-white font-bold text-base mb-2">{b.title}</h3>
              <p className="text-[#AAB3C5] text-sm leading-relaxed">{b.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
