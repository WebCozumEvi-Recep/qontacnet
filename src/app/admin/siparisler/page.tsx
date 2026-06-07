"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { siparisDurumMap, trDate } from "@/lib/labels";

interface Order {
  id: string; siparisNo: string; firma: string; firmaId?: string | null;
  urun: string; adet: number; tutar: number; birimFiyat: number;
  kdvOrani: number; indirim: number; notlar: string;
  durum: string; kargoNo: string | null; createdAt: string;
}

interface OrderForm {
  firma: string; urun: string; adet: string; tutar: string;
  birimFiyat: string; kdvOrani: string; indirim: string; notlar: string;
  durum: string; kargoNo: string;
}

export default function AdminSiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("tum");
  const [firmalar, setFirmalar] = useState<{ id: string; ad: string }[]>([]);
  const [urunler, setUrunler] = useState<{ id: string; ad: string; fiyat: number }[]>([]);


  const emptyForm: OrderForm = { firma: "", urun: "", adet: "", tutar: "", birimFiyat: "", kdvOrani: "20", indirim: "0", notlar: "", durum: "HAZIRLANIYOR", kargoNo: "" };
  const [newModal, setNewModal] = useState(false);
  const [newForm, setNewForm] = useState<OrderForm>(emptyForm);
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState("");

  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<OrderForm>(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/orders").then(r => r.json()).then(j => { if (j.ok) setOrders(j.orders); }).finally(() => setLoading(false));
    fetch("/api/admin/firmalar").then(r => r.json()).then(j => { if (j.ok) setFirmalar(j.firmalar.map((f: { id: string; ad: string }) => ({ id: f.id, ad: f.ad }))); });
    fetch("/api/admin/urunler").then(r => r.json()).then(j => { if (j.ok) setUrunler(j.urunler); });
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { tum: orders.length };
    Object.keys(siparisDurumMap).forEach(k => c[k] = orders.filter(o => o.durum === k).length);
    return c;
  }, [orders]);

  const filtered = tab === "tum" ? orders : orders.filter(o => o.durum === tab);
  const toplamCiro = filtered.filter(o => o.durum !== "IPTAL").reduce((a, o) => a + o.tutar, 0);

  function openEdit(o: Order) {
    setEditOrder(o);
    setEditForm({ firma: o.firma, urun: o.urun, adet: String(o.adet), tutar: String(o.tutar), birimFiyat: String(o.birimFiyat || ""), kdvOrani: String(o.kdvOrani ?? 20), indirim: String(o.indirim || 0), notlar: o.notlar ?? "", durum: o.durum, kargoNo: o.kargoNo ?? "" });
    setEditError("");
  }

  async function handleNew(e: React.FormEvent) {
    e.preventDefault();
    setNewLoading(true); setNewError("");
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newForm, adet: parseInt(newForm.adet), tutar: parseInt(newForm.tutar) || 0, birimFiyat: parseInt(newForm.birimFiyat) || 0, kdvOrani: parseInt(newForm.kdvOrani) || 20, indirim: parseInt(newForm.indirim) || 0 }),
    });
    const j = await res.json();
    setNewLoading(false);
    if (!j.ok) { setNewError(j.error || "Oluşturma başarısız."); return; }
    setOrders(prev => [j.order, ...prev]);
    setNewModal(false); setNewForm(emptyForm);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editOrder) return;
    setEditLoading(true); setEditError("");
    const res = await fetch(`/api/admin/orders/${editOrder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, adet: parseInt(editForm.adet), tutar: parseInt(editForm.tutar) || 0, birimFiyat: parseInt(editForm.birimFiyat) || 0, kdvOrani: parseInt(editForm.kdvOrani) || 20, indirim: parseInt(editForm.indirim) || 0 }),
    });
    const j = await res.json();
    setEditLoading(false);
    if (!j.ok) { setEditError(j.error || "Güncelleme başarısız."); return; }
    setOrders(prev => prev.map(o => o.id === editOrder.id ? { ...o, ...j.order } : o));
    setEditOrder(null);
  }

  async function handleDelete() {
    if (!deleteOrder) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/admin/orders/${deleteOrder.id}`, { method: "DELETE" });
    const j = await res.json();
    setDeleteLoading(false);
    if (j.ok) { setOrders(prev => prev.filter(o => o.id !== deleteOrder.id)); setDeleteOrder(null); }
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* İstatistikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="receipt_long" label="Toplam Sipariş" value={orders.length} sub="Tüm zamanlar" color="#00d4ff" />
        <Stat icon="pending_actions" label="Bekleyen" value={(counts["HAZIRLANIYOR"]||0)+(counts["URETIMDE"]||0)+(counts["KARGODA"]||0)} sub="Hazırlanan + Kargoda" color="#a8e8ff" />
        <Stat icon="check_circle" label="Teslim Edilen" value={counts["TESLIM"]||0} sub="Tamamlandı" color="#42faba" />
        <Stat icon="payments" label="Ciro" value={`₺${toplamCiro.toLocaleString("tr-TR")}`} sub={tab === "tum" ? "Tüm aktif" : siparisDurumMap[tab]?.label} color="#6001d1" />
      </div>

      {/* Tab + Yeni Sipariş */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="glass-card rounded-2xl p-2 flex flex-wrap gap-1 flex-1">
          <TabButton active={tab === "tum"} onClick={() => setTab("tum")} label="Tümü" count={counts.tum} />
          {Object.keys(siparisDurumMap).map(d => (
            <TabButton key={d} active={tab === d} onClick={() => setTab(d)} label={siparisDurumMap[d].label} count={counts[d]||0} color={siparisDurumMap[d].color} />
          ))}
        </div>
        <button onClick={() => { setNewForm(emptyForm); setNewError(""); setNewModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all whitespace-nowrap">
          <span className="material-symbols-outlined text-base">add</span>Yeni Sipariş
        </button>
      </div>

      {/* Sipariş Listesi */}
      <div className="space-y-3">
        {loading ? <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Yükleniyor...</div> : filtered.map(o => (
          <div key={o.id} className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-primary/20 transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${siparisDurumMap[o.durum].color}15`, border: `1px solid ${siparisDurumMap[o.durum].color}30` }}>
              <span className="material-symbols-outlined" style={{ color: siparisDurumMap[o.durum].color }}>{siparisDurumMap[o.durum].icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-on-surface font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>{o.siparisNo}</span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${siparisDurumMap[o.durum].color}15`, color: siparisDurumMap[o.durum].color, border: `1px solid ${siparisDurumMap[o.durum].color}30` }}>
                  {siparisDurumMap[o.durum].label}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant">{o.firma} · {o.urun}</p>
              <p className="text-xs text-on-surface-variant mt-1">{trDate(o.createdAt)}{o.kargoNo && <span> · Kargo: <span className="font-mono">{o.kargoNo}</span></span>}</p>
            </div>
            <div className="text-left md:text-right"><p className="text-xs text-on-surface-variant">Adet</p><p className="text-on-surface font-medium">{o.adet}</p></div>
            <div className="text-left md:text-right"><p className="text-xs text-on-surface-variant">Tutar</p><p className="text-on-surface font-bold text-lg" style={{ fontFamily: "Sora, sans-serif" }}>₺{o.tutar.toLocaleString("tr-TR")}</p></div>
            <div className="flex items-center gap-1">
              <Link href={`/admin/siparisler/${o.id}`} className="px-4 py-2 glass-card rounded-lg text-xs text-on-surface-variant hover:text-primary transition-all">Yönet</Link>
              <button onClick={() => openEdit(o)} className="p-2 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-all" title="Düzenle">
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
              <button onClick={() => setDeleteOrder(o)} className="p-2 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all" title="Sil">
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Bu durumda sipariş yok.</div>}
      </div>


      {/* Yeni Sipariş Modal */}
      {newModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <h3 className="font-semibold text-on-surface">Yeni Sipariş</h3>
              <button onClick={() => setNewModal(false)} className="text-on-surface-variant hover:text-on-surface transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleNew}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Firma *</label>
                  <select required value={newForm.firma} onChange={e => setNewForm(p => ({ ...p, firma: e.target.value }))}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                    <option value="">— Firma seçin —</option>
                    {firmalar.map(f => <option key={f.id} value={f.ad}>{f.ad}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Ürün *</label>
                  <select required value={newForm.urun} onChange={e => {
                    const u = urunler.find(x => x.ad === e.target.value);
                    setNewForm(p => ({ ...p, urun: e.target.value, birimFiyat: u ? String(u.fiyat) : p.birimFiyat }));
                  }} className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                    <option value="">Ürün seçin...</option>
                    {urunler.map(u => <option key={u.id} value={u.ad}>{u.ad}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Adet *</label>
                    <input required type="number" min={1} value={newForm.adet} onChange={e => setNewForm(p => ({ ...p, adet: e.target.value }))}
                      placeholder="50"
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Birim Fiyat (₺)</label>
                    <input type="number" min={0} value={newForm.birimFiyat} onChange={e => setNewForm(p => ({ ...p, birimFiyat: e.target.value }))}
                      placeholder="150"
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">KDV %</label>
                    <input type="number" min={0} max={100} value={newForm.kdvOrani} onChange={e => setNewForm(p => ({ ...p, kdvOrani: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">İndirim (₺)</label>
                    <input type="number" min={0} value={newForm.indirim} onChange={e => setNewForm(p => ({ ...p, indirim: e.target.value }))}
                      placeholder="0"
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Durum</label>
                    <select value={newForm.durum} onChange={e => setNewForm(p => ({ ...p, durum: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                      {Object.entries(siparisDurumMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Notlar</label>
                  <textarea value={newForm.notlar} onChange={e => setNewForm(p => ({ ...p, notlar: e.target.value }))}
                    rows={2} placeholder="Sipariş notu..."
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all resize-none" />
                </div>
              </div>
              <div className="px-6 pb-5">
                {newError && <p className="text-xs text-red-400 flex items-center gap-1 mb-3"><span className="material-symbols-outlined text-sm">error</span>{newError}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setNewModal(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">İptal</button>
                  <button type="submit" disabled={newLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black hover:scale-[1.02] transition-all disabled:opacity-60">
                    {newLoading ? "Oluşturuluyor..." : "Oluştur"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Düzenle Modal */}
      {editOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <div>
                <h3 className="font-semibold text-on-surface">Sipariş Düzenle</h3>
                <p className="text-xs font-mono text-on-surface-variant">{editOrder.siparisNo}</p>
              </div>
              <button onClick={() => setEditOrder(null)} className="text-on-surface-variant hover:text-on-surface transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Firma *</label>
                  <select required value={editForm.firma} onChange={e => setEditForm(p => ({ ...p, firma: e.target.value }))}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                    {firmalar.map(f => <option key={f.id} value={f.ad}>{f.ad}</option>)}
                    {!firmalar.find(f => f.ad === editForm.firma) && editForm.firma && (
                      <option value={editForm.firma}>{editForm.firma}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Ürün *</label>
                  <select required value={editForm.urun} onChange={e => setEditForm(p => ({ ...p, urun: e.target.value }))}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                    <option value="">Ürün seçin...</option>
                    {urunler.map(u => <option key={u.id} value={u.ad}>{u.ad}</option>)}
                    {editForm.urun && !urunler.find(u => u.ad === editForm.urun) && <option value={editForm.urun}>{editForm.urun}</option>}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Adet *</label>
                    <input required type="number" min={1} value={editForm.adet} onChange={e => setEditForm(p => ({ ...p, adet: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Birim Fiyat (₺)</label>
                    <input type="number" min={0} value={editForm.birimFiyat} onChange={e => setEditForm(p => ({ ...p, birimFiyat: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">KDV %</label>
                    <input type="number" min={0} max={100} value={editForm.kdvOrani} onChange={e => setEditForm(p => ({ ...p, kdvOrani: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">İndirim (₺)</label>
                    <input type="number" min={0} value={editForm.indirim} onChange={e => setEditForm(p => ({ ...p, indirim: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Kargo No</label>
                    <input value={editForm.kargoNo} onChange={e => setEditForm(p => ({ ...p, kargoNo: e.target.value }))}
                      placeholder="TRK1234567"
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm font-mono text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Durum</label>
                    <select value={editForm.durum} onChange={e => setEditForm(p => ({ ...p, durum: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                      {Object.entries(siparisDurumMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Notlar</label>
                    <input value={editForm.notlar} onChange={e => setEditForm(p => ({ ...p, notlar: e.target.value }))}
                      placeholder="Sipariş notu..."
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                </div>
              </div>
              <div className="px-6 pb-5">
                {editError && <p className="text-xs text-red-400 flex items-center gap-1 mb-3"><span className="material-symbols-outlined text-sm">error</span>{editError}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditOrder(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">İptal</button>
                  <button type="submit" disabled={editLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black hover:scale-[1.02] transition-all disabled:opacity-60">
                    {editLoading ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sil Onay */}
      {deleteOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-400 text-2xl">delete_forever</span>
            </div>
            <h3 className="font-semibold text-on-surface text-center mb-1">Siparişi Sil</h3>
            <p className="text-sm text-on-surface-variant text-center mb-1">
              <span className="font-mono text-on-surface font-medium">{deleteOrder.siparisNo}</span>
            </p>
            <p className="text-xs text-on-surface-variant text-center mb-5">
              {deleteOrder.firma} · {deleteOrder.urun} · {deleteOrder.adet} adet<br />Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteOrder(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">İptal</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:scale-[1.02] transition-all disabled:opacity-60">
                {deleteLoading ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-primary-container/20 text-primary border border-primary/20" : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"}`}>
      {color && <span className="w-2 h-2 rounded-full" style={{ background: color }} />}
      {label}<span className="text-xs text-on-surface-variant">({count})</span>
    </button>
  );
}

function Stat({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
        <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p>
      <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
      <p className="text-xs mt-2" style={{ color }}>{sub}</p>
    </div>
  );
}
