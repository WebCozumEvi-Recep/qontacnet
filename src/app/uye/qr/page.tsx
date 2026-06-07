"use client";
import { useAuth } from "@/lib/auth-context";
import { Member } from "@/lib/mock-data";

export default function QRPage() {
  const { user } = useAuth();
  const member = user?.data as unknown as Member;
  const cardUrl = `https://qontac.net/kart/${user?.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(cardUrl);
  };

  // Generate QR using a public API URL
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}&bgcolor=0f1321&color=00d4ff&format=png`;

  return (
    <div className="max-w-lg space-y-6">
      {/* QR Card */}
      <div className="glass-card rounded-2xl p-8 text-center">
        <h3 className="text-sm font-semibold text-on-surface mb-2" style={{ fontFamily: "Sora, sans-serif" }}>
          Dijital Kartvizit QR Kodu
        </h3>
        <p className="text-xs text-on-surface-variant mb-6">
          Bu QR kodu taratıldığında dijital profiliniz açılır.
        </p>

        <div className="inline-block p-4 rounded-2xl border border-white/10 bg-[#0f1321] mb-6">
          {/* QR Visual — grid pattern */}
          <div className="w-48 h-48 relative">
            <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* QR code decorative pattern */}
              <rect width="200" height="200" fill="#0f1321"/>
              {/* Top-left finder */}
              <rect x="10" y="10" width="50" height="50" rx="4" fill="none" stroke="#00d4ff" strokeWidth="6"/>
              <rect x="22" y="22" width="26" height="26" rx="2" fill="#00d4ff"/>
              {/* Top-right finder */}
              <rect x="140" y="10" width="50" height="50" rx="4" fill="none" stroke="#00d4ff" strokeWidth="6"/>
              <rect x="152" y="22" width="26" height="26" rx="2" fill="#00d4ff"/>
              {/* Bottom-left finder */}
              <rect x="10" y="140" width="50" height="50" rx="4" fill="none" stroke="#00d4ff" strokeWidth="6"/>
              <rect x="22" y="152" width="26" height="26" rx="2" fill="#00d4ff"/>
              {/* Data modules (decorative) */}
              {[70,80,90,100,110,120,130].map((x, i) =>
                [10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180].map((y, j) =>
                  (i + j) % 3 === 0 ? <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" rx="1" fill="#00d4ff" opacity={(i*j)%5 === 0 ? 1 : 0.4}/> : null
                )
              )}
              {[10,20,30,40,50,60].map((x, i) =>
                [70,80,90,100,110,120,130,140,150,160,170,180].map((y, j) =>
                  (i + j) % 2 === 0 ? <rect key={`l-${x}-${y}`} x={x} y={y} width="7" height="7" rx="1" fill="#00d4ff" opacity={0.5}/> : null
                )
              )}
              {[140,150,160,170,180].map((x, i) =>
                [70,80,90,100,110,120,130].map((y, j) =>
                  (i + j) % 2 === 0 ? <rect key={`r-${x}-${y}`} x={x} y={y} width="7" height="7" rx="1" fill="#00d4ff" opacity={0.5}/> : null
                )
              )}
              {/* Center logo area */}
              <rect x="85" y="85" width="30" height="30" rx="6" fill="#0f1321"/>
              <text x="100" y="106" textAnchor="middle" fill="#00d4ff" fontSize="14" fontWeight="bold" fontFamily="Sora">Q</text>
            </svg>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
            {member?.ad} {member?.soyad}
          </p>
          <p className="text-xs text-on-surface-variant">{member?.unvan} · {member?.firmaAdi}</p>
        </div>
      </div>

      {/* Link */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs text-on-surface-variant mb-2">Profil Linki</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface-variant font-mono truncate">
            qontac.net/kart/{user?.id}
          </div>
          <button onClick={copyLink}
            className="px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm hover:bg-primary/20 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-base">content_copy</span>
            Kopyala
          </button>
        </div>
      </div>

      {/* Share */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Paylaş</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "WhatsApp", icon: "chat", color: "#25d366", href: `https://wa.me/?text=Dijital%20kartvizitime%20bakabilirsin:%20${cardUrl}` },
            { label: "LinkedIn", icon: "link", color: "#0077b5", href: `https://linkedin.com/sharing/share-offsite/?url=${cardUrl}` },
            { label: "E-Posta", icon: "mail", color: "#00d4ff", href: `mailto:?subject=Dijital%20Kartvizitim&body=${cardUrl}` },
          ].map(item => (
            <a key={item.label} href={item.href} target="_blank" rel="noreferrer"
              className="flex flex-col items-center gap-2 p-3 glass-card rounded-xl hover:bg-white/5 transition-all group">
              <span className="material-symbols-outlined text-xl transition-all" style={{ color: item.color }}>{item.icon}</span>
              <span className="text-xs text-on-surface-variant">{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Download QR */}
      <button className="w-full flex items-center justify-center gap-2 py-3 glass-card rounded-xl text-on-surface-variant hover:text-primary transition-all text-sm">
        <span className="material-symbols-outlined text-base">download</span>
        QR Kodu İndir (PNG)
      </button>
    </div>
  );
}
