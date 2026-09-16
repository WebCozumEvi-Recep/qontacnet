"use client";
import { useEffect, useState } from "react";
import { PRODUCTS_TEXT, type ProductsText } from "@/lib/i18n/ui-text";
import { SiparisFormu } from "@/components/siparis/SiparisFormu";
import { Lightbox } from "@/components/urun/Galeri";
import { tumGorseller } from "@/lib/urun-gorsel";

interface Urun {
  id: string;
  ad: string;
  aciklama: string;
  fiyat: number;
  gorsel: string;
  gorseller?: string;
  tip: string;
}

const TIP_LABEL: Record<string, string> = {
  NFC_KART: "NFC Kart",
  AKSESUAR: "Aksesuar",
  LISANS: "Lisans",
};

export default function Products({ t = PRODUCTS_TEXT }: { t?: ProductsText }) {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [secili, setSecili] = useState<Urun | null>(null);
  const [galeri, setGaleri] = useState<{ gorseller: string[]; index: number; ad: string } | null>(null);

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
            {t.title}
          </h2>
          <p className="text-on-surface-variant mt-2 text-sm md:text-base">
            {t.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
          {urunler.map((u) => (
            <div key={u.id} className="glass-card rounded-[2rem] p-lg flex flex-col border-white/5">
              {(() => {
                const gs = tumGorseller(u);
                return gs.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setGaleri({ gorseller: gs, index: 0, ad: u.ad })}
                    className="group relative w-full h-96 mb-md rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] cursor-zoom-in"
                    aria-label={`${u.ad} görsellerini büyüt`}
                  >
                    <img src={gs[0]} alt={u.ad} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-3xl drop-shadow-lg">zoom_in</span>
                    </span>
                    {gs.length > 1 && (
                      <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium">
                        <span className="material-symbols-outlined text-[14px]">photo_library</span>
                        {gs.length}
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="w-full h-96 rounded-2xl mb-md bg-primary/5 border border-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-5xl">nfc</span>
                  </div>
                );
              })()}
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
                  {t.buy}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {secili && <SiparisModal urun={secili} onClose={() => setSecili(null)} t={t} />}
      {galeri && (
        <Lightbox
          gorseller={galeri.gorseller}
          baslangic={galeri.index}
          ad={galeri.ad}
          onClose={() => setGaleri(null)}
          t={t}
        />
      )}
      <OdemeSonuc t={t} />
    </section>
  );
}

// Banka callback'inden dönüşte ?odeme=... parametresine göre sonuç gösterir
function OdemeSonuc({ t }: { t: ProductsText }) {
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
          {ok ? t.payOk : t.payFail}
        </h3>
        {sonuc.no && (
          <p className="text-sm text-on-surface-variant mb-2">
            {t.orderNo}: <span className="text-primary font-bold">{sonuc.no}</span>
          </p>
        )}
        <p className="text-xs text-on-surface-variant mb-6">
          {ok ? t.payOkDesc : t.payFailDesc}
        </p>
        <button onClick={() => setSonuc(null)} className="px-6 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold">
          {t.close}
        </button>
      </div>
    </div>
  );
}

function SiparisModal({ urun, onClose, t }: { urun: Urun; onClose: () => void; t: ProductsText }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/12 shadow-2xl"
        style={{ background: "#121626" }} onClick={(e) => e.stopPropagation()}>
        <SiparisFormu urun={urun} t={t} onClose={onClose} />
      </div>
    </div>
  );
}
