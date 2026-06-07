"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { siparisDurumMap, trDate } from "@/lib/labels";

interface Order {
  id: string; siparisNo: string; firma: string; urun: string;
  adet: number; tutar: number; birimFiyat: number; kdvOrani: number;
  indirim: number; notlar: string; durum: string; kargoNo: string | null; createdAt: string;
}

export default function SiparisDetayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const [emailModal, setEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`).then(r => r.json()).then(j => { if (j.ok) setOrder(j.order); }).finally(() => setLoading(false));
  }, [id]);

  function handlePrint() {
    window.print();
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true); setEmailMsg("");
    const res = await fetch(`/api/admin/orders/${id}/email`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: emailTo }),
    });
    const j = await res.json();
    setEmailLoading(false);
    if (j.ok) { setEmailMsg("✓ E-posta gönderildi."); setTimeout(() => setEmailModal(false), 1500); }
    else setEmailMsg(j.error || "Gönderilemedi.");
  }

  if (loading) return <div className="p-12 text-center text-on-surface-variant">Yükleniyor...</div>;
  if (!order) return <div className="p-12 text-center text-on-surface-variant">Sipariş bulunamadı.</div>;

  const araToplam = order.adet * order.birimFiyat;
  const kdvTutar = Math.round(araToplam * order.kdvOrani / 100);
  const genelToplam = order.birimFiyat > 0 ? araToplam + kdvTutar - order.indirim : order.tutar;
  const fmt = (n: number) => `₺${n.toLocaleString("tr-TR")}`;
  const durum = siparisDurumMap[order.durum] ?? { label: order.durum, color: "#aaa", icon: "receipt" };

  return (
    <>
      {/* Ekran görünümü */}
      <div className="max-w-[860px] space-y-5 print:hidden">
        {/* Başlık */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-all">
            <span className="material-symbols-outlined text-base">arrow_back</span>Siparişler
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-all">
              <span className="material-symbols-outlined text-base">print</span>PDF / Yazdır
            </button>
            <button onClick={() => { setEmailTo(""); setEmailMsg(""); setEmailModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-primary-container text-on-primary-container hover:scale-[1.02] transition-all">
              <span className="material-symbols-outlined text-base">mail</span>E-posta Gönder
            </button>
          </div>
        </div>

        {/* Fatura kartı */}
        <div ref={printRef} className="glass-card rounded-2xl overflow-hidden">
          {/* Başlık */}
          <div className="flex items-start justify-between p-6 border-b border-white/8">
            <div>
              <p className="text-xs text-on-surface-variant mb-1">Sipariş No</p>
              <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{order.siparisNo}</p>
              <p className="text-sm text-on-surface-variant mt-1">{trDate(order.createdAt)}</p>
            </div>
            <span className="text-sm px-3 py-1.5 rounded-full font-medium"
              style={{ background: `${durum.color}15`, color: durum.color, border: `1px solid ${durum.color}30` }}>
              {durum.label}
            </span>
          </div>

          {/* Firma & Ürün */}
          <div className="grid grid-cols-2 gap-0 border-b border-white/8">
            <div className="p-6 border-r border-white/8">
              <p className="text-xs text-on-surface-variant mb-2 font-medium uppercase tracking-wide">Müşteri</p>
              <p className="text-on-surface font-semibold text-base">{order.firma}</p>
            </div>
            <div className="p-6">
              <p className="text-xs text-on-surface-variant mb-2 font-medium uppercase tracking-wide">Ürün</p>
              <p className="text-on-surface font-semibold text-base">{order.urun}</p>
              {order.kargoNo && <p className="text-xs text-on-surface-variant mt-1 font-mono">Kargo: {order.kargoNo}</p>}
            </div>
          </div>

          {/* Kalemler tablosu */}
          <div className="p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-on-surface-variant text-xs uppercase tracking-wide">
                  <th className="pb-3 text-left font-medium">Ürün / Açıklama</th>
                  <th className="pb-3 text-right font-medium">Adet</th>
                  <th className="pb-3 text-right font-medium">Birim Fiyat</th>
                  <th className="pb-3 text-right font-medium">Toplam</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-on-surface">{order.urun}</td>
                  <td className="py-3 text-right text-on-surface">{order.adet}</td>
                  <td className="py-3 text-right text-on-surface">{order.birimFiyat > 0 ? fmt(order.birimFiyat) : "—"}</td>
                  <td className="py-3 text-right text-on-surface">{order.birimFiyat > 0 ? fmt(araToplam) : fmt(order.tutar)}</td>
                </tr>
              </tbody>
            </table>

            {/* Hesap özeti */}
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-2">
                {order.birimFiyat > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-on-surface-variant">
                      <span>Ara Toplam</span><span>{fmt(araToplam)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-on-surface-variant">
                      <span>KDV (%{order.kdvOrani})</span><span>{fmt(kdvTutar)}</span>
                    </div>
                    {order.indirim > 0 && (
                      <div className="flex justify-between text-sm text-green-400">
                        <span>İndirim</span><span>- {fmt(order.indirim)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-base font-bold text-on-surface pt-2 border-t border-white/10">
                  <span>Genel Toplam</span>
                  <span style={{ fontFamily: "Sora, sans-serif" }}>{fmt(genelToplam)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notlar */}
          {order.notlar && (
            <div className="px-6 pb-6">
              <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                <p className="text-xs text-on-surface-variant mb-1 font-medium">Notlar</p>
                <p className="text-sm text-on-surface">{order.notlar}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print / PDF görünümü */}
      <div className="hidden print:block p-8 bg-white text-gray-900 font-sans">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="text-2xl font-black text-cyan-600" style={{ fontFamily: "Sora, sans-serif" }}>QONTAC</div>
            <div className="text-xs text-gray-500 mt-0.5">NFC + QR Dijital Kartvizit Platformu</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">{order.siparisNo}</div>
            <div className="text-sm text-gray-500">{trDate(order.createdAt)}</div>
            <div className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${durum.color}20`, color: durum.color }}>
              {durum.label}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Müşteri</div>
            <div className="font-semibold text-gray-900">{order.firma}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ürün</div>
            <div className="font-semibold text-gray-900">{order.urun}</div>
            {order.kargoNo && <div className="text-xs text-gray-500 mt-0.5 font-mono">Kargo: {order.kargoNo}</div>}
          </div>
        </div>

        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              <th className="p-3 text-left text-gray-500 text-xs uppercase tracking-wide font-medium">Ürün / Açıklama</th>
              <th className="p-3 text-right text-gray-500 text-xs uppercase tracking-wide font-medium">Adet</th>
              <th className="p-3 text-right text-gray-500 text-xs uppercase tracking-wide font-medium">Birim Fiyat</th>
              <th className="p-3 text-right text-gray-500 text-xs uppercase tracking-wide font-medium">Toplam</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td className="p-3 text-gray-900">{order.urun}</td>
              <td className="p-3 text-right text-gray-900">{order.adet}</td>
              <td className="p-3 text-right text-gray-900">{order.birimFiyat > 0 ? fmt(order.birimFiyat) : "—"}</td>
              <td className="p-3 text-right text-gray-900">{order.birimFiyat > 0 ? fmt(araToplam) : fmt(order.tutar)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-56 space-y-1.5">
            {order.birimFiyat > 0 && <>
              <div className="flex justify-between text-sm text-gray-500"><span>Ara Toplam</span><span>{fmt(araToplam)}</span></div>
              <div className="flex justify-between text-sm text-gray-500"><span>KDV (%{order.kdvOrani})</span><span>{fmt(kdvTutar)}</span></div>
              {order.indirim > 0 && <div className="flex justify-between text-sm text-green-600"><span>İndirim</span><span>- {fmt(order.indirim)}</span></div>}
            </>}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
              <span>Genel Toplam</span><span>{fmt(genelToplam)}</span>
            </div>
          </div>
        </div>

        {order.notlar && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
            <span className="font-medium text-gray-700">Not: </span>{order.notlar}
          </div>
        )}
        <div className="mt-10 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
          QONTAC.NET · admin@qontac.net · Bu belge QONTAC Platform tarafından oluşturulmuştur.
        </div>
      </div>

      {/* E-posta Modal */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <h3 className="font-semibold text-on-surface">Sipariş E-postası Gönder</h3>
              <button onClick={() => setEmailModal(false)} className="text-on-surface-variant hover:text-on-surface transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEmail} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-white/3 border border-white/8 text-xs text-on-surface-variant">
                <span className="font-mono text-primary">{order.siparisNo}</span> sipariş özeti e-posta ile gönderilecek.
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Alıcı E-posta *</label>
                <input required type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)}
                  placeholder="firma@ornek.com"
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
              </div>
              {emailMsg && (
                <p className={`text-xs flex items-center gap-1 ${emailMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                  {emailMsg}
                </p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setEmailModal(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">İptal</button>
                <button type="submit" disabled={emailLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black hover:scale-[1.02] transition-all disabled:opacity-60">
                  {emailLoading ? "Gönderiliyor..." : "Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
