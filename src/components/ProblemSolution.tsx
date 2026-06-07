const problems = [
  {
    icon: "distance",
    colorBg: "bg-error/10",
    colorText: "text-error",
    title: "Dağınık İletişim",
    desc: "Her üye kendi stilinde tanıtım yapar, kurumsal bütünlük bozulur ve profesyonellik algısı düşer.",
  },
  {
    icon: "lock_reset",
    colorBg: "bg-primary/10",
    colorText: "text-primary",
    title: "Kontrolsüz Tanıtım",
    desc: "Kampanyalar veya ürün bilgileri güncellendiğinde tüm üyelerin aynı anda güncellenmesi imkansızdır.",
    highlight: true,
  },
  {
    icon: "monitoring",
    colorBg: "bg-tertiary/10",
    colorText: "text-tertiary",
    title: "Takipsiz Fırsatlar",
    desc: "Hangi üyenin kaç kişiyle iletişime geçtiğini ve oluşan satış fırsatlarını ölçümleyemezsiniz.",
  },
];

export default function ProblemSolution() {
  return (
    <section className="py-xl bg-surface-container-lowest relative overflow-hidden">
      <div className="max-w-container-max mx-auto px-10">
        <div className="text-center mb-lg">
          <h2
            className="text-headline-md md:text-display-lg font-bold mb-4 text-on-background"
            style={{ fontFamily: "Sora, sans-serif", lineHeight: 1.2 }}
          >
            Üyeleriniz sahada aynı{" "}
            <span className="text-primary">kurumsal dili</span> kullanıyor mu?
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-[42rem] mx-auto">
            Geleneksel yöntemler ekiplerinizi yavaşlatır ve markanızı kontrolsüz bırakır.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-md">
          {problems.map((p) => (
            <div
              key={p.title}
              className={`glass-card p-md rounded-2xl glow-hover ${
                p.highlight ? "border-primary/30" : ""
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl ${p.colorBg} ${p.colorText} flex items-center justify-center mb-md`}
              >
                <span className="material-symbols-outlined">{p.icon}</span>
              </div>
              <h3
                className="text-headline-sm font-semibold mb-xs text-on-surface"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {p.title}
              </h3>
              <p className="text-body-md text-on-surface-variant">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
