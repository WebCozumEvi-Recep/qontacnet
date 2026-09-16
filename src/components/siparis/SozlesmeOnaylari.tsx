"use client";
import { useEffect, useState } from "react";
import { SOZLESME, sozlesmeDoldur, type SozlesmeDegerleri, type SozlesmeSlug } from "@/lib/sozlesmeler";

type Aktifler = Partial<Record<SozlesmeSlug, { baslik: string }>>;

// Yer tutucuları alıcı/sipariş bilgisiyle doldurulan metinler
const DOLDURULAN: SozlesmeSlug[] = [SOZLESME.onBilgi, SOZLESME.mesafeli];

export interface SozlesmeOnayDurumu { satis: boolean; uyelik: boolean }

interface Props {
  /** Üyelik sözleşmesi + KVKK onayı da istensin mi (firma satış sayfası). */
  uyelik: boolean;
  degerler: SozlesmeDegerleri;
  onay: SozlesmeOnayDurumu;
  onChange: (onay: SozlesmeOnayDurumu) => void;
}

// Satın alma formunun altındaki zorunlu sözleşme onayları. Yalnız admin'de aktif
// olan sözleşmeler gösterilir; sunucu da aynı listeye göre onay ister.
export function SozlesmeOnaylari({ uyelik, degerler, onay, onChange }: Props) {
  const [aktif, setAktif] = useState<Aktifler>({});
  const [acik, setAcik] = useState<{ slug: SozlesmeSlug; baslik: string; icerik: string; durum: "yukleniyor" | "hazir" | "hata" } | null>(null);

  useEffect(() => {
    fetch("/api/sozlesmeler").then(r => r.json()).then(j => { if (j?.ok) setAktif(j.sozlesmeler); }).catch(() => {});
  }, []);

  function ac(slug: SozlesmeSlug) {
    setAcik({ slug, baslik: aktif[slug]?.baslik ?? "", icerik: "", durum: "yukleniyor" });
    fetch(`/api/sayfa/${slug}`)
      .then(r => r.json())
      .then(j => {
        if (!j?.ok) throw new Error();
        setAcik({ slug, baslik: j.baslik, icerik: j.icerik, durum: "hazir" });
      })
      .catch(() => setAcik(a => (a ? { ...a, durum: "hata" } : a)));
  }

  const Bag = ({ slug }: { slug: SozlesmeSlug }) => (
    <button type="button" onClick={() => ac(slug)} className="text-primary underline underline-offset-2 hover:opacity-80">
      {aktif[slug]?.baslik}
    </button>
  );

  const satis = [SOZLESME.onBilgi, SOZLESME.mesafeli].filter(s => aktif[s]);
  const uyelikMetinleri = uyelik ? [SOZLESME.uyelik, SOZLESME.kvkk].filter(s => aktif[s]) : [];
  const bilgi = [SOZLESME.iade, ...(uyelik ? [] : [SOZLESME.kvkk])].filter(s => aktif[s]);
  if (!satis.length && !uyelikMetinleri.length && !bilgi.length) return null;

  const liste = (sluglar: SozlesmeSlug[]) => sluglar.map((s, i) => (
    <span key={s}>{i > 0 && (i === sluglar.length - 1 ? " ve " : ", ")}<Bag slug={s} /></span>
  ));

  return (
    <div className="mb-5 space-y-3 text-xs text-on-surface-variant">
      {satis.length > 0 && (
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" required checked={onay.satis} onChange={e => onChange({ ...onay, satis: e.target.checked })}
            className="mt-0.5 w-4 h-4 accent-[#d4af37] flex-shrink-0" />
          <span>{liste(satis)} metinlerini okudum ve onaylıyorum. *</span>
        </label>
      )}
      {uyelikMetinleri.length > 0 && (
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" required checked={onay.uyelik} onChange={e => onChange({ ...onay, uyelik: e.target.checked })}
            className="mt-0.5 w-4 h-4 accent-[#d4af37] flex-shrink-0" />
          <span>Ödeme sonrası adıma üyelik hesabı açılmasını kabul ediyorum; {liste(uyelikMetinleri)} metinlerini okudum. *</span>
        </label>
      )}
      {bilgi.length > 0 && <p className="pl-6">Bilgilendirme: {liste(bilgi)}</p>}

      {acik && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setAcik(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/12 shadow-2xl" style={{ background: "#121626" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h3 className="text-base font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{acik.baslik}</h3>
              <button type="button" onClick={() => setAcik(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
              {acik.durum === "yukleniyor" && <p className="text-sm text-on-surface-variant">Yükleniyor...</p>}
              {acik.durum === "hata" && <p className="text-sm text-red-400">Metin yüklenemedi, lütfen tekrar deneyin.</p>}
              {acik.durum === "hazir" && (
                <div className="ck-content prose-custom text-on-surface-variant text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOLDURULAN.includes(acik.slug) ? sozlesmeDoldur(acik.icerik, degerler) : acik.icerik }} />
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/8 flex justify-end">
              <button type="button" onClick={() => setAcik(null)} className="px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
