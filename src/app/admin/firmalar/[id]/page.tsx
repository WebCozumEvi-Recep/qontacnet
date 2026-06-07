"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { paketLabel, firmaDurumMap, trDate } from "@/lib/labels";

interface Firma {
  id: string; ad: string; email: string; telefon: string; sektor: string; temsilci: string;
  paket: string; durum: string; mrr: number; paketBaslangic: string; paketBitis: string | null;
  uyeSayisi: number; aktifKart: number;
}
interface Order { id: string; siparisNo: string; urun: string; adet: number; tutar: number; createdAt: string }

export default function FirmaDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [firma, setFirma] = useState<Firma | null>(null);
  const [siparisler, setSiparisler] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/firmalar/${id}`).then(r => r.json()).then(j => {
      if (j.ok) { setFirma(j.firma); setSiparisler(j.siparisler); } else setNotFound(true);
    }).finally(() => setLoading(false));
  }, [id]);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/firmalar/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json();
      if (j.ok) setFirma(f => (f ? { ...f, ...j.firma } : f));
    } finally { setBusy(false); }
  };

  if (loading) return <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant max-w-[1100px]">Yükleniyor...</div>;
  if (notFound || !firma) return (
    <div className="max-w-[1100px] space-y-4">
      <Link href="/admin/firmalar" className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-base">arrow_back</span>Firmalar</Link>
      <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Firma bulunamadı.</div>
    </div>
  );

  const du = firmaDurumMap[firma.durum];

  return (
    <div className="space-y-6 max-w-[1100px]">
      <Link href="/admin/firmalar" className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-all"><span className="material-symbols-outlined text-base">arrow_back</span>Firmalar</Link>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"><span className="material-symbols-outlined text-primary text-3xl">corporate_fare</span></div>
            <div>
              <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{firma.ad}</h2>
              <p className="text-on-surface-variant text-sm mt-0.5"><span className="text-primary font-medium">{paketLabel[firma.paket]}</span> · {firma.sektor}
                <span className="ml-3 text-xs px-2 py-0.5 rounded-full" style={{ background: `${du.color}15`, color: du.color, border: `1px solid ${du.color}30` }}>{du.label}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {firma.durum === "ASKIDA" ? (
              <button onClick={() => patch({ durum: "AKTIF" })} disabled={busy} className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant hover:text-tertiary transition-all disabled:opacity-50"><span className="material-symbols-outlined text-base">check_circle</span>Aktif Et</button>
            ) : (
              <button onClick={() => patch({ durum: "ASKIDA" })} disabled={busy} className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant hover:text-red-400 transition-all disabled:opacity-50"><span className="material-symbols-outlined text-base">block</span>Askıya Al</button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric icon="group" label="Üye Sayısı" value={firma.uyeSayisi} color="#00d4ff" />
        <Metric icon="credit_card" label="Aktif Kart" value={firma.aktifKart} color="#42faba" />
        <Metric icon="payments" label="Aylık Gelir" value={`₺${firma.mrr.toLocaleString("tr-TR")}`} color="#6001d1" />
        <Metric icon="event" label="Üyelik Bitiş" value={firma.paketBitis ? trDate(firma.paketBitis) : "—"} color="#a8e8ff" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>İletişim Bilgileri</h3>
          <div className="space-y-3 text-sm">
            <Row icon="mail" label="E-posta" value={firma.email} /><Row icon="phone" label="Telefon" value={firma.telefon} />
            <Row icon="person" label="Temsilci" value={firma.temsilci} /><Row icon="category" label="Sektör" value={firma.sektor} />
            <Row icon="event" label="Üyelik Başlangıç" value={trDate(firma.paketBaslangic)} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Lisans & Paket</h3>
          <div className="space-y-3 text-sm">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2"><span className="text-primary font-semibold">{paketLabel[firma.paket]} Paketi</span><span className="text-xs text-on-surface-variant">{du.label}</span></div>
              <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>₺{firma.mrr.toLocaleString("tr-TR")} <span className="text-sm text-on-surface-variant font-normal">/ ay</span></p>
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1.5 block">Paket Değiştir</label>
              <select value={firma.paket} onChange={e => patch({ paket: e.target.value })} disabled={busy} className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none">
                <option value="BASLANGIC">Başlangıç</option><option value="PROFESYONEL">Profesyonel</option><option value="KURUMSAL">Kurumsal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1.5 block">Durum</label>
              <select value={firma.durum} onChange={e => patch({ durum: e.target.value })} disabled={busy} className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none">
                <option value="AKTIF">Aktif</option><option value="DENEME">Deneme</option><option value="ASKIDA">Askıda</option><option value="IPTAL">İptal</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Siparişler</h3><Link href="/admin/siparisler" className="text-xs text-primary hover:underline">Tümü →</Link></div>
        {siparisler.length === 0 ? <p className="text-sm text-on-surface-variant py-4 text-center">Henüz sipariş yok.</p> : (
          <div className="space-y-2">
            {siparisler.map(o => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-all">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-primary text-base">inventory_2</span></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-on-surface font-medium">{o.siparisNo} · {o.urun}</p><p className="text-xs text-on-surface-variant">{o.adet} adet · {trDate(o.createdAt)}</p></div>
                <p className="text-sm font-semibold text-on-surface">₺{o.tutar.toLocaleString("tr-TR")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (<div className="glass-card rounded-2xl p-5"><div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}><span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span></div><p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p><p className="text-sm text-on-surface-variant mt-0.5">{label}</p></div>);
}
function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (<div className="flex items-center gap-3"><span className="material-symbols-outlined text-on-surface-variant text-base">{icon}</span><div className="flex-1 min-w-0"><p className="text-xs text-on-surface-variant">{label}</p><p className="text-on-surface truncate">{value}</p></div></div>);
}
