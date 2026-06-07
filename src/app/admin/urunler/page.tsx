"use client";
import { useEffect, useState } from "react";

interface Product {
  id: string; ad: string; aciklama: string; fiyat: number;
  gorsel: string; aktif: boolean; tip: string; sira: number;
}

interface ProductForm {
  ad: string; aciklama: string; fiyat: string;
  gorsel: string; aktif: boolean; tip: string; sira: string;
}

const emptyForm: ProductForm = { ad: "", aciklama: "", fiyat: "", gorsel: "", aktif: true, tip: "NFC_KART", sira: "0" };

const TIP_OPTIONS = [
  { value: "NFC_KART", label: "NFC Kart" },
  { value: "QR_KART", label: "QR Kart" },
  { value: "NFC_ETIKET", label: "NFC Etiket" },
  { value: "NFC_BILEKLIK", label: "NFC Bileklik" },
  { value: "DIJITAL_PAKET", label: "Dijital Paket" },
  { value: "DIGER", label: "Diğer" },
];

export default function AdminUrunlerPage() {
  const [urunler, setUrunler] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [newModal, setNewModal] = useState(false);
  const [newForm, setNewForm] = useState<ProductForm>(emptyForm);
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState("");

  const [editUrun, setEditUrun] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteUrun, setDeleteUrun] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/urunler").then(r => r.json()).then(j => { if (j.ok) setUrunler(j.urunler); }).finally(() => setLoading(false));
  }, []);

  function openEdit(u: Product) {
    setEditUrun(u);
    setEditForm({ ad: u.ad, aciklama: u.aciklama, fiyat: String(u.fiyat), gorsel: u.gorsel, aktif: u.aktif, tip: u.tip, sira: String(u.sira) });
    setEditError("");
  }

  async function handleNew(e: React.FormEvent) {
    e.preventDefault();
    setNewLoading(true); setNewError("");
    const res = await fetch("/api/admin/urunler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newForm, fiyat: Number(newForm.fiyat) || 0, sira: Number(newForm.sira) || 0 }),
    });
    const j = await res.json();
    setNewLoading(false);
    if (!j.ok) { setNewError(j.error || "Eklenemedi."); return; }
    setUrunler(prev => [...prev, j.urun]);
    setNewModal(false);
    setNewForm(emptyForm);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUrun) return;
    setEditLoading(true); setEditError("");
    const res = await fetch(`/api/admin/urunler/${editUrun.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, fiyat: Number(editForm.fiyat) || 0, sira: Number(editForm.sira) || 0 }),
    });
    const j = await res.json();
    setEditLoading(false);
    if (!j.ok) { setEditError(j.error || "Güncellenemedi."); return; }
    setUrunler(prev => prev.map(u => u.id === editUrun.id ? j.urun : u));
    setEditUrun(null);
  }

  async function handleDelete() {
    if (!deleteUrun) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/admin/urunler/${deleteUrun.id}`, { method: "DELETE" });
    const j = await res.json();
    setDeleteLoading(false);
    if (j.ok) { setUrunler(prev => prev.filter(u => u.id !== deleteUrun.id)); setDeleteUrun(null); }
  }

  const fmt = (n: number) => `₺${n.toLocaleString("tr-TR")}`;
  const tipLabel = (t: string) => TIP_OPTIONS.find(o => o.value === t)?.label ?? t;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Ürün Kataloğu</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Siparişlerde ve sitede gösterilecek ürünleri yönetin.</p>
        </div>
        <button onClick={() => { setNewForm(emptyForm); setNewError(""); setNewModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
          <span className="material-symbols-outlined text-base">add</span>Yeni Ürün
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/3 border-b border-white/5">
              <tr className="text-left text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Ürün</th>
                <th className="px-4 py-3 font-medium">Tip</th>
                <th className="px-4 py-3 font-medium text-right">Fiyat</th>
                <th className="px-4 py-3 font-medium text-center">Sıra</th>
                <th className="px-4 py-3 font-medium text-center">Durum</th>
                <th className="px-4 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">Yükleniyor...</td></tr>
              ) : urunler.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-all">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.gorsel ? (
                        <img src={u.gorsel} alt={u.ad} className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-base">inventory_2</span>
                        </div>
                      )}
                      <div>
                        <p className="text-on-surface font-medium">{u.ad}</p>
                        {u.aciklama && <p className="text-xs text-on-surface-variant line-clamp-1 max-w-xs">{u.aciklama}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{tipLabel(u.tip)}</td>
                  <td className="px-4 py-3 text-right font-medium text-on-surface">{fmt(u.fiyat)}</td>
                  <td className="px-4 py-3 text-center text-on-surface-variant">{u.sira}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.aktif ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-white/5 text-on-surface-variant border border-white/10"}`}>
                      {u.aktif ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-all" title="Düzenle">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => setDeleteUrun(u)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all" title="Sil">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && urunler.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">inventory_2</span>
                  Henüz ürün eklenmemiş.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-on-surface-variant text-right">{urunler.length} ürün listeleniyor.</p>

      {/* Yeni Ürün Modal */}
      {newModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <h3 className="font-semibold text-on-surface">Yeni Ürün Ekle</h3>
              <button onClick={() => setNewModal(false)} className="text-on-surface-variant hover:text-on-surface transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleNew} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-on-surface-variant mb-1 block">Ürün Adı *</label>
                  <input required value={newForm.ad} onChange={e => setNewForm(p => ({ ...p, ad: e.target.value }))}
                    placeholder="NFC Kartvizit Premium"
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Tip</label>
                  <select value={newForm.tip} onChange={e => setNewForm(p => ({ ...p, tip: e.target.value }))}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                    {TIP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Fiyat (₺)</label>
                  <input type="number" min="0" value={newForm.fiyat} onChange={e => setNewForm(p => ({ ...p, fiyat: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Sıra</label>
                  <input type="number" min="0" value={newForm.sira} onChange={e => setNewForm(p => ({ ...p, sira: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-on-surface-variant">Aktif</label>
                  <button type="button" onClick={() => setNewForm(p => ({ ...p, aktif: !p.aktif }))}
                    className={`relative w-10 h-6 rounded-full transition-all ${newForm.aktif ? "bg-primary" : "bg-white/10"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newForm.aktif ? "left-5" : "left-1"}`} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Açıklama</label>
                <textarea value={newForm.aciklama} onChange={e => setNewForm(p => ({ ...p, aciklama: e.target.value }))}
                  rows={2} placeholder="Ürün hakkında kısa açıklama"
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all resize-none" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Görsel URL</label>
                <input value={newForm.gorsel} onChange={e => setNewForm(p => ({ ...p, gorsel: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
              </div>
              {newError && <p className="text-xs text-red-400 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{newError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setNewModal(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">İptal</button>
                <button type="submit" disabled={newLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black hover:scale-[1.02] transition-all disabled:opacity-60">
                  {newLoading ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Düzenle Modal */}
      {editUrun && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <h3 className="font-semibold text-on-surface">Ürünü Düzenle</h3>
              <button onClick={() => setEditUrun(null)} className="text-on-surface-variant hover:text-on-surface transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-on-surface-variant mb-1 block">Ürün Adı *</label>
                  <input required value={editForm.ad} onChange={e => setEditForm(p => ({ ...p, ad: e.target.value }))}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Tip</label>
                  <select value={editForm.tip} onChange={e => setEditForm(p => ({ ...p, tip: e.target.value }))}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                    {TIP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Fiyat (₺)</label>
                  <input type="number" min="0" value={editForm.fiyat} onChange={e => setEditForm(p => ({ ...p, fiyat: e.target.value }))}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Sıra</label>
                  <input type="number" min="0" value={editForm.sira} onChange={e => setEditForm(p => ({ ...p, sira: e.target.value }))}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-on-surface-variant">Aktif</label>
                  <button type="button" onClick={() => setEditForm(p => ({ ...p, aktif: !p.aktif }))}
                    className={`relative w-10 h-6 rounded-full transition-all ${editForm.aktif ? "bg-primary" : "bg-white/10"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editForm.aktif ? "left-5" : "left-1"}`} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Açıklama</label>
                <textarea value={editForm.aciklama} onChange={e => setEditForm(p => ({ ...p, aciklama: e.target.value }))}
                  rows={2}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all resize-none" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Görsel URL</label>
                <input value={editForm.gorsel} onChange={e => setEditForm(p => ({ ...p, gorsel: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
              </div>
              {editForm.gorsel && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8">
                  <img src={editForm.gorsel} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-white/10" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span className="text-xs text-on-surface-variant">Görsel önizleme</span>
                </div>
              )}
              {editError && <p className="text-xs text-red-400 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{editError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditUrun(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">İptal</button>
                <button type="submit" disabled={editLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black hover:scale-[1.02] transition-all disabled:opacity-60">
                  {editLoading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sil Onay */}
      {deleteUrun && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-400 text-2xl">delete_forever</span>
            </div>
            <h3 className="font-semibold text-on-surface text-center mb-1">Ürünü Sil</h3>
            <p className="text-sm text-on-surface-variant text-center mb-5">
              <span className="text-on-surface font-medium">{deleteUrun.ad}</span> ürünü kalıcı olarak silinecek.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUrun(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">İptal</button>
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
