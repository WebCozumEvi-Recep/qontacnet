"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "uye" ? "uye" : "firma";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const j = await res.json();
    setLoading(false);
    if (j.ok) setSent(true);
    else setError(j.error ?? "Bir hata oluştu.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg,#050816 0%,#0d0b09 60%,#050816 100%)" }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-black text-primary tracking-widest" style={{ fontFamily: "Sora, sans-serif" }}>QONTAC</Link>
          <p className="text-on-surface-variant text-sm mt-2">Şifre Sıfırlama</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-tertiary/10 border border-tertiary/20 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-tertiary text-2xl">mark_email_read</span>
              </div>
              <div>
                <p className="text-on-surface font-semibold">E-posta gönderildi!</p>
                <p className="text-on-surface-variant text-sm mt-1">Gelen kutunuzu kontrol edin. Bağlantı 1 saat geçerlidir.</p>
              </div>
              <Link href="/auth/login" className="inline-block text-sm text-primary hover:underline">Giriş sayfasına dön →</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-on-surface-variant mb-4">{role === "uye" ? "Üye" : "Firma"} e-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.</p>
                <label className="text-xs text-on-surface-variant block mb-1.5">E-Posta</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder={role === "uye" ? "uye@ornek.com" : "firma@ornek.com"}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all" />
              </div>
              {error && <p className="text-xs text-red-400 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{error}</p>}
              <button type="submit" disabled={loading || !email}
                className="w-full py-3 bg-primary text-black font-semibold rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 text-sm">
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-on-surface-variant">
          <Link href="/auth/login" className="text-primary hover:underline">← Giriş sayfasına dön</Link>
        </p>
      </div>
    </div>
  );
}
