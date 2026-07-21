"use client";
import { useState } from "react";

export default function SifrePage() {
  const [form, setForm] = useState({ eski: "", yeni: "", tekrar: "" });
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState<{ tip: "ok" | "hata"; metin: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMesaj(null);
    if (form.yeni !== form.tekrar) { setMesaj({ tip: "hata", metin: "Yeni şifreler eşleşmiyor." }); return; }
    if (form.yeni.length < 6) { setMesaj({ tip: "hata", metin: "Yeni şifre en az 6 karakter olmalı." }); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eski: form.eski, yeni: form.yeni }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error ?? "Değiştirilemedi.");
      setMesaj({ tip: "ok", metin: "Şifreniz güncellendi." });
      setForm({ eski: "", yeni: "", tekrar: "" });
    } catch (err) {
      setMesaj({ tip: "hata", metin: err instanceof Error ? err.message : "Hata" });
    } finally { setLoading(false); }
  };

  const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all";
  const labelCls = "text-xs text-on-surface-variant mb-1.5 block";

  return (
    <div className="max-w-md">
      <form onSubmit={onSubmit} className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Şifre Değişikliği</h3>
        <p className="text-xs text-on-surface-variant mb-4">Hesabına giriş yaparken kullandığın şifreyi buradan güncelleyebilirsin.</p>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Mevcut şifre</label>
            <input type="password" autoComplete="current-password" value={form.eski}
              onChange={e => setForm({ ...form, eski: e.target.value })} className={inputCls} placeholder="••••••" />
          </div>
          <div>
            <label className={labelCls}>Yeni şifre</label>
            <input type="password" autoComplete="new-password" value={form.yeni}
              onChange={e => setForm({ ...form, yeni: e.target.value })} className={inputCls} placeholder="En az 6 karakter" />
          </div>
          <div>
            <label className={labelCls}>Yeni şifre (tekrar)</label>
            <input type="password" autoComplete="new-password" value={form.tekrar}
              onChange={e => setForm({ ...form, tekrar: e.target.value })} className={inputCls} placeholder="••••••" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-5">
          <button type="submit" disabled={loading || !form.eski || !form.yeni || !form.tekrar}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container font-semibold rounded-xl text-sm hover:scale-[1.02] transition-all disabled:opacity-50">
            <span className={`material-symbols-outlined text-base ${loading ? "animate-spin" : ""}`}>{loading ? "progress_activity" : "key"}</span>
            {loading ? "Güncelleniyor..." : "Şifreyi Değiştir"}
          </button>
          {mesaj && (
            <span className={`flex items-center gap-1.5 text-sm ${mesaj.tip === "ok" ? "text-tertiary" : "text-red-400"}`}>
              <span className="material-symbols-outlined text-base">{mesaj.tip === "ok" ? "check_circle" : "error"}</span>
              {mesaj.metin}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
