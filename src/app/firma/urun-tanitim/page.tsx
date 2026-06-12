"use client";
import { useEffect, useState } from "react";

type Medya = { url: string; baslik?: string; ad?: string };

function indirAdi(m: Medya): string {
  return m.ad || m.baslik || m.url.split("/").pop() || "dosya";
}

export default function FirmaUrunTanitimPage() {
  const [ozet, setOzet] = useState("");
  const [detay, setDetay] = useState("");
  const [gorseller, setGorseller] = useState<Medya[]>([]);
  const [videolar, setVideolar] = useState<Medya[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyuk, setBuyuk] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/urun-tanitim")
      .then(r => r.json())
      .then(j => {
        if (j.ok) {
          setOzet(j.tanitim.ozet ?? "");
          setDetay(j.tanitim.detay ?? "");
          setGorseller(Array.isArray(j.tanitim.gorseller) ? j.tanitim.gorseller : []);
          setVideolar(Array.isArray(j.tanitim.videolar) ? j.tanitim.videolar : []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span></div>;

  const bos = !ozet && !detay && gorseller.length === 0 && videolar.length === 0;

  return (
    <div className="max-w-[820px] space-y-6">
      <div>
        <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Ürün Tanıtımı</h2>
        <p className="text-sm text-on-surface-variant mt-1">Ürünü tanıtmak için kullanabileceğiniz hazır metin, fotoğraf ve videolar. Görselleri indirip kendi materyallerinizde kullanabilirsiniz.</p>
      </div>

      {bos ? (
        <p className="text-sm text-on-surface-variant text-center py-10">Henüz tanıtım içeriği eklenmemiş.</p>
      ) : (
        <>
          {ozet && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-on-surface mb-2" style={{ fontFamily: "Sora, sans-serif" }}>Özet</h3>
              <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">{ozet}</p>
            </div>
          )}
          {detay && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-on-surface mb-2" style={{ fontFamily: "Sora, sans-serif" }}>Detaylı Tanıtım</h3>
              <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">{detay}</p>
            </div>
          )}

          {gorseller.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-on-surface mb-3" style={{ fontFamily: "Sora, sans-serif" }}>Fotoğraflar</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gorseller.map((m, i) => (
                  <div key={i} className="space-y-2">
                    <button type="button" onClick={() => setBuyuk(m.url)} className="block w-full cursor-zoom-in">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt={m.baslik ?? ""} className="w-full aspect-square object-cover rounded-xl" />
                    </button>
                    <a href={m.url} download={indirAdi(m)}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg glass-card text-xs text-on-surface hover:bg-white/5">
                      <span className="material-symbols-outlined text-sm">download</span>İndir
                    </a>
                    {m.baslik && <p className="text-xs text-on-surface-variant text-center">{m.baslik}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {videolar.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-on-surface mb-3" style={{ fontFamily: "Sora, sans-serif" }}>Videolar</h3>
              <div className="space-y-4">
                {videolar.map((m, i) => (
                  <div key={i} className="space-y-2">
                    <video src={m.url} controls className="w-full rounded-xl bg-black" />
                    <div className="flex items-center justify-between gap-3">
                      {m.baslik && <p className="text-sm text-on-surface">{m.baslik}</p>}
                      <a href={m.url} download={indirAdi(m)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass-card text-xs text-on-surface hover:bg-white/5 ml-auto">
                        <span className="material-symbols-outlined text-sm">download</span>İndir
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {buyuk && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setBuyuk(null)}>
          <button onClick={() => setBuyuk(null)} aria-label="Kapat"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={buyuk} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
