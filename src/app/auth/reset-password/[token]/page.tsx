"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "uye" ? "uye" : "firma";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Şifreler eşleşmiyor."); return; }
    if (password.length < 6) { setError("Şifre en az 6 karakter olmalı."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, role }),
    });
    const j = await res.json();
    setLoading(false);
    if (j.ok) {
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2500);
    } else {
      setError(j.error ?? "Bir hata oluştu.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg,#050816 0%,#0d0b09 60%,#050816 100%)" }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-black text-primary tracking-widest" style={{ fontFamily: "Sora, sans-serif" }}>QONTAC</Link>
          <p className="text-on-surface-variant text-sm mt-2">Yeni Şifre Belirle</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {done ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-tertiary/10 border border-tertiary/20 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-tertiary text-2xl">check_circle</span>
              </div>
              <div>
                <p className="text-on-surface font-semibold">Şifreniz güncellendi!</p>
                <p className="text-on-surface-variant text-sm mt-1">Giriş sayfasına yönlendiriliyorsunuz...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1.5">Yeni Şifre</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••" minLength={6}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1.5">Yeni Şifre Tekrar</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  placeholder="••••••••" minLength={6}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all" />
              </div>
              {error && <p className="text-xs text-red-400 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{error}</p>}
              <button type="submit" disabled={loading || !password || !confirm}
                className="w-full py-3 bg-primary text-black font-semibold rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 text-sm">
                {loading ? "Kaydediliyor..." : "Şifremi Güncelle"}
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
