"use client";
import { useState } from "react";

export default function DemoForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ad: "", firma: "", email: "", telefon: "", uyeSayisi: "", mesaj: "" });

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/demo-talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Bir hata oluştu.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="demo" className="py-xl bg-surface-container-high relative overflow-hidden">
      <div className="max-w-container-max mx-auto px-10 grid lg:grid-cols-2 gap-lg items-center">
        {/* Text */}
        <div>
          <h2
            className="text-headline-md md:text-display-lg font-bold mb-6 text-on-background"
            style={{ fontFamily: "Sora, sans-serif", lineHeight: 1.2 }}
          >
            Firmanız için örnek{" "}
            <span className="text-primary">dijital demo</span> hazırlayalım
          </h2>
          <p className="text-body-lg text-on-surface-variant mb-lg leading-relaxed">
            Ekibinizin büyüklüğünü ve ihtiyaçlarınızı paylaşın, size özel sunumumuzu
            hazırlayıp iletişime geçelim.
          </p>
          <div className="flex items-center gap-sm">
            <div className="flex -space-x-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full border-2 border-surface bg-surface-container-highest flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-base">person</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-on-surface-variant">
              <span className="text-white font-bold">500+</span> Firma QONTAC kullanıyor
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="glass-card p-lg rounded-[2.5rem]">
          {submitted ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-tertiary text-6xl mb-4 block">
                check_circle
              </span>
              <h3
                className="text-white text-xl font-bold mb-2"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                Talebiniz alındı!
              </h3>
              <p className="text-on-surface-variant text-sm">
                En kısa sürede sizinle iletişime geçeceğiz.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-sm">
              <div className="grid md:grid-cols-2 gap-sm">
                <input value={form.ad} onChange={upd("ad")}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50 text-sm"
                  placeholder="Ad Soyad" type="text" required />
                <input value={form.firma} onChange={upd("firma")}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50 text-sm"
                  placeholder="Firma Adı" type="text" required />
              </div>
              <input value={form.email} onChange={upd("email")}
                className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50 text-sm"
                placeholder="E-Posta Adresi" type="email" required />
              <div className="grid md:grid-cols-2 gap-sm">
                <input value={form.telefon} onChange={upd("telefon")}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50 text-sm"
                  placeholder="Telefon" type="tel" />
                <select value={form.uyeSayisi} onChange={upd("uyeSayisi")}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all text-on-surface-variant text-sm">
                  <option value="">Üye Sayısı</option>
                  <option value="0-100">0-100</option>
                  <option value="100-500">100-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>
              <textarea value={form.mesaj} onChange={upd("mesaj")}
                className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50 text-sm resize-none"
                placeholder="Mesajınız..." rows={3} />
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-on-primary-container font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Gönderiliyor...
                  </>
                ) : (
                  "Talep Gönder"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
