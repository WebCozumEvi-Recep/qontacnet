"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

interface MemberData {
  id: string;
  ad: string;
  soyad: string;
  unvan: string;
  firmaAdi?: string;
  aktif: boolean;
  kartAktif?: boolean;
}

function CardPreview({ member, color }: { member: Pick<MemberData, "ad" | "soyad" | "unvan" | "firmaAdi">; color: string }) {
  return (
    <div className="relative w-full max-w-xs mx-auto">
      <div className="w-full aspect-[1.586/1] rounded-2xl glass-card border-white/20 p-6 flex flex-col justify-between shadow-2xl overflow-hidden"
        style={{ borderColor: `${color}30` }}>
        <div className="absolute inset-0 shimmer opacity-20" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20" style={{ background: color, filter: "blur(40px)" }} />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="font-bold text-lg tracking-widest" style={{ fontFamily: "Sora, sans-serif", color }}>QONTAC</span>
            <p className="text-white/60 text-xs mt-0.5">{member.firmaAdi}</p>
          </div>
          <span className="material-symbols-outlined text-3xl" style={{ color }}>nfc</span>
        </div>
        <div className="relative z-10">
          <p className="font-bold text-white text-lg" style={{ fontFamily: "Sora, sans-serif" }}>{member.ad} {member.soyad}</p>
          <p className="text-white/60 text-sm mt-0.5">{member.unvan}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-0.5 flex-1 rounded" style={{ background: `${color}40` }} />
            <span className="text-white/30 text-xs uppercase tracking-widest">Network Card</span>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: `0 0 40px ${color}20` }} />
    </div>
  );
}

export default function KartimPage() {
  const { user } = useAuth();
  const member = user?.data as unknown as MemberData;

  // Firma temasını API'den çek (gerçek public card rengi)
  const [firmaColor, setFirmaColor] = useState("#d4af37");

  // Firma temasını public kart API'sinden al
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/kart/${user.id}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setFirmaColor(j.card.kartRenk); })
      .catch(() => {});
  }, [user?.id]);

  if (!member) return null;

  return (
    <div className="max-w-[900px] space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sol: Önizleme */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-5" style={{ fontFamily: "Sora, sans-serif" }}>Kart Önizlemesi</h3>
            <CardPreview member={member} color={firmaColor} />
            <p className="text-xs text-on-surface-variant/60 text-center mt-3">
              Tema ve kurumsal modüller seçtiğin şablondan gelir
            </p>
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              <Link href="/uye/template"
                className="flex items-center gap-2 px-4 py-2 bg-primary-container/80 text-on-primary-container rounded-xl text-sm font-medium hover:scale-[1.02] transition-all">
                <span className="material-symbols-outlined text-base">style</span>
                Şablon Seç
              </Link>
              <Link href={`/kart/${user?.id}`} target="_blank"
                className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all">
                <span className="material-symbols-outlined text-base">open_in_new</span>
                Profili Görüntüle
              </Link>
              <Link href="/uye/qr"
                className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all">
                <span className="material-symbols-outlined text-base">qr_code_2</span>
                QR Kod
              </Link>
            </div>
          </div>
        </div>

        {/* Sağ: Kart bilgileri */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-tertiary text-lg">info</span>
              <h4 className="text-sm font-medium text-on-surface">Kart Bilgileri</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Durum</span>
                <span className={`font-medium ${member.aktif ? "text-tertiary" : "text-red-400"}`}>{member.aktif ? "✓ Aktif" : "✗ Pasif"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">NFC Aktivasyon</span>
                <span className={`font-medium ${member.kartAktif ? "text-tertiary" : "text-amber-400"}`}>
                  {member.kartAktif ? "✓ Aktive Edildi" : "⚠ Bekliyor"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Kart URL</span>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const url = `${typeof window !== "undefined" ? window.location.origin : "https://qontac.net"}/kart/${user?.id}`;
                    navigator.clipboard.writeText(url).then(() => alert("Kopyalandı!"));
                  }} className="flex items-center gap-1.5 px-2 py-1 text-xs glass-card rounded-lg text-on-surface-variant hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-sm">content_copy</span>Kopyala
                  </button>
                  <a href={`/kart/${user?.id}`} target="_blank" className="flex items-center gap-1.5 px-2 py-1 text-xs glass-card rounded-lg text-on-surface-variant hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-sm">open_in_new</span>Git
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">tune</span>
              <h4 className="text-sm font-medium text-on-surface">Kartta Görünen Alanlar</h4>
            </div>
            <p className="text-xs text-on-surface-variant mb-3">
              Sosyal hesapların görünürlüğü, biyografi ve profil kutusu arkaplanı artık Profilim sayfasından yönetiliyor.
            </p>
            <Link href="/uye/profil"
              className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all">
              <span className="material-symbols-outlined text-base">person</span>
              Profilime Git
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
