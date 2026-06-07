export default function PhoneMockup() {
  return (
    <div className="relative mx-auto w-56 float">
      {/* Phone shell */}
      <div className="relative rounded-[2.5rem] overflow-hidden border-2 border-white/15 shadow-2xl"
        style={{ background: "#0d1117" }}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-2xl z-20"
          style={{ background: "#0d1117" }} />

        {/* Screen */}
        <div className="px-3 pt-6 pb-4 space-y-2" style={{ background: "linear-gradient(180deg, #0B1020 0%, #050816 100%)" }}>
          {/* Profile header */}
          <div className="flex flex-col items-center pt-2 pb-3 border-b border-white/10">
            <div className="w-14 h-14 rounded-full border-2 border-cyan-400/60 mb-1.5 flex items-center justify-center text-2xl"
              style={{ background: "linear-gradient(135deg, #0B1A3E, #1A0B3E)" }}>
              👤
            </div>
            <div className="text-white text-xs font-bold">Ahmet Yılmaz</div>
            <div className="text-cyan-400 text-[9px]">QONTAC Network</div>
          </div>

          {/* Action buttons */}
          {[
            { icon: "💬", label: "WhatsApp ile Yaz", color: "#18E6A7" },
            { icon: "📞", label: "Telefon Et", color: "#00D4FF" },
            { icon: "👤", label: "Kişilere Kaydet", color: "#7C3AED" },
          ].map((btn) => (
            <div key={btn.label} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-[9px] font-semibold"
              style={{ background: "rgba(255,255,255,0.04)", color: btn.color }}>
              <span className="text-sm">{btn.icon}</span>
              {btn.label}
            </div>
          ))}

          {/* Divider */}
          <div className="text-[8px] text-[#AAB3C5] text-center py-1 font-medium tracking-wider">ÜRÜNLER & FIRSAT</div>

          {[
            { icon: "🛍️", label: "Ürünleri İncele" },
            { icon: "💼", label: "İş Fırsatını Öğren" },
            { icon: "🔗", label: "Referansımla Kayıt Ol" },
          ].map((btn) => (
            <div key={btn.label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 text-[9px] text-white"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="text-sm">{btn.icon}</span>
              {btn.label}
            </div>
          ))}

          {/* Lead form mini */}
          <div className="mt-2 p-2 rounded-xl border border-purple-500/30" style={{ background: "rgba(124,58,237,0.08)" }}>
            <div className="text-[8px] text-purple-400 font-semibold mb-1">Bilgi Al</div>
            <div className="h-5 rounded-lg border border-white/10 bg-white/5 mb-1" />
            <div className="h-5 rounded-lg border border-white/10 bg-white/5" />
          </div>
        </div>
      </div>

      {/* Glow underneath */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 rounded-full blur-xl opacity-40"
        style={{ background: "#00D4FF" }} />
    </div>
  );
}
