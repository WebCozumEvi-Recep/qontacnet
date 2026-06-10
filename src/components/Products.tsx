"use client";
import { useEffect, useState } from "react";

interface Urun {
  id: string;
  ad: string;
  aciklama: string;
  fiyat: number;
  gorsel: string;
  tip: string;
}

const TIP_LABEL: Record<string, string> = {
  NFC_KART: "NFC Kart",
  AKSESUAR: "Aksesuar",
  LISANS: "Lisans",
};

export default function Products() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [secili, setSecili] = useState<Urun | null>(null);

  useEffect(() => {
    fetch("/api/urunler")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setUrunler(j.urunler); })
      .catch(() => {});
  }, []);

  if (urunler.length === 0) return null;

  return (
    <section id="urunler" className="py-xl">
      <div className="max-w-container-max mx-auto px-10">
        <div className="text-center mb-xl">
          <h2 className="text-headline-md md:text-display-lg font-bold text-on-background" style={{ fontFamily: "Sora, sans-serif" }}>
            Ürünler
          </h2>
          <p className="text-on-surface-variant mt-2 text-sm md:text-base">
            NFC kartlarınızı ve aksesuarlarınızı doğrudan sipariş edin.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-lg">
          {urunler.map((u) => (
            <div key={u.id} className="glass-card rounded-[2rem] p-lg flex flex-col border-white/5">
              {u.gorsel ? (
                <img src={u.gorsel} alt={u.ad} className="w-full h-48 object-cover rounded-2xl mb-md border border-white/10" />
              ) : (
                <div className="w-full h-48 rounded-2xl mb-md bg-primary/5 border border-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-5xl">nfc</span>
                </div>
              )}
              <span className="text-xs text-primary font-semibold mb-1">{TIP_LABEL[u.tip] ?? u.tip}</span>
              <h3 className="text-headline-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>
                {u.ad}
              </h3>
              <p className="text-sm text-on-surface-variant mb-md flex-1">{u.aciklama}</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-headline-sm font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
                  ₺{u.fiyat.toLocaleString("tr-TR")}
                </span>
                <button
                  onClick={() => setSecili(u)}
                  className="bg-primary-container text-on-primary-container font-bold px-5 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all text-label-md"
                >
                  Satın Al
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {secili && <SiparisModal urun={secili} onClose={() => setSecili(null)} />}
    </section>
  );
}

function SiparisModal({ urun, onClose }: { urun: Urun; onClose: () => void }) {
  const [form, setForm] = useState({ musteriAd: "", firma: "", email: "", telefon: "", adres: "", adet: "1", notlar: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [siparisNo, setSiparisNo] = useState("");

  const adetNum = Math.max(1, Number(form.adet) || 1);
  const toplam = urun.fiyat * adetNum;

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/siparis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, urunId: urun.id, adet: adetNum }),
    });
    const j = await res.json();
    setSaving(false);
    if (j.ok) setSiparisNo(j.siparisNo);
    else setError(j.error || "Sipariş oluşturulamadı.");
  }

  const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all text-on-surface";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-full max-w-lg bg-surface-container-low max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {siparisNo ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-green-400 text-6xl mb-4 block">check_circle</span>
            <h3 className="text-headline-sm font-semibold text-on-surface mb-2" style={{ fontFamily: "Sora, sans-serif" }}>
              Siparişiniz Alındı
            </h3>
            <p className="text-sm text-on-surface-variant mb-1">Sipariş numaranız:</p>
            <p className="text-primary font-bold text-lg mb-6">{siparisNo}</p>
            <p className="text-xs text-on-surface-variant mb-6">Ekibimiz ödeme ve teslimat için en kısa sürede sizinle iletişime geçecek.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold">
              Kapat
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-headline-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
                {urun.ad} — Sipariş
              </h3>
              <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1.5">Ad Soyad *</label>
                <input value={form.musteriAd} onChange={(e) => set("musteriAd", e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1.5">Firma</label>
                <input value={form.firma} onChange={(e) => set("firma", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1.5">Telefon *</label>
                <input type="tel" value={form.telefon} onChange={(e) => set("telefon", e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1.5">E-posta</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-on-surface-variant mb-1.5">Teslimat Adresi</label>
              <textarea value={form.adres} onChange={(e) => set("adres", e.target.value)} rows={2} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 items-end">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1.5">Adet</label>
                <input type="number" min={1} max={1000} value={form.adet} onChange={(e) => set("adet", e.target.value)} className={inputCls} />
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant mb-1">Toplam</p>
                <p className="text-headline-sm font-bold text-primary" style={{ fontFamily: "Sora, sans-serif" }}>
                  ₺{toplam.toLocaleString("tr-TR")}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs text-on-surface-variant mb-1.5">Not</label>
              <textarea value={form.notlar} onChange={(e) => set("notlar", e.target.value)} rows={2} className={inputCls} />
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1 mb-3">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl glass-card text-sm font-semibold text-on-surface hover:bg-white/10 transition-all">
                İptal
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-primary-container text-on-primary-container text-sm font-bold hover:scale-[1.02] transition-all disabled:opacity-60">
                {saving ? "Gönderiliyor..." : "Siparişi Gönder"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
