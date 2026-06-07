"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"uye" | "firma">("uye");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    ad: "", soyad: "", email: "", password: "", password2: "",
    firmaAdi: "", telefon: "", sektor: "",
    kvkk: false,
  });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

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
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold text-primary" style={{ fontFamily: "Sora, sans-serif" }}>
              QONTAC
            </span>
          </Link>
          <p className="text-on-surface-variant text-sm mt-2">Yeni hesap oluşturun</p>
        </div>

        {/* Role Tabs */}
        <div className="flex glass-card rounded-2xl p-1 mb-6">
          <button
            onClick={() => setRole("uye")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              role === "uye" ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Üye Kaydı
          </button>
          <button
            onClick={() => setRole("firma")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              role === "firma" ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Firma Kaydı
          </button>
        </div>

        <div className="glass-card rounded-[2rem] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {role === "uye" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1.5 block">Ad</label>
                    <input required value={form.ad} onChange={e => set("ad", e.target.value)}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                      placeholder="Adınız" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1.5 block">Soyad</label>
                    <input required value={form.soyad} onChange={e => set("soyad", e.target.value)}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                      placeholder="Soyadınız" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1.5 block">E-Posta</label>
                  <input type="email" required value={form.email} onChange={e => set("email", e.target.value)}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                    placeholder="uye@example.com" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1.5 block">Firma Adı</label>
                  <input required value={form.firmaAdi} onChange={e => set("firmaAdi", e.target.value)}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                    placeholder="Firma Adı A.Ş." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1.5 block">Yetkili Ad</label>
                    <input required value={form.ad} onChange={e => set("ad", e.target.value)}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                      placeholder="Ad Soyad" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1.5 block">Sektör</label>
                    <select value={form.sektor} onChange={e => set("sektor", e.target.value)}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface-variant text-sm focus:border-primary outline-none transition-all">
                      <option value="">Seçin</option>
                      <option>Teknoloji</option>
                      <option>Finans</option>
                      <option>Sağlık</option>
                      <option>Eğitim</option>
                      <option>Perakende</option>
                      <option>Diğer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1.5 block">E-Posta</label>
                  <input type="email" required value={form.email} onChange={e => set("email", e.target.value)}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                    placeholder="admin@firma.com" />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-on-surface-variant mb-1.5 block">Şifre</label>
              <input type="password" required minLength={6} value={form.password} onChange={e => set("password", e.target.value)}
                className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all"
                placeholder="En az 6 karakter" />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1.5 block">Şifre Tekrar</label>
              <input type="password" required value={form.password2} onChange={e => set("password2", e.target.value)}
                className={`w-full bg-surface-dim border rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all ${
                  form.password2 && form.password !== form.password2 ? "border-red-500" : "border-white/10"
                }`}
                placeholder="Şifreyi tekrar girin" />
              {form.password2 && form.password !== form.password2 && (
                <p className="text-red-400 text-xs mt-1">Şifreler eşleşmiyor</p>
              )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" required checked={form.kvkk} onChange={e => set("kvkk", e.target.checked)}
                className="mt-0.5 accent-primary" />
              <span className="text-xs text-on-surface-variant">
                <a href="#" className="text-primary hover:underline">KVKK Aydınlatma Metni</a>'ni ve{" "}
                <a href="#" className="text-primary hover:underline">Kullanım Koşulları</a>'nı okudum, kabul ediyorum.
              </span>
            </label>

            <button type="submit" disabled={loading || (!!form.password2 && form.password !== form.password2)}
              className="w-full py-3.5 bg-primary-container text-on-primary-container font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Kaydediliyor...</>
              ) : "Kayıt Ol"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Zaten hesabınız var mı?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">Giriş Yap</Link>
        </p>
        <p className="text-center mt-3">
          <Link href="/" className="text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-all">← Ana Sayfaya Dön</Link>
        </p>
      </div>
    </div>
  );
}
