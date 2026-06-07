"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const COLORS = ["#00d4ff", "#6001d1", "#42faba", "#ff6b6b", "#ffd93d", "#a29bfe"];

interface MemberData {
  id: string;
  ad: string;
  soyad: string;
  unvan: string;
  firmaAdi?: string;
  kartRenk: string;
  templateId: string | null;
  aktif: boolean;
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

interface Template { id: string; ad: string; renk: string; aktif: boolean }

function CardPreview({ member, color }: { member: { ad: string; soyad: string; unvan: string; firmaAdi?: string }; color: string }) {
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

  const [color, setColor] = useState("#00d4ff");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [toggles, setToggles] = useState({
    showWhatsapp: true, showLinkedin: true, showInstagram: true, showWebsite: true, showBio: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Üye verisi yüklenince state'i doldur
  useEffect(() => {
    if (!member) return;
    setColor(member.kartRenk ?? "#00d4ff");
    setTemplateId(member.templateId ?? null);
    setToggles({
      showWhatsapp: member.showWhatsapp ?? true,
      showLinkedin: member.showLinkedin ?? true,
      showInstagram: member.showInstagram ?? true,
      showWebsite: member.showWebsite ?? true,
      showBio: member.showBio ?? true,
    });
  }, [member]);

  useEffect(() => {
    fetch("/api/me/templates").then(r => r.json()).then(j => { if (j.ok) setTemplates(j.templates); }).catch(() => {});
  }, []);

  const toggle = (k: keyof typeof toggles) => setToggles(t => ({ ...t, [k]: !t[k] }));

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/me/card", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kartRenk: color, templateId, ...toggles }),
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
        {/* Left: Preview */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-5" style={{ fontFamily: "Sora, sans-serif" }}>Kart Önizlemesi</h3>
            <CardPreview member={member} color={color} />
            <div className="mt-6 flex gap-3 justify-center">
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
                <span className="text-on-surface-variant">NFC Bağlantısı</span>
                <span className="text-tertiary font-medium">✓ Bağlı</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Kart URL</span>
                <span className="text-primary text-xs">qontac.net/kart/{user?.id?.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Settings */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Kart Rengi</h3>
            <div className="flex gap-3 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className="w-10 h-10 rounded-full transition-all hover:scale-110"
                  style={{ background: c, boxShadow: color === c ? `0 0 0 3px #0f1321, 0 0 0 5px ${c}` : "none" }} />
              ))}
              <label className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-primary/40 transition-all">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">palette</span>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="sr-only" />
              </label>
            </div>
          </div>

          {templates.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Firma Şablonu</h3>
              <div className="space-y-2">
                {templates.map(t => (
                  <button key={t.id} onClick={() => { setTemplateId(t.id); setColor(t.renk); }} disabled={!t.aktif}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      templateId === t.id ? "bg-primary/10 border border-primary/30" : "border border-white/5 hover:bg-white/5"
                    } ${!t.aktif ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: t.renk }} />
                    <span className="text-sm text-on-surface flex-1 text-left">{t.ad}</span>
                    {!t.aktif && <span className="text-xs text-on-surface-variant">Pasif</span>}
                    {templateId === t.id && <span className="material-symbols-outlined text-primary text-base">check</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Visible Sections — gerçek toggle'lar */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Profilde Görünen Alanlar</h3>
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
