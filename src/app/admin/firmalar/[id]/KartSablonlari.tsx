"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Sablon { id: string; ad: string; yon: string; onGorsel: string; arkaGorsel: string; updatedAt: string }

// Firma detayında kart baskı şablonları listesi.
export function KartSablonlari({ firmaId }: { firmaId: string }) {
  const router = useRouter();
  const [sablonlar, setSablonlar] = useState<Sablon[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [olusturuluyor, setOlusturuluyor] = useState(false);
  const [hata, setHata] = useState("");

  useEffect(() => {
    fetch(`/api/admin/kart-sablonlari?firmaId=${encodeURIComponent(firmaId)}`)
      .then(r => r.json()).then(j => { if (j.ok) setSablonlar(j.sablonlar); })
      .finally(() => setYukleniyor(false));
  }, [firmaId]);

  async function yeni() {
    setOlusturuluyor(true); setHata("");
    try {
      const j = await fetch("/api/admin/kart-sablonlari", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmaId, ad: `Kart Şablonu ${sablonlar.length + 1}` }),
      }).then(r => r.json());
      if (!j.ok) { setHata(j.error ?? "Oluşturulamadı."); return; }
      router.push(`/admin/firmalar/${firmaId}/sablon/${j.sablon.id}`);
    } finally { setOlusturuluyor(false); }
  }

  async function sil(s: Sablon) {
    if (!confirm(`"${s.ad}" şablonu silinsin mi?`)) return;
    const j = await fetch(`/api/admin/kart-sablonlari/${s.id}`, { method: "DELETE" }).then(r => r.json());
    if (j.ok) setSablonlar(p => p.filter(x => x.id !== s.id));
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Kart Baskı Şablonları</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Ön/arka görsel ve ad soyad, GSM, QR yerleşimi. Satılan Kartlar&apos;da seçilip baskı görseli üretilir.</p>
        </div>
        <button onClick={yeni} disabled={olusturuluyor}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-container text-on-primary-container disabled:opacity-60">
          <span className="material-symbols-outlined text-sm">add</span>{olusturuluyor ? "Oluşturuluyor..." : "Yeni Şablon"}
        </button>
      </div>
      {hata && <p className="text-xs text-red-400 mb-3">{hata}</p>}
      {yukleniyor ? (
        <p className="text-sm text-on-surface-variant">Yükleniyor...</p>
      ) : sablonlar.length === 0 ? (
        <p className="text-sm text-on-surface-variant py-4 text-center">Henüz şablon yok.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sablonlar.map(s => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
              <Link href={`/admin/firmalar/${firmaId}/sablon/${s.id}`} className="block">
                <div className="flex gap-1.5 p-2 bg-black/20 h-28 items-center justify-center">
                  {[s.onGorsel, s.arkaGorsel].map((g, i) => (
                    <div key={i} className={`h-full rounded-md overflow-hidden bg-white/5 flex items-center justify-center ${s.yon === "dikey" ? "aspect-[54/85.6]" : "aspect-[85.6/54]"}`}>
                      {g ? <img src={g} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[10px] text-on-surface-variant">{i === 0 ? "Ön" : "Arka"}</span>}
                    </div>
                  ))}
                </div>
              </Link>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-on-surface truncate">{s.ad}</p>
                  <p className="text-[11px] text-on-surface-variant">{s.yon === "dikey" ? "Dikey" : "Yatay"}</p>
                </div>
                <div className="flex gap-1">
                  <Link href={`/admin/firmalar/${firmaId}/sablon/${s.id}`} title="Düzenle"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </Link>
                  <button onClick={() => sil(s)} title="Sil" className="p-1.5 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
