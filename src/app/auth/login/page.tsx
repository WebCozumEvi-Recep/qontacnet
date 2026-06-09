"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const REMEMBER_KEY = "qontac_remember";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const [role, setRole] = useState<"uye" | "firma" | "admin">("uye");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Kayıtlı bilgileri yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        const { role: r, email: e, password: p } = JSON.parse(saved);
        setRole(r); setEmail(e); setPassword(p); setRemember(true);
      }
    } catch { /* ignore */ }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password, role);
    setLoading(false);
    if (ok) {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ role, email, password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      const dest = nextUrl ?? (role === "firma" ? "/firma" : role === "admin" ? "/admin" : "/uye");
      router.push(dest);
    } else {
      setError("E-posta veya şifre hatalı.");
    }
  };

  const fillDemo = () => {
    if (role === "firma") {
      setEmail("firma@qontac.net");
      setPassword("123456");
    } else if (role === "admin") {
      setEmail("admin@qontac.net");
      setPassword("qontac123");
    } else {
      setEmail("demo@qontac.net");
      setPassword("123456");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-pattern px-4">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <div className="w-full max-w-[26rem] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold text-primary" style={{ fontFamily: "Sora, sans-serif" }}>
              QONTAC
            </span>
          </Link>
          <p className="text-on-surface-variant text-sm mt-2">Hesabınıza giriş yapın</p>
        </div>

        {/* Role Tabs */}
        <div className="flex glass-card rounded-2xl p-1 mb-6">
          <button
            onClick={() => setRole("uye")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              role === "uye"
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Üye
          </button>
          <button
            onClick={() => setRole("firma")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              role === "firma"
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Firma
          </button>
          <button
            onClick={() => setRole("admin")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              role === "admin"
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Admin
          </button>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-[2rem] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-on-surface-variant mb-1.5 block">E-Posta</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={role === "firma" ? "firma@example.com" : role === "admin" ? "admin@qontac.net" : "uye@example.com"}
                className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary focus:ring-0 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1.5 block">Şifre</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 pr-11 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary focus:ring-0 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-lg">{showPw ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {/* Beni Hatırla */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div onClick={() => setRemember(v => !v)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${remember ? "bg-primary border-primary" : "bg-surface-dim border-white/20 hover:border-white/40"}`}>
                {remember && <span className="material-symbols-outlined text-black text-sm">check</span>}
              </div>
              <span className="text-sm text-on-surface-variant">Beni Hatırla</span>
            </label>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-container text-on-primary-container font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={fillDemo}
              className="w-full py-2.5 glass-card rounded-xl text-on-surface-variant text-sm hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">bolt</span>
              Demo ile dene
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Hesabınız yok mu?{" "}
          <Link href="/auth/register" className="text-primary hover:underline font-medium">
            Kayıt Ol
          </Link>
        </p>
        {role === "firma" && (
          <p className="text-center text-sm text-on-surface-variant mt-2">
            <Link href="/auth/forgot-password" className="text-on-surface-variant/60 hover:text-primary transition-all text-xs">
              Şifremi Unuttum
            </Link>
          </p>
        )}
        <p className="text-center mt-3">
          <Link href="/" className="text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-all">
            ← Ana Sayfaya Dön
          </Link>
        </p>
      </div>
    </div>
  );
}
