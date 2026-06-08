"use client";
import { useEffect, useState } from "react";
import { paketLabel } from "@/lib/labels";

interface FirmaProfil {
  id: string; ad: string; email: string; telefon: string; adres: string;
  website: string; sektor: string; logo: string; paket: string; durum: string;
}

const SEKTORLER = ["Teknoloji", "Finans", "Sağlık", "Eğitim", "Perakende", "Hizmet", "İnşaat", "Diğer"];

const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all";
const labelCls = "text-xs text-on-surface-variant mb-1.5 block";

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${value ? "bg-primary" : "bg-white/10"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

export default function AyarlarPage() {
  const [tab, setTab] = useState<"firma" | "bildirim" | "guvenlik">("firma");
  const [profil, setProfil] = useState<FirmaProfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [form, setForm] = useState({ ad: "", telefon: "", adres: "", website: "", sektor: "" });
  const [pw, setPw] = useState({ mevcut: "", yeni: "", tekrar: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    yeniLead: true, yeniUye: true, uyePasif: false, haftalikRapor: true, aylikRapor: true,
  });

  useEffect(() => {
    fetch("/api/firma/profile")
      .then(r => r.json())
      .then(j => {
        if (j.ok) {
          setProfil(j.firma);
          setForm({ ad: j.firma.ad, telefon: j.firma.telefon, adres: j.firma.adres, website: j.firma.website, sektor: j.firma.sektor });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveError("");
    const res = await fetch("/api/firma/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    setSaving(false);
    if (!j.ok) { setSaveError(j.error || "Kaydedilemedi."); return; }
    setProfil(j.firma);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (pw.yeni !== pw.tekrar) { setPwError("Yeni şifreler eşleşmiyor."); return; }
    if (pw.yeni.length < 6) { setPwError("Yeni şifre en az 6 karakter olmalı."); return; }
    setPwSaving(true);
    const res = await fetch("/api/firma/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mevcutSifre: pw.mevcut, yeniSifre: pw.yeni }),
    });
    const j = await res.json();
    setPwSaving(false);
    if (!j.ok) { setPwError(j.error || "Şifre değiştirilemedi."); return; }
    setPw({ mevcut: "", yeni: "", tekrar: "" });
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 3000);
  };

  if (loading) return <div className="text-on-surface-variant text-sm py-12 text-center">Yükleniyor...</div>;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex glass-card rounded-2xl p-1 w-fit">
        {([["firma", "Firma Bilgileri"], ["bildirim", "Bildirimler"], ["guvenlik", "Güvenlik"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === k ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "firma" && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Firma Bilgileri</h3>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Firma Adı</label>
                <input value={form.ad} onChange={set("ad")} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>E-Posta</label>
                  <input value={profil?.email ?? ""} disabled className={inputCls + " opacity-50 cursor-not-allowed"} />
                </div>
                <div>
                  <label className={labelCls}>Telefon</label>
                  <input value={form.telefon} onChange={set("telefon")} placeholder="+90 5xx xxx xx xx" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Adres</label>
                <input value={form.adres} onChange={set("adres")} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Website</label>
                  <input value={form.website} onChange={set("website")} placeholder="https://" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Sektör</label>
                  <select value={form.sektor} onChange={set("sektor")}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary outline-none transition-all">
                    <option value="">Seçiniz</option>
                    {SEKTORLER.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Paket Bilgisi</h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div>
                <p className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
                  {profil?.paket ? paketLabel[profil.paket] ?? profil.paket : "—"} Paketi
                </p>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  Durum: <span className="text-primary capitalize">{profil?.durum?.toLowerCase() ?? "—"}</span>
                </p>
              </div>
              <button type="button" className="px-4 py-2 bg-primary-container text-on-primary-container rounded-xl text-sm font-medium hover:scale-[1.02] transition-all">
                Paketi Yükselt
              </button>
            </div>
          </div>

          {saveError && <p className="text-xs text-red-400 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{saveError}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container font-semibold rounded-xl hover:scale-[1.02] transition-all disabled:opacity-60">
              {saving
                ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Kaydediliyor</>
                : <><span className="material-symbols-outlined text-base">save</span>Kaydet</>}
            </button>
            {saved && <div className="flex items-center gap-1.5 text-tertiary text-sm"><span className="material-symbols-outlined text-base">check_circle</span>Kaydedildi!</div>}
          </div>
        </form>
      )}

      {tab === "bildirim" && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-on-surface mb-2" style={{ fontFamily: "Sora, sans-serif" }}>Bildirim Tercihleri</h3>
          {[
            { key: "yeniLead", label: "Yeni lead alındığında", desc: "Üyeleriniz yeni bir lead aldığında e-posta gönder" },
            { key: "yeniUye", label: "Yeni üye kaydı", desc: "Platforma yeni üye eklendiğinde bildir" },
            { key: "uyePasif", label: "Üye pasife alındığında", desc: "Bir üye pasife geçtiğinde bildir" },
            { key: "haftalikRapor", label: "Haftalık performans raporu", desc: "Her Pazartesi özet rapor gönder" },
            { key: "aylikRapor", label: "Aylık analitik raporu", desc: "Her ayın 1'inde aylık rapor gönder" },
          ].map(item => (
            <div key={item.key} className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm text-on-surface font-medium">{item.label}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
              </div>
              <Toggle
                value={notifications[item.key as keyof typeof notifications]}
                onToggle={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
              />
            </div>
          ))}
        </div>
      )}

      {tab === "guvenlik" && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Şifre Değiştir</h3>
            <form onSubmit={handlePwChange} className="space-y-4">
              <div>
                <label className={labelCls}>Mevcut Şifre</label>
                <input type="password" value={pw.mevcut} onChange={e => setPw(p => ({ ...p, mevcut: e.target.value }))} className={inputCls} placeholder="••••••••" />
              </div>
              <div>
                <label className={labelCls}>Yeni Şifre</label>
                <input type="password" value={pw.yeni} onChange={e => setPw(p => ({ ...p, yeni: e.target.value }))} className={inputCls} placeholder="••••••••" />
              </div>
              <div>
                <label className={labelCls}>Yeni Şifre Tekrar</label>
                <input type="password" value={pw.tekrar} onChange={e => setPw(p => ({ ...p, tekrar: e.target.value }))} className={inputCls} placeholder="••••••••" />
              </div>
              {pwError && <p className="text-xs text-red-400 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{pwError}</p>}
              {pwSaved && <p className="text-xs text-tertiary flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span>Şifre güncellendi!</p>}
              <button type="submit" disabled={pwSaving || !pw.mevcut || !pw.yeni || !pw.tekrar}
                className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container font-semibold rounded-xl hover:scale-[1.02] transition-all disabled:opacity-60">
                {pwSaving
                  ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Güncelleniyor</>
                  : <><span className="material-symbols-outlined text-base">lock</span>Şifreyi Güncelle</>}
              </button>
            </form>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-red-400/10">
            <h3 className="text-sm font-semibold text-red-400 mb-2">Tehlikeli Bölge</h3>
            <p className="text-sm text-on-surface-variant mb-4">Bu işlemler geri alınamaz. Dikkatli olun.</p>
            <button type="button" className="flex items-center gap-2 px-5 py-2.5 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl text-sm hover:bg-red-400/20 transition-all">
              <span className="material-symbols-outlined text-base">delete_forever</span>
              Firma Hesabını Sil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
