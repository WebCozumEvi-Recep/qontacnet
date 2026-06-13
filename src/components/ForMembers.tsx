import GlassCard from "./ui/GlassCard";
import SectionTitle from "./ui/SectionTitle";

const benefits = [
  {
    icon: "visibility",
    title: "Profesyonel görünürlük",
    desc: "Kartınızı okutan herkes sizi, firmanızı ve ürünlerinizi tek sayfada görür. İlk izlenim güçlü olur.",
  },
  {
    icon: "forum",
    title: "Kolay iletişim",
    desc: "WhatsApp, telefon, e-posta, sosyal medya ve kişilere kaydetme butonları tek yerde. İletişim kolaylaşır.",
  },
  {
    icon: "campaign",
    title: "Daha kolay anlatım",
    desc: "Ürünleri, iş fırsatını ve tanıtım videolarını sayfanız sizin yerinize sunar. Sizi daha iyi anlatır.",
  },
  {
    icon: "hub",
    title: "Referans linki",
    desc: "Kayıt olmak isteyen kişiler doğrudan sizin referans linkinizle yönlenir. Sponsor takibi otomatik.",
  },
  {
    icon: "monitoring",
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
            <GlassCard
              key={b.title}
              className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(212,175,55,0.10) 0%, transparent 55%)" }}
              />
              <div
                className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                style={{
                  background: "linear-gradient(145deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 100%)",
                  border: "1px solid rgba(212,175,55,0.30)",
                }}
              >
                <span className="material-symbols-outlined text-2xl text-primary">{b.icon}</span>
              </div>
              <h3 className="relative z-10 text-white font-bold text-base mb-2">{b.title}</h3>
              <p className="relative z-10 text-[#AAB3C5] text-sm leading-relaxed">{b.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
