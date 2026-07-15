"use client";
import { useEffect, useRef, useState } from "react";

interface AdminUser { id: string; ad: string; email: string; rol: string }
interface SiteSettings {
  logoUrl: string; faviconUrl: string; logoText: string; googleSiteVerification: string; headKod: string; bodyKod: string;
  iletisimEmail: string; iletisimTelefon: string; iletisimAdres: string; iletisimAciklama: string;
  sosyalLinkedin: string; sosyalInstagram: string; sosyalX: string; sosyalFacebook: string; sosyalYoutube: string; sosyalWebsite: string;
}

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

      {/* Site Kimliği */}
      <SiteKimligi />

      {/* Sanal POS Ayarları */}
      <SanalPos />

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

function SiteKimligi() {
  const [s, setS] = useState<SiteSettings>({
    logoUrl: "", faviconUrl: "", logoText: "QONTAC", googleSiteVerification: "", headKod: "", bodyKod: "",
    iletisimEmail: "", iletisimTelefon: "", iletisimAdres: "", iletisimAciklama: "",
    sosyalLinkedin: "", sosyalInstagram: "", sosyalX: "", sosyalFacebook: "", sosyalYoutube: "", sosyalWebsite: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all";

  useEffect(() => {
    fetch("/api/admin/site-ayarlar").then(r => r.json()).then(j => {
      if (j.ok && j.settings) setS({
        logoUrl: j.settings.logoUrl ?? "",
        faviconUrl: j.settings.faviconUrl ?? "",
        logoText: j.settings.logoText ?? "QONTAC",
        googleSiteVerification: j.settings.googleSiteVerification ?? "",
        headKod: j.settings.headKod ?? "",
        bodyKod: j.settings.bodyKod ?? "",
        iletisimEmail: j.settings.iletisimEmail ?? "",
        iletisimTelefon: j.settings.iletisimTelefon ?? "",
        iletisimAdres: j.settings.iletisimAdres ?? "",
        iletisimAciklama: j.settings.iletisimAciklama ?? "",
        sosyalLinkedin: j.settings.sosyalLinkedin ?? "",
        sosyalInstagram: j.settings.sosyalInstagram ?? "",
        sosyalX: j.settings.sosyalX ?? "",
        sosyalFacebook: j.settings.sosyalFacebook ?? "",
        sosyalYoutube: j.settings.sosyalYoutube ?? "",
        sosyalWebsite: j.settings.sosyalWebsite ?? "",
      });
    });
  }, []);

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "site");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await res.json();
    setUploading(false);
    if (j.ok) setS(p => ({ ...p, logoUrl: j.url }));
    else setMsg({ ok: false, text: j.error || "Logo yüklenemedi." });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFavicon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaviconUploading(true); setMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "site");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await res.json();
    setFaviconUploading(false);
    if (j.ok) setS(p => ({ ...p, faviconUrl: j.url }));
    else setMsg({ ok: false, text: j.error || "Favicon yüklenemedi." });
    if (faviconRef.current) faviconRef.current.value = "";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const res = await fetch("/api/admin/site-ayarlar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    const j = await res.json();
    setSaving(false);
    setMsg(j.ok ? { ok: true, text: "Site ayarları kaydedildi." } : { ok: false, text: j.error || "Kaydedilemedi." });
  }

  return (
    <form onSubmit={handleSave} className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Site Kimliği</h3>
      <p className="text-xs text-on-surface-variant mb-5">Logo, Google doğrulama ve reklam/analitik kodları — ana sayfada otomatik uygulanır.</p>

      {/* Logo */}
      <div className="mb-5">
        <label className="block text-xs text-on-surface-variant mb-1.5">Site Logosu</label>
        <div className="flex items-center gap-4 flex-wrap">
          {s.logoUrl ? (
            <img src={s.logoUrl} alt="logo" className="h-12 max-w-[180px] object-contain rounded-lg border border-white/10 bg-white/5 px-2" />
          ) : (
            <div className="h-12 w-32 rounded-lg border border-dashed border-white/15 flex items-center justify-center text-xs text-on-surface-variant">Logo yok</div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-4 py-2 rounded-xl glass-card text-xs font-semibold hover:bg-white/10 transition-all disabled:opacity-60">
            {uploading ? "Yükleniyor..." : "Logo Yükle"}
          </button>
          {s.logoUrl && (
            <button type="button" onClick={() => setS(p => ({ ...p, logoUrl: "" }))}
              className="px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-400/10 transition-all">Kaldır</button>
          )}
        </div>
      </div>

      {/* Favicon */}
      <div className="mb-5">
        <label className="block text-xs text-on-surface-variant mb-1.5">Favicon (tarayıcı sekmesi ikonu)</label>
        <div className="flex items-center gap-4 flex-wrap">
          {s.faviconUrl ? (
            <img src={s.faviconUrl} alt="favicon" className="h-10 w-10 object-contain rounded-lg border border-white/10 bg-white/5 p-1" />
          ) : (
            <div className="h-10 w-10 rounded-lg border border-dashed border-white/15 flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-base">public</span>
            </div>
          )}
          <input ref={faviconRef} type="file" accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp" className="hidden" onChange={handleFavicon} />
          <button type="button" onClick={() => faviconRef.current?.click()} disabled={faviconUploading}
            className="px-4 py-2 rounded-xl glass-card text-xs font-semibold hover:bg-white/10 transition-all disabled:opacity-60">
            {faviconUploading ? "Yükleniyor..." : "Favicon Yükle"}
          </button>
          {s.faviconUrl && (
            <button type="button" onClick={() => setS(p => ({ ...p, faviconUrl: "" }))}
              className="px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-400/10 transition-all">Kaldır</button>
          )}
        </div>
        <p className="text-[11px] text-on-surface-variant mt-1.5">Önerilen: kare, 512×512 px PNG veya .ico/.svg dosyası. Kaydedip yayınladıktan sonra tarayıcı sekmesinde görünür.</p>
      </div>

      <div className="mb-5">
        <label className="block text-xs text-on-surface-variant mb-1.5">Logo Yazısı (logo görsel yokken gösterilir)</label>
        <input value={s.logoText} onChange={e => setS(p => ({ ...p, logoText: e.target.value }))}
          placeholder="QONTAC" maxLength={60} className={`${inputCls} font-semibold`} />
        <p className="text-[11px] text-on-surface-variant mt-1">Header ve kart altındaki marka yazısı.</p>
      </div>

      {/* Footer İletişim Bilgileri */}
      <div className="border-t border-white/10 pt-5 mb-5">
        <p className="text-sm font-semibold text-on-surface mb-1">Footer İletişim Bilgileri</p>
        <p className="text-[11px] text-on-surface-variant mb-4">Ana sayfa footer'ında gösterilir.</p>
        <div className="mb-4">
          <label className="block text-xs text-on-surface-variant mb-1.5">Footer Açıklama Metni</label>
          <textarea value={s.iletisimAciklama} onChange={e => setS(p => ({ ...p, iletisimAciklama: e.target.value }))} rows={2}
            maxLength={300} className={inputCls} placeholder="Marka açıklama metni" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5">E-posta</label>
            <input value={s.iletisimEmail} onChange={e => setS(p => ({ ...p, iletisimEmail: e.target.value }))} className={inputCls} placeholder="info@qontac.net" />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5">Telefon</label>
            <input value={s.iletisimTelefon} onChange={e => setS(p => ({ ...p, iletisimTelefon: e.target.value }))} className={inputCls} placeholder="+90 (850) ..." />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5">Adres</label>
            <input value={s.iletisimAdres} onChange={e => setS(p => ({ ...p, iletisimAdres: e.target.value }))} className={inputCls} placeholder="Şehir / Ülke" />
          </div>
        </div>
      </div>

      {/* Sosyal Medya Linkleri */}
      <div className="border-t border-white/10 pt-5 mb-5">
        <p className="text-sm font-semibold text-on-surface mb-1">Sosyal Medya Linkleri</p>
        <p className="text-[11px] text-on-surface-variant mb-4">Boş bıraktığınız ikonlar footer'da gösterilmez.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {([
            ["sosyalLinkedin", "LinkedIn", "https://linkedin.com/company/..."],
            ["sosyalInstagram", "Instagram", "https://instagram.com/..."],
            ["sosyalX", "X (Twitter)", "https://x.com/..."],
            ["sosyalFacebook", "Facebook", "https://facebook.com/..."],
            ["sosyalYoutube", "YouTube", "https://youtube.com/@..."],
            ["sosyalWebsite", "Web Sitesi", "https://..."],
          ] as const).map(([key, label, ph]) => (
            <div key={key}>
              <label className="block text-xs text-on-surface-variant mb-1.5">{label}</label>
              <input value={s[key]} onChange={e => setS(p => ({ ...p, [key]: e.target.value }))} className={inputCls} placeholder={ph} />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-on-surface-variant mb-1.5">Google Site Doğrulama Kodu</label>
        <input value={s.googleSiteVerification} onChange={e => setS(p => ({ ...p, googleSiteVerification: e.target.value }))}
          placeholder="google-site-verification meta içeriği (örn. AbC123...)" className={inputCls} />
        <p className="text-[11px] text-on-surface-variant mt-1">Sadece content değerini girin; meta etiketi otomatik eklenir.</p>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-on-surface-variant mb-1.5">Head Kodları (Analytics, Tag Manager vb.)</label>
        <textarea value={s.headKod} onChange={e => setS(p => ({ ...p, headKod: e.target.value }))} rows={4}
          placeholder={'<script>...</script>'} className={`${inputCls} font-mono text-xs`} />
      </div>

      <div className="mb-5">
        <label className="block text-xs text-on-surface-variant mb-1.5">Body Kodları (Reklam, remarketing vb.)</label>
        <textarea value={s.bodyKod} onChange={e => setS(p => ({ ...p, bodyKod: e.target.value }))} rows={4}
          placeholder={'<script>...</script>'} className={`${inputCls} font-mono text-xs`} />
      </div>

      {msg && (
        <p className={`text-xs flex items-center gap-1 mb-3 ${msg.ok ? "text-green-400" : "text-red-400"}`}>
          <span className="material-symbols-outlined text-sm">{msg.ok ? "check_circle" : "error"}</span>{msg.text}
        </p>
      )}
      <button type="submit" disabled={saving}
        className="px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60">
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

interface QnbSettings {
  qnbAktif: boolean; qnbTest: boolean;
  qnbMerchantId: string; qnbUserCode: string; qnbMbrId: string; qnbTerminalId: string;
  qnbCurrency: string; qnbLang: string;
  qnbMerchantPassSet: boolean; qnbApiPasswordSet: boolean;
}

function SanalPos() {
  const [s, setS] = useState<QnbSettings>({
    qnbAktif: false, qnbTest: true, qnbMerchantId: "", qnbUserCode: "", qnbMbrId: "5", qnbTerminalId: "",
    qnbCurrency: "949", qnbLang: "tr", qnbMerchantPassSet: false, qnbApiPasswordSet: false,
  });
  const [pass, setPass] = useState(""); // yeni 3D anahtarı; boşsa mevcut korunur
  const [apiPass, setApiPass] = useState(""); // yeni API şifresi; boşsa mevcut korunur
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all";

  useEffect(() => {
    fetch("/api/admin/sanal-pos").then(r => r.json()).then(j => {
      if (j.ok && j.settings) setS(j.settings);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const res = await fetch("/api/admin/sanal-pos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, qnbMerchantPass: pass, qnbApiPassword: apiPass }),
    });
    const j = await res.json();
    setSaving(false);
    if (j.ok) {
      setS(j.settings);
      setPass(""); setApiPass("");
      setMsg({ ok: true, text: "Sanal POS ayarları kaydedildi." });
    } else {
      setMsg({ ok: false, text: j.error || "Kaydedilemedi." });
    }
  }

  const eksik = s.qnbAktif && (!s.qnbMerchantId || !s.qnbUserCode || !(s.qnbMerchantPassSet || pass));

  return (
    <form onSubmit={handleSave} className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary text-lg">credit_card</span>
        <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Sanal POS Ayarları</h3>
      </div>
      <p className="text-xs text-on-surface-variant mb-5">
        QNB Finansbank Sanal POS (PayFor / 3DHost). Bu bilgiler QNB üye işyeri panelinizden alınır.
        Aktif edildiğinde site üzerinden kredi kartıyla ödeme açılır.
      </p>

      {/* Aktif / Test toggles */}
      <div className="space-y-1 mb-5 border border-white/10 rounded-xl p-2">
        <ToggleControlled
          label="Sanal POS aktif"
          desc="Kapalıysa ödeme sistemi devre dışı kalır; site siparişleri ödeme adımına geçmez."
          on={s.qnbAktif} onChange={v => setS(p => ({ ...p, qnbAktif: v }))} />
        <ToggleControlled
          label="Test ortamı"
          desc={s.qnbTest ? "TEST gate kullanılıyor (vpostest). Gerçek tahsilat yapılmaz." : "CANLI gate kullanılıyor (vpos). Gerçek para çekilir!"}
          on={s.qnbTest} onChange={v => setS(p => ({ ...p, qnbTest: v }))} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">Üye İşyeri No (MerchantID)</label>
          <input value={s.qnbMerchantId} onChange={e => setS(p => ({ ...p, qnbMerchantId: e.target.value }))}
            className={inputCls} placeholder="örn. 085300000021907" />
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">API Kullanıcı Adı (UserCode)</label>
          <input value={s.qnbUserCode} onChange={e => setS(p => ({ ...p, qnbUserCode: e.target.value }))}
            className={inputCls} placeholder="örn. wceapi" />
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">Mağaza 3D Anahtarı (MerchantPass)</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} autoComplete="new-password"
            className={inputCls} placeholder={s.qnbMerchantPassSet ? "•••••••• (kayıtlı — değiştirmek için yazın)" : "QNB panelinden alınan anahtar"} />
          <p className="text-[11px] text-on-surface-variant mt-1">Güvenlik için kayıtlı anahtar geri gösterilmez. Boş bırakırsanız mevcut anahtar korunur.</p>
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">API Şifresi (UserPass)</label>
          <input type="password" value={apiPass} onChange={e => setApiPass(e.target.value)} autoComplete="new-password"
            className={inputCls} placeholder={s.qnbApiPasswordSet ? "•••••••• (kayıtlı — değiştirmek için yazın)" : "API kullanıcı şifresi"} />
          <p className="text-[11px] text-on-surface-variant mt-1">API işlemleri için kullanıcı şifresi. Kayıtlıysa geri gösterilmez; boş bırakılırsa korunur.</p>
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">Terminal ID</label>
          <input value={s.qnbTerminalId} onChange={e => setS(p => ({ ...p, qnbTerminalId: e.target.value }))}
            className={inputCls} placeholder="örn. VP000000" />
          <p className="text-[11px] text-on-surface-variant mt-1">Üye işyeri terminal numarası (varsa).</p>
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">Kurum Kodu (MbrId)</label>
          <input value={s.qnbMbrId} onChange={e => setS(p => ({ ...p, qnbMbrId: e.target.value }))}
            className={inputCls} placeholder="5" />
          <p className="text-[11px] text-on-surface-variant mt-1">QNB Finansbank için varsayılan &quot;5&quot;.</p>
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">Para Birimi</label>
          <select value={s.qnbCurrency} onChange={e => setS(p => ({ ...p, qnbCurrency: e.target.value }))} className={inputCls}>
            <option value="949">TL — Türk Lirası (949)</option>
            <option value="840">USD — Amerikan Doları (840)</option>
            <option value="978">EUR — Euro (978)</option>
            <option value="826">GBP — İngiliz Sterlini (826)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">Ödeme Sayfası Dili</label>
          <select value={s.qnbLang} onChange={e => setS(p => ({ ...p, qnbLang: e.target.value }))} className={inputCls}>
            <option value="tr">Türkçe</option>
            <option value="en">İngilizce</option>
          </select>
        </div>
      </div>

      <div className="text-[11px] text-on-surface-variant bg-surface-dim/60 border border-white/10 rounded-xl px-3 py-2 mb-4">
        <span className="font-semibold text-on-surface">Callback adresi:</span> ödeme sonucu <code>/api/odeme/callback</code> adresine döner —
        QNB panelinde OkUrl/FailUrl olarak bu tanımlı olmalı. Gate adresi test/canlı seçimine göre otomatik ayarlanır.
      </div>

      {eksik && (
        <p className="text-xs flex items-center gap-1 mb-3 text-amber-400">
          <span className="material-symbols-outlined text-sm">warning</span>
          POS aktif ama MerchantID, UserCode ve Mağaza 3D Anahtarı eksiksiz olmalı — aksi halde ödeme açılmaz.
        </p>
      )}
      {msg && (
        <p className={`text-xs flex items-center gap-1 mb-3 ${msg.ok ? "text-green-400" : "text-red-400"}`}>
          <span className="material-symbols-outlined text-sm">{msg.ok ? "check_circle" : "error"}</span>{msg.text}
        </p>
      )}
      <button type="submit" disabled={saving}
        className="px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60">
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

function ToggleControlled({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/3 transition-all text-left">
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
