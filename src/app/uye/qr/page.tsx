"use client";
import { useAuth } from "@/lib/auth-context";
import { Member } from "@/lib/mock-data";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useCallback } from "react";

export default function QRPage() {
  const { user } = useAuth();
  const member = user?.data as unknown as Member;
  const cardUrl = `https://qontac.net/kart/${user?.id}`;
  const qrRef = useRef<HTMLDivElement>(null);

  const fullName = `${member?.ad ?? ""} ${member?.soyad ?? ""}`.trim();

  const copyLink = () => {
    navigator.clipboard.writeText(cardUrl);
  };

  const downloadQR = useCallback(() => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const size = 400;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Serialize SVG → data URL
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `qontac-qr-${user?.id}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }, [user?.id]);

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

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div ref={qrRef} className="relative inline-flex items-center justify-center p-4 rounded-2xl border border-white/10 bg-[#0f1321]">
            <QRCodeSVG
              value={cardUrl}
              size={200}
              bgColor="#0f1321"
              fgColor="#00d4ff"
              level="H"
              style={{ borderRadius: 8 }}
            />
            {/* El yazısı isim — QR ortasına overlay */}
            {fullName && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div
                  style={{
                    background: "rgba(15,19,33,0.82)",
                    borderRadius: 8,
                    padding: "4px 10px",
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Dancing Script', 'Pacifico', cursive",
                      fontSize: 15,
                      color: "#00d4ff",
                      letterSpacing: 0.5,
                      whiteSpace: "nowrap",
                      textShadow: "0 0 8px rgba(0,212,255,0.6)",
                    }}
                  >
                    {fullName}
                  </span>
                </div>
              </div>
            )}
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
      <button
        onClick={downloadQR}
        className="w-full flex items-center justify-center gap-2 py-3 glass-card rounded-xl text-on-surface-variant hover:text-primary transition-all text-sm"
      >
        <span className="material-symbols-outlined text-base">download</span>
        QR Kodu İndir (PNG)
      </button>
    </div>
  );
}
