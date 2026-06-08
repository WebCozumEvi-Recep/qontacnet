"use client";
import { useEffect, useState } from "react";

interface AdminUser { id: string; ad: string; email: string; rol: string }

export default function AdminAyarlarPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [profSaving, setProfSaving] = useState(false);
  const [profMsg, setProfMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [mevcutSifre, setMevcutSifre] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [sifreSaving, setSifreSaving] = useState(false);
  const [sifreMsg, setSifreMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => {
      if (j.user?.data) {
        const d = j.user.data as AdminUser;
        setAdmin(d);
        setAd(d.ad ?? "");
        setEmail(j.user.email ?? "");
      }
    });
  }, []);

  async function handleProfil(e: React.FormEvent) {
    e.preventDefault();
    setProfSaving(true); setProfMsg(null);
    const res = await fetch("/api/admin/ayarlar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ad, email }),
    });
    const j = await res.json();
    setProfSaving(false);
    if (j.ok) {
      setAdmin(prev => prev ? { ...prev, ad: j.admin.ad, email: j.admin.email } : prev);
      setProfMsg({ ok: true, text: "Profil güncellendi." });
    } else {
      setProfMsg({ ok: false, text: j.error || "Kaydedilemedi." });
    }
  }

  async function handleSifre(e: React.FormEvent) {
    e.preventDefault();
    setSifreSaving(true); setSifreMsg(null);
    const res = await fetch("/api/admin/ayarlar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mevcutSifre, yeniSifre }),
    });
    const j = await res.json();
    setSifreSaving(false);
    if (j.ok) {
      setSifreMsg({ ok: true, text: "Şifre değiştirildi." });
      setMevcutSifre(""); setYeniSifre("");
    } else {
      setSifreMsg({ ok: false, text: j.error || "Şifre değiştirilemedi." });
    }
  }

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* Profil */}
      <form onSubmit={handleProfil} className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Yönetici Profili</h3>
        <p className="text-xs text-on-surface-variant mb-5">Platform yöneticisi bilgileriniz</p>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">shield_person</span>
          </div>
          <div>
            <p className="text-on-surface font-medium">{admin?.ad}</p>
            <p className="text-xs text-primary">{admin?.rol}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5">Ad Soyad</label>
            <input value={ad} onChange={e => setAd(e.target.value)}
              className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5">E-posta</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all" />
          </div>
        </div>

        {profMsg && (
          <p className={`text-xs flex items-center gap-1 mb-3 ${profMsg.ok ? "text-green-400" : "text-red-400"}`}>
            <span className="material-symbols-outlined text-sm">{profMsg.ok ? "check_circle" : "error"}</span>{profMsg.text}
          </p>
        )}
        <button type="submit" disabled={profSaving}
          className="px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60">
          {profSaving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>

      {/* Şifre Değiştir */}
      <form onSubmit={handleSifre} className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Şifre Değiştir</h3>
        <p className="text-xs text-on-surface-variant mb-5">Hesap güvenliği için güçlü bir şifre kullanın</p>

        <div className="grid md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5">Mevcut Şifre</label>
            <input type="password" value={mevcutSifre} onChange={e => setMevcutSifre(e.target.value)} required
              className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5">Yeni Şifre</label>
            <input type="password" value={yeniSifre} onChange={e => setYeniSifre(e.target.value)} required minLength={6}
              className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all" />
          </div>
        </div>

        {sifreMsg && (
          <p className={`text-xs flex items-center gap-1 mb-3 ${sifreMsg.ok ? "text-green-400" : "text-red-400"}`}>
            <span className="material-symbols-outlined text-sm">{sifreMsg.ok ? "check_circle" : "error"}</span>{sifreMsg.text}
          </p>
        )}
        <button type="submit" disabled={sifreSaving}
          className="px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60">
          {sifreSaving ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
        </button>
      </form>

      {/* Platform Ayarları */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Platform Ayarları</h3>
        <p className="text-xs text-on-surface-variant mb-5">Genel sistem davranışı</p>

        <div className="space-y-1">
          <Toggle label="Yeni firma kaydını aç" desc="Kapalı olursa landing'deki firma başvurusu manuel onayla işler." defaultChecked />
          <Toggle label="Deneme sürümü otomatik aktif" desc="Yeni kayıtlar 30 günlük deneme paketiyle başlasın." defaultChecked />
          <Toggle label="KVKK onayı zorunlu" desc="Tüm public kart sayfalarında lead formuna onay kutusu eklenir." defaultChecked />
          <Toggle label="E-posta bildirimleri" desc="Yeni başvuru, sipariş ve iptal durumlarında admin'e mail at." defaultChecked />
          <Toggle label="Bakım modu" desc="Tüm panelleri geçici olarak kapatır." />
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, desc, defaultChecked = false }: { label: string; desc: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button type="button" onClick={() => setOn(!on)} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/3 transition-all text-left">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-on-surface font-medium">{label}</p>
        <p className="text-xs text-on-surface-variant">{desc}</p>
      </div>
      <div className={`w-11 h-6 rounded-full relative transition-all flex-shrink-0 ${on ? "bg-primary" : "bg-white/10"}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "left-5" : "left-0.5"}`} />
      </div>
    </button>
  );
}
