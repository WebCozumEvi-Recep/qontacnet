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
      <OdemeSonuc />
    </section>
  );
}

// Banka callback'inden dönüşte ?odeme=... parametresine göre sonuç gösterir
function OdemeSonuc() {
  const [sonuc, setSonuc] = useState<{ tip: string; no: string } | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tip = p.get("odeme");
    if (tip) {
      setSonuc({ tip, no: p.get("no") || "" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  if (!sonuc) return null;
  const ok = sonuc.tip === "basarili";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSonuc(null)}>
      <div className="rounded-2xl p-8 w-full max-w-md text-center border border-white/12 shadow-2xl"
        style={{ background: "#121626" }} onClick={(e) => e.stopPropagation()}>
        <span className={`material-symbols-outlined text-6xl mb-4 block ${ok ? "text-green-400" : "text-red-400"}`}>
          {ok ? "check_circle" : "error"}
        </span>
        <h3 className="text-headline-sm font-semibold text-on-surface mb-2" style={{ fontFamily: "Sora, sans-serif" }}>
          {ok ? "Ödemeniz Alındı" : "Ödeme Tamamlanamadı"}
        </h3>
        {sonuc.no && (
          <p className="text-sm text-on-surface-variant mb-2">
            Sipariş No: <span className="text-primary font-bold">{sonuc.no}</span>
          </p>
        )}
        <p className="text-xs text-on-surface-variant mb-6">
          {ok
            ? "Siparişiniz onaylandı. Faturanız ve kargo bilgileriniz e-posta adresinize iletilecek."
            : "Ödeme işlemi tamamlanamadı. Kart bilgilerinizi kontrol edip tekrar deneyebilirsiniz."}
        </p>
        <button onClick={() => setSonuc(null)} className="px-6 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold">
          Kapat
        </button>
      </div>
    </div>
  );
}

// Banka 3D ödeme sayfasına imzalı form POST'u ile yönlendirir
function redirectToBank(paymentForm: { url: string; fields: Record<string, string> }) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentForm.url;
  Object.entries(paymentForm.fields).forEach(([k, v]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

function SiparisModal({ urun, onClose }: { urun: Urun; onClose: () => void }) {
  const [form, setForm] = useState({
    musteriAd: "", firma: "", email: "", telefon: "", adres: "", adet: "1", notlar: "",
    faturaTip: "BIREYSEL", tcKimlik: "", vergiNo: "", vergiDairesi: "", firmaUnvan: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    if (j.ok && j.paymentForm) {
      // Banka ödeme sayfasına yönlendir — buton "Yönlendiriliyor" durumunda kalır
      redirectToBank(j.paymentForm);
      return;
    }
    setSaving(false);
    setError(j.error || "Sipariş oluşturulamadı.");
  }

  const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all text-on-surface";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/12 shadow-2xl"
        style={{ background: "#121626" }} onClick={(e) => e.stopPropagation()}>
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
                <label className="block text-xs text-on-surface-variant mb-1.5">E-posta *</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required className={inputCls} />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-on-surface-variant mb-1.5">Teslimat Adresi *</label>
              <textarea value={form.adres} onChange={(e) => set("adres", e.target.value)} rows={2} required className={inputCls} />
            </div>

            {/* Fatura bilgileri */}
            <div className="mb-4 p-4 rounded-xl bg-white/3 border border-white/8">
              <p className="text-xs font-semibold text-on-surface mb-3">Fatura Bilgileri</p>
              <div className="flex gap-2 mb-3">
                {(["BIREYSEL", "KURUMSAL"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => set("faturaTip", t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      form.faturaTip === t
                        ? "bg-primary/15 text-primary border-primary/40"
                        : "border-white/10 text-on-surface-variant hover:bg-white/5"
                    }`}>
                    {t === "BIREYSEL" ? "Bireysel" : "Kurumsal"}
                  </button>
                ))}
              </div>
              {form.faturaTip === "BIREYSEL" ? (
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1.5">T.C. Kimlik No *</label>
                  <input inputMode="numeric" pattern="[0-9]{11}" maxLength={11} title="11 haneli T.C. kimlik numarası"
                    value={form.tcKimlik} onChange={(e) => set("tcKimlik", e.target.value.replace(/\D/g, ""))} required className={inputCls} />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-on-surface-variant mb-1.5">Firma Unvanı *</label>
                    <input value={form.firmaUnvan} onChange={(e) => set("firmaUnvan", e.target.value)} required className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1.5">Vergi No *</label>
                    <input inputMode="numeric" pattern="[0-9]{10,11}" maxLength={11} title="10-11 haneli vergi numarası"
                      value={form.vergiNo} onChange={(e) => set("vergiNo", e.target.value.replace(/\D/g, ""))} required className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1.5">Vergi Dairesi *</label>
                    <input value={form.vergiDairesi} onChange={(e) => set("vergiDairesi", e.target.value)} required className={inputCls} />
                  </div>
                </div>
              )}
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
                {saving ? "Ödemeye yönlendiriliyor..." : "Ödemeye Geç"}
              </button>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">lock</span>
              Ödeme, QNB sanal POS güvenli ödeme sayfasında 3D Secure ile alınır.
            </p>
          </form>
      </div>
    </div>
  );
}
