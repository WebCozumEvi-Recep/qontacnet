"use client";
import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { mockAdminFirmalar, mockOrders, FirmaDurum } from "@/lib/mock-data";

const durumMap: Record<FirmaDurum, { label: string; color: string }> = {
  aktif: { label: "Aktif", color: "#42faba" },
  deneme: { label: "Deneme", color: "#a8e8ff" },
  askida: { label: "Askıda", color: "#ffb74d" },
  iptal: { label: "İptal", color: "#ff6b6b" },
};

export default function FirmaDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const firma = mockAdminFirmalar.find(f => f.id === id);
  if (!firma) notFound();

  const siparisler = mockOrders.filter(o => o.firmaId === firma.id);

  return (
    <div className="space-y-6 max-w-[1100px]">
      <Link href="/admin/firmalar" className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-all">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Firmalar
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">corporate_fare</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{firma.ad}</h2>
              <p className="text-on-surface-variant text-sm mt-0.5">
                <span className="text-primary font-medium">{firma.paket}</span> · {firma.sektor}
                <span className="ml-3 text-xs px-2 py-0.5 rounded-full" style={{ background: `${durumMap[firma.durum].color}15`, color: durumMap[firma.durum].color, border: `1px solid ${durumMap[firma.durum].color}30` }}>
                  {durumMap[firma.durum].label}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all">
              <span className="material-symbols-outlined text-base">edit</span>
              Düzenle
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant hover:text-red-400 transition-all">
              <span className="material-symbols-outlined text-base">block</span>
              Askıya Al
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric icon="group" label="Üye Sayısı" value={firma.uyeSayisi} color="#00d4ff" />
        <Metric icon="credit_card" label="Aktif Kart" value={firma.aktifKart} color="#42faba" />
        <Metric icon="payments" label="Aylık Gelir" value={`₺${firma.mrr.toLocaleString("tr-TR")}`} color="#6001d1" />
        <Metric icon="event" label="Üyelik Bitiş" value={new Date(firma.paketBitis).toLocaleDateString("tr-TR")} color="#a8e8ff" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* İletişim */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>İletişim Bilgileri</h3>
          <div className="space-y-3 text-sm">
            <Row icon="mail" label="E-posta" value={firma.email} />
            <Row icon="phone" label="Telefon" value={firma.telefon} />
            <Row icon="person" label="Temsilci" value={firma.temsilci} />
            <Row icon="category" label="Sektör" value={firma.sektor} />
            <Row icon="event" label="Üyelik Başlangıç" value={new Date(firma.paketBaslangic).toLocaleDateString("tr-TR")} />
          </div>
        </div>

        {/* Lisans */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Lisans & Paket</h3>
          <div className="space-y-3 text-sm">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-primary font-semibold">{firma.paket} Paketi</span>
                <span className="text-xs text-on-surface-variant">{firma.durum === "aktif" ? "Aktif" : firma.durum}</span>
              </div>
              <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
                ₺{firma.mrr.toLocaleString("tr-TR")} <span className="text-sm text-on-surface-variant font-normal">/ ay</span>
              </p>
            </div>
            <button className="w-full py-3 glass-card rounded-xl text-sm text-on-surface hover:bg-white/5 transition-all">
              Paket Değiştir
            </button>
            <button className="w-full py-3 glass-card rounded-xl text-sm text-on-surface hover:bg-white/5 transition-all">
              Faturalar
            </button>
          </div>
        </div>
      </div>

      {/* Siparişler */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Siparişler</h3>
          <Link href="/admin/siparisler" className="text-xs text-primary hover:underline">Tümü →</Link>
        </div>
        {siparisler.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-4 text-center">Henüz sipariş yok.</p>
        ) : (
          <div className="space-y-2">
            {siparisler.map(o => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-all">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-base">inventory_2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface font-medium">{o.siparisNo} · {o.urun}</p>
                  <p className="text-xs text-on-surface-variant">{o.adet} adet · {new Date(o.tarih).toLocaleDateString("tr-TR")}</p>
                </div>
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
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
        <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p>
      <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-on-surface-variant text-base">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-on-surface truncate">{value}</p>
      </div>
    </div>
  );
}
