"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AdminUser } from "@/lib/auth-context";

export default function AdminAyarlarPage() {
  const { user } = useAuth();
  const admin = user?.data as AdminUser;
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* Profil */}
      <form onSubmit={handleSave} className="glass-card rounded-2xl p-6">
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
          <Field label="Ad Soyad" defaultValue={admin?.ad} />
          <Field label="E-posta" defaultValue={admin?.email} type="email" />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
            Kaydet
          </button>
          {saved && <span className="text-sm text-tertiary flex items-center gap-1"><span className="material-symbols-outlined text-base">check_circle</span>Kaydedildi</span>}
        </div>
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

      {/* Güvenlik */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Güvenlik</h3>
        <p className="text-xs text-on-surface-variant mb-5">Hesap güvenliği</p>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-xl glass-card hover:border-primary/20 transition-all text-left">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">lock_reset</span>
              <div>
                <p className="text-sm text-on-surface font-medium">Şifre Değiştir</p>
                <p className="text-xs text-on-surface-variant">Mevcut şifre ile yeni şifre belirle</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-xl glass-card hover:border-primary/20 transition-all text-left">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              <div>
                <p className="text-sm text-on-surface font-medium">İki Faktörlü Kimlik Doğrulama</p>
                <p className="text-xs text-on-surface-variant">Authenticator uygulaması ile koruma ekle</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-on-surface-variant/10 text-on-surface-variant border border-white/10">Pasif</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-xl glass-card hover:border-red-400/20 transition-all text-left">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400">history</span>
              <div>
                <p className="text-sm text-on-surface font-medium">Oturum Geçmişi</p>
                <p className="text-xs text-on-surface-variant">Aktif oturumları görüntüle ve sonlandır</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-on-surface-variant mb-1.5">{label}</label>
      <input type={type} defaultValue={defaultValue}
        className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-0 outline-none transition-all" />
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
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "left-5" : "left-0.5"}`}></div>
      </div>
    </button>
  );
}
