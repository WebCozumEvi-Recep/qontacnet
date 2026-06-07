"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Firma } from "@/lib/mock-data";

export default function AyarlarPage() {
  const { user } = useAuth();
  const firma = user?.data as Firma;
  const [tab, setTab] = useState<"firma" | "bildirim" | "guvenlik">("firma");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    ad: firma?.ad ?? "",
    email: firma?.email ?? "",
    telefon: firma?.telefon ?? "",
    adres: firma?.adres ?? "",
    website: firma?.website ?? "",
    sektor: firma?.sektor ?? "",
  });

  const [notifications, setNotifications] = useState({
    yeniLead: true, yeniUye: true, uyePasif: false, haftalikRapor: true, aylikRapor: true,
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setN = (k: string) => setNotifications(n => ({ ...n, [k]: !n[k as keyof typeof n] }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass = "w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all";
  const labelClass = "text-xs text-on-surface-variant mb-1.5 block";

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle}
      className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${value ? "bg-primary" : "bg-white/10"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );

  return (
    <div className="max-w-2xl space-y-5">
      {/* Tabs */}
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
                <label className={labelClass}>Firma Adı</label>
                <input value={form.ad} onChange={e => set("ad", e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>E-Posta</label>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Telefon</label>
                  <input value={form.telefon} onChange={e => set("telefon", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Adres</label>
                <input value={form.adres} onChange={e => set("adres", e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Website</label>
                  <input value={form.website} onChange={e => set("website", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Sektör</label>
                  <select value={form.sektor} onChange={e => set("sektor", e.target.value)}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary outline-none transition-all">
                    {["Teknoloji","Finans","Sağlık","Eğitim","Perakende","Diğer"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Paket Bilgisi</h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div>
                <p className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{firma?.paket} Paketi</p>
                <p className="text-sm text-on-surface-variant mt-0.5">500 üyeye kadar · 3 şablon · Gelişmiş analitik</p>
              </div>
              <button type="button" className="px-4 py-2 bg-primary-container text-on-primary-container rounded-xl text-sm font-medium hover:scale-[1.02] transition-all">
                Paketi Yükselt
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container font-semibold rounded-xl hover:scale-[1.02] transition-all disabled:opacity-60">
              {saving ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Kaydediliyor</> : <><span className="material-symbols-outlined text-base">save</span>Kaydet</>}
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
              <Toggle value={notifications[item.key as keyof typeof notifications]} onToggle={() => setN(item.key)} />
            </div>
          ))}
        </div>
      )}

      {tab === "guvenlik" && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Şifre Değiştir</h3>
            <div className="space-y-4">
              {["Mevcut Şifre", "Yeni Şifre", "Yeni Şifre Tekrar"].map(l => (
                <div key={l}>
                  <label className={labelClass}>{l}</label>
                  <input type="password" className={inputClass} placeholder="••••••••" />
                </div>
              ))}
              <button className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container font-semibold rounded-xl hover:scale-[1.02] transition-all">
                <span className="material-symbols-outlined text-base">lock</span>
                Şifreyi Güncelle
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-2" style={{ fontFamily: "Sora, sans-serif" }}>İki Faktörlü Doğrulama</h3>
            <p className="text-sm text-on-surface-variant mb-4">SMS veya authenticator uygulaması ile hesabınızı güvence altına alın.</p>
            <button className="flex items-center gap-2 px-5 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all">
              <span className="material-symbols-outlined text-base">security</span>
              2FA Kur
            </button>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-red-400/10">
            <h3 className="text-sm font-semibold text-red-400 mb-2">Tehlikeli Bölge</h3>
            <p className="text-sm text-on-surface-variant mb-4">Bu işlemler geri alınamaz. Dikkatli olun.</p>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl text-sm hover:bg-red-400/20 transition-all">
              <span className="material-symbols-outlined text-base">delete_forever</span>
              Firma Hesabını Sil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
