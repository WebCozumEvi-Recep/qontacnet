"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { AUTH_TEXT, readLocaleFromCookie } from "@/lib/i18n/auth-text";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const t = AUTH_TEXT[locale];
  useEffect(() => { setLocale(readLocaleFromCookie()); }, []);
  const [role, setRole] = useState<"uye" | "firma">("uye");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    ad: "", soyad: "", email: "", password: "", password2: "",
    firmaAdi: "", telefon: "", sektor: "",
    kvkk: false,
  });

  // Sözleşme onayları — her iki belge de okunup kabul edilmeli
  const [accepted, setAccepted] = useState({ kvkk: false, kosul: false });
  // Açık popup: ilgili sayfa slug'ı + içerik durumu
  const [modal, setModal] = useState<null | {
    slug: "kvkk" | "kullanim-kosullari";
    which: "kvkk" | "kosul";
    baslik: string;
    icerik: string;
    loading: boolean;
    error: boolean;
  }>(null);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  // Her iki belge kabul edilince checkbox otomatik işaretli
  const bothAccepted = accepted.kvkk && accepted.kosul;
  useEffect(() => { set("kvkk", bothAccepted); }, [bothAccepted]);

  const openDoc = async (slug: "kvkk" | "kullanim-kosullari", which: "kvkk" | "kosul") => {
    setModal({ slug, which, baslik: "", icerik: "", loading: true, error: false });
    try {
      const r = await fetch(`/api/sayfa/${slug}?lang=${locale}`);
      const d = await r.json();
      if (d?.ok) {
        setModal({ slug, which, baslik: d.baslik, icerik: d.icerik, loading: false, error: false });
      } else {
        setModal({ slug, which, baslik: "", icerik: "", loading: false, error: true });
      }
    } catch {
      setModal({ slug, which, baslik: "", icerik: "", loading: false, error: true });
    }
  };

  const acceptDoc = () => {
    if (modal) setAccepted(a => ({ ...a, [modal.which]: true }));
    setModal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) return;
    setLoading(true);
    const ok = await register({ ...form, role });
    setLoading(false);
    if (ok) router.push(role === "firma" ? "/firma" : "/uye");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-pattern px-4 py-10">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <div className="w-full max-w-[30rem] relative z-10">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher current={locale} />
        </div>
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold text-primary" style={{ fontFamily: "Sora, sans-serif" }}>
              QONTAC
            </span>
          </Link>
          <p className="text-on-surface-variant text-sm mt-2">{t.registerSubtitle}</p>
        </div>

        {/* Role Tabs */}
        <div className="flex glass-card rounded-2xl p-1 mb-6">
          <button
            onClick={() => setRole("uye")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              role === "uye" ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t.tabMemberReg}
          </button>
          <button
            onClick={() => setRole("firma")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              role === "firma" ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t.tabCompanyReg}
          </button>
        </div>

        <div className="glass-card rounded-[2rem] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {role === "uye" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1.5 block">{t.firstName}</label>
                    <input required value={form.ad} onChange={e => set("ad", e.target.value)}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                      placeholder={t.firstNamePh} />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1.5 block">{t.lastName}</label>
                    <input required value={form.soyad} onChange={e => set("soyad", e.target.value)}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                      placeholder={t.lastNamePh} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1.5 block">{t.email}</label>
                  <input type="email" required value={form.email} onChange={e => set("email", e.target.value)}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                    placeholder="uye@example.com" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1.5 block">{t.companyName}</label>
                  <input required value={form.firmaAdi} onChange={e => set("firmaAdi", e.target.value)}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                    placeholder={t.companyNamePh} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1.5 block">{t.contactName}</label>
                    <input required value={form.ad} onChange={e => set("ad", e.target.value)}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                      placeholder={t.contactNamePh} />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1.5 block">{t.sector}</label>
                    <select value={form.sektor} onChange={e => set("sektor", e.target.value)}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface-variant text-sm focus:border-primary outline-none transition-all">
                      <option value="">{t.sectorSelect}</option>
                      <option value="Teknoloji">{t.sectorTech}</option>
                      <option value="Finans">{t.sectorFinance}</option>
                      <option value="Sağlık">{t.sectorHealth}</option>
                      <option value="Eğitim">{t.sectorEducation}</option>
                      <option value="Perakende">{t.sectorRetail}</option>
                      <option value="Diğer">{t.sectorOther}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1.5 block">{t.email}</label>
                  <input type="email" required value={form.email} onChange={e => set("email", e.target.value)}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                    placeholder="admin@firma.com" />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-on-surface-variant mb-1.5 block">{t.password}</label>
              <input type="password" required minLength={6} value={form.password} onChange={e => set("password", e.target.value)}
                className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                placeholder={t.passwordPh} />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1.5 block">{t.passwordRepeat}</label>
              <input type="password" required value={form.password2} onChange={e => set("password2", e.target.value)}
                className={`w-full bg-surface-dim border rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all ${
                  form.password2 && form.password !== form.password2 ? "border-red-500" : "border-white/10"
                }`}
                placeholder={t.passwordRepeatPh} />
              {form.password2 && form.password !== form.password2 && (
                <p className="text-red-400 text-xs mt-1">{t.passwordMismatch}</p>
              )}
            </div>

            <div className="flex items-start gap-2.5">
              {/* Onay kutusu: yalnız her iki belge okunup kabul edilince işaretlenir */}
              <button
                type="button"
                onClick={() => {
                  if (bothAccepted) setAccepted({ kvkk: false, kosul: false });
                  else if (!accepted.kvkk) openDoc("kvkk", "kvkk");
                  else openDoc("kullanim-kosullari", "kosul");
                }}
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                  bothAccepted ? "bg-primary border-primary" : "bg-surface-dim border-white/25 hover:border-primary"
                }`}
                aria-label="KVKK ve Kullanım Koşulları onayı"
              >
                {bothAccepted && <span className="material-symbols-outlined text-black text-sm">check</span>}
              </button>
              {/* Form doğrulaması için gizli zorunlu alan */}
              <input type="checkbox" required checked={form.kvkk} onChange={() => {}} className="hidden" />
              <span className="text-xs text-on-surface-variant leading-relaxed">
                {t.kvkkPre}
                <button type="button" onClick={() => openDoc("kvkk", "kvkk")}
                  className={`underline hover:text-primary ${accepted.kvkk ? "text-primary font-medium" : "text-primary"}`}>
                  {t.kvkkDoc}{accepted.kvkk ? " ✓" : ""}
                </button>{t.kvkkMid}
                <button type="button" onClick={() => openDoc("kullanim-kosullari", "kosul")}
                  className={`underline hover:text-primary ${accepted.kosul ? "text-primary font-medium" : "text-primary"}`}>
                  {t.kvkkTerms}{accepted.kosul ? " ✓" : ""}
                </button>{t.kvkkPost}
              </span>
            </div>

            <button type="submit" disabled={loading || (!!form.password2 && form.password !== form.password2)}
              className="w-full py-3.5 bg-primary-container text-on-primary-container font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>{t.saving}</>
              ) : t.register}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          {t.haveAccount}{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">{t.login}</Link>
        </p>
        <p className="text-center mt-3">
          <Link href="/" className="text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-all">{t.backHome}</Link>
        </p>
      </div>

      {/* Sözleşme popup'ı */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col glass-card rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "#15151a" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
              <h3 className="text-on-surface font-bold text-base pr-4">
                {modal.loading ? t.modalLoading : modal.error ? t.modalError : modal.baslik}
              </h3>
              <button type="button" onClick={() => setModal(null)}
                className="text-on-surface-variant hover:text-on-surface flex-shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1">
              {modal.loading ? (
                <div className="flex items-center justify-center py-12 text-on-surface-variant gap-2">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  {t.modalLoading}
                </div>
              ) : modal.error ? (
                <p className="text-red-400 text-sm py-8 text-center">{t.modalError}</p>
              ) : (
                <div
                  className="ck-content prose-custom text-on-surface-variant text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: modal.icerik }}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
              <button type="button" onClick={() => setModal(null)}
                className="px-5 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface text-sm transition-all">
                {t.modalClose}
              </button>
              <button type="button" onClick={acceptDoc} disabled={modal.loading || modal.error}
                className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                {t.modalAccept}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
