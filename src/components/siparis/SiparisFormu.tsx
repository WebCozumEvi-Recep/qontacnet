"use client";
import { useEffect, useState } from "react";
import { PRODUCTS_TEXT, type ProductsText } from "@/lib/i18n/ui-text";
import { KartFormu, BOS_KART, type KartAlanlari } from "@/components/odeme/KartFormu";
import { odemeyeGit, type OdemeYaniti } from "@/components/odeme/odeme-yonlendir";

export interface SiparisUrun { id: string; ad: string; fiyat: number }

interface Props {
  urun: SiparisUrun;
  t?: ProductsText;
  /** Siparişin gönderileceği uç (ana sayfa: /api/siparis, firma sayfası: /api/f/<id>/siparis). */
  endpoint?: string;
  /** Verilirse başlık ve İptal butonu gösterilir (modal kullanımı). */
  onClose?: () => void;
  /** "Firma" serbest metin alanı gösterilsin mi. */
  firmaAlani?: boolean;
  /** Banka ekranına geçmeden hemen önce sipariş yanıtıyla çağrılır. */
  onOdemeOncesi?: (yanit: { siparisNo: string; hesapToken?: string | null }) => void;
}

// Ürün satın alma formu: müşteri + fatura + (gerekiyorsa) kart bilgisi → 3D ödeme.
export function SiparisFormu({ urun, t = PRODUCTS_TEXT, endpoint = "/api/siparis", onClose, firmaAlani = true, onOdemeOncesi }: Props) {
  const [form, setForm] = useState({
    musteriAd: "", firma: "", email: "", telefon: "", adres: "", adet: "1", notlar: "",
    faturaTip: "BIREYSEL", tcKimlik: "", vergiNo: "", vergiDairesi: "", firmaUnvan: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [kart, setKart] = useState<KartAlanlari>(BOS_KART);
  // Seçili ödeme sağlayıcısı kart bilgisini bizden mi bekliyor? (DijiGate: evet, QNB: hayır)
  const [kartGerekli, setKartGerekli] = useState(false);

  useEffect(() => {
    fetch("/api/odeme/durum")
      .then(r => r.json())
      .then(j => { if (j?.ok) setKartGerekli(Boolean(j.kartGerekli)); })
      .catch(() => {});
  }, []);

  const adetNum = Math.max(1, Number(form.adet) || 1);
  const toplam = urun.fiyat * adetNum;

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, urunId: urun.id, adet: adetNum, ...(kartGerekli ? { kart } : {}) }),
    });
    const j = await res.json();
    if (j.ok && j.odeme) {
      onOdemeOncesi?.(j);
      // Banka 3D ekranına yönlendir — buton "Yönlendiriliyor" durumunda kalır
      odemeyeGit(j.odeme as OdemeYaniti);
      return;
    }
    setSaving(false);
    setError(j.error || t.orderFailed);
  }

  const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all text-on-surface";

  return (
    <form onSubmit={handleSubmit}>
        {onClose && (
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-headline-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
              {urun.ad} — {t.order}
            </h3>
            <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5">{t.nameLabel} *</label>
            <input value={form.musteriAd} onChange={(e) => set("musteriAd", e.target.value)} required className={inputCls} />
          </div>
          {firmaAlani && (
            <div>
              <label className="block text-xs text-on-surface-variant mb-1.5">{t.firmLabel}</label>
              <input value={form.firma} onChange={(e) => set("firma", e.target.value)} className={inputCls} />
            </div>
          )}
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5">{t.phoneLabel} *</label>
            <input type="tel" value={form.telefon} onChange={(e) => set("telefon", e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5">{t.emailLabel} *</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required className={inputCls} />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-on-surface-variant mb-1.5">{t.addressLabel} *</label>
          <textarea value={form.adres} onChange={(e) => set("adres", e.target.value)} rows={2} required className={inputCls} />
        </div>

        {/* Fatura bilgileri */}
        <div className="mb-4 p-4 rounded-xl bg-white/3 border border-white/8">
          <p className="text-xs font-semibold text-on-surface mb-3">{t.invoiceInfo}</p>
          <div className="flex gap-2 mb-3">
            {(["BIREYSEL", "KURUMSAL"] as const).map((ft) => (
              <button key={ft} type="button" onClick={() => set("faturaTip", ft)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  form.faturaTip === ft
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "border-white/10 text-on-surface-variant hover:bg-white/5"
                }`}>
                {ft === "BIREYSEL" ? t.individual : t.corporate}
              </button>
            ))}
          </div>
          {form.faturaTip === "BIREYSEL" ? (
            <div>
              <label className="block text-xs text-on-surface-variant mb-1.5">{t.tcNo} *</label>
              <input inputMode="numeric" pattern="[0-9]{11}" maxLength={11} title={t.tcHint}
                value={form.tcKimlik} onChange={(e) => set("tcKimlik", e.target.value.replace(/\D/g, ""))} required className={inputCls} />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs text-on-surface-variant mb-1.5">{t.firmTitle} *</label>
                <input value={form.firmaUnvan} onChange={(e) => set("firmaUnvan", e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1.5">{t.taxNo} *</label>
                <input inputMode="numeric" pattern="[0-9]{10,11}" maxLength={11} title={t.taxHint}
                  value={form.vergiNo} onChange={(e) => set("vergiNo", e.target.value.replace(/\D/g, ""))} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1.5">{t.taxOffice} *</label>
                <input value={form.vergiDairesi} onChange={(e) => set("vergiDairesi", e.target.value)} required className={inputCls} />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 items-end">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5">{t.quantity}</label>
            <input type="number" min={1} max={1000} value={form.adet} onChange={(e) => set("adet", e.target.value)} className={inputCls} />
          </div>
          <div className="text-right">
            <p className="text-xs text-on-surface-variant mb-1">{t.total}</p>
            <p className="text-headline-sm font-bold text-primary" style={{ fontFamily: "Sora, sans-serif" }}>
              ₺{toplam.toLocaleString("tr-TR")}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs text-on-surface-variant mb-1.5">{t.note}</label>
          <textarea value={form.notlar} onChange={(e) => set("notlar", e.target.value)} rows={2} className={inputCls} />
        </div>

        {kartGerekli && (
          <div className="mb-5">
            <KartFormu kart={kart} onChange={setKart} />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1 mb-3">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}

        <div className="flex gap-3">
          {onClose && (
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl glass-card text-sm font-semibold text-on-surface hover:bg-white/10 transition-all">
              {t.cancel}
            </button>
          )}
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-primary-container text-on-primary-container text-sm font-bold hover:scale-[1.02] transition-all disabled:opacity-60">
            {saving ? t.redirecting : t.toPayment}
          </button>
        </div>
        <p className="text-[11px] text-on-surface-variant mt-3 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">lock</span>
          {t.securePay}
        </p>
      </form>
  );
}
