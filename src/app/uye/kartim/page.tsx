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
  kartRenk: string;
  aktif: boolean;
  kartAktif?: boolean;
  whatsapp: string;
  linkedin: string;
  instagram: string;
  website: string;
  biyografi: string;
  showWhatsapp: boolean;
  showLinkedin: boolean;
  showInstagram: boolean;
  showWebsite: boolean;
  showBio: boolean;
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

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-10 h-5 rounded-full transition-all relative cursor-pointer flex-shrink-0 ${on ? "bg-primary" : "bg-white/10"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

export default function KartimPage() {
  const { user, updateUserData } = useAuth();
  const member = user?.data as unknown as MemberData;

  // Firma temasını API'den çek (gerçek public card rengi)
  const [firmaColor, setFirmaColor] = useState("#00d4ff");
  const [toggles, setToggles] = useState({
    showWhatsapp: true, showLinkedin: true, showInstagram: true, showWebsite: true, showBio: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!member) return;
    setToggles({
      showWhatsapp: member.showWhatsapp ?? true,
      showLinkedin: member.showLinkedin ?? true,
      showInstagram: member.showInstagram ?? true,
      showWebsite: member.showWebsite ?? true,
      showBio: member.showBio ?? true,
    });
  }, [member]);

  // Firma temasını public kart API'sinden al
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/kart/${user.id}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setFirmaColor(j.card.kartRenk); })
      .catch(() => {});
  }, [user?.id]);

  const toggle = (k: keyof typeof toggles) => setToggles(t => ({ ...t, [k]: !t[k] }));

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/me/card", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...toggles }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Kaydedilemedi.");
      updateUserData(json.member);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (!member) return null;

  const fields: { key: keyof typeof toggles; label: string; icon: string }[] = [
    { key: "showWhatsapp", label: "WhatsApp Butonu", icon: "phone" },
    { key: "showLinkedin", label: "LinkedIn", icon: "link" },
    { key: "showInstagram", label: "Instagram", icon: "photo_camera" },
    { key: "showWebsite", label: "Website", icon: "public" },
    { key: "showBio", label: "Biyografi", icon: "article" },
  ];

  return (
    <div className="max-w-[900px] space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sol: Önizleme */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-5" style={{ fontFamily: "Sora, sans-serif" }}>Kart Önizlemesi</h3>
            <CardPreview member={member} color={firmaColor} />
            <p className="text-xs text-on-surface-variant/60 text-center mt-3">Kart rengi ve teması firma tarafından belirlenir</p>
            <div className="mt-4 flex gap-3 justify-center">
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
        </div>

        {/* Sağ: Görünür alanlar */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Profilde Görünen Alanlar</h3>
            <p className="text-xs text-on-surface-variant mb-4">Hangi bilgilerin kartında görüneceğini seç</p>
            <div className="space-y-3">
              {fields.map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                    {item.label}
                  </div>
                  <Toggle on={toggles[item.key]} onClick={() => toggle(item.key)} />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <span className="material-symbols-outlined text-base">error</span>{error}
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary-container text-on-primary-container font-semibold rounded-xl hover:scale-[1.02] transition-all disabled:opacity-60">
            <span className={`material-symbols-outlined text-base ${saving ? "animate-spin" : ""}`}>{saving ? "progress_activity" : "save"}</span>
            {saving ? "Kaydediliyor..." : saved ? "Kaydedildi! ✓" : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
