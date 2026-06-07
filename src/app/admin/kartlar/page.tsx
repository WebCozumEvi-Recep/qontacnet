"use client";
import { useEffect, useState } from "react";
import { batchDurumMap, trDate } from "@/lib/labels";

interface Batch {
  id: string; kod: string; miktar: number; uretici: string; uretimTarihi: string;
  durum: string; tahsisFirma: string | null; seriPrefix: string; createdAt: string;
}

interface BatchDetail extends Batch { seriNumaralari: string[]; }

interface EditForm {
  kod: string; miktar: string; seriPrefix: string; uretici: string;
  uretimTarihi: string; durum: string; tahsisFirma: string;
}

export default function AdminKartlarPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [firmalar, setFirmalar] = useState<{ id: string; ad: string }[]>([]);

  const [detayBatch, setDetayBatch] = useState<BatchDetail | null>(null);
  const [detayLoading, setDetayLoading] = useState(false);

  const [seriModal, setSeriModal] = useState<BatchDetail | null>(null);
  const [seriSearch, setSeriSearch] = useState("");

  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ kod: "", miktar: "", seriPrefix: "", uretici: "", uretimTarihi: "", durum: "", tahsisFirma: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteBatch, setDeleteBatch] = useState<Batch | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/batches").then(r => r.json()).then(j => { if (j.ok) setBatches(j.batches); }).finally(() => setLoading(false));
    fetch("/api/admin/firmalar").then(r => r.json()).then(j => { if (j.ok) setFirmalar(j.firmalar.map((f: { id: string; ad: string }) => ({ id: f.id, ad: f.ad }))); });
  }, []);

  function toDateInput(v?: string | null) {
    if (!v) return "";
    return new Date(v).toISOString().slice(0, 10);
  }

  function openEdit(b: Batch) {
    setEditBatch(b);
    setEditForm({
      kod: b.kod, miktar: String(b.miktar), seriPrefix: b.seriPrefix,
      uretici: b.uretici, uretimTarihi: toDateInput(b.uretimTarihi),
      durum: b.durum, tahsisFirma: b.tahsisFirma ?? "",
    });
    setEditError("");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBatch) return;
    setEditLoading(true); setEditError("");
    const res = await fetch(`/api/admin/batches/${editBatch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, miktar: parseInt(editForm.miktar) }),
    });
    const j = await res.json();
    setEditLoading(false);
    if (!j.ok) { setEditError(j.error || "Güncelleme başarısız."); return; }
    setBatches(prev => prev.map(b => b.id === editBatch.id ? { ...b, ...j.batch } : b));
    setEditBatch(null);
  }

  const sum = (d: string) => batches.filter(b => b.durum === d).reduce((a, b) => a + b.miktar, 0);
  const toplam = batches.reduce((a, b) => a + b.miktar, 0);

  async function openDetay(batch: Batch) {
    setDetayLoading(true);
    setDetayBatch(null);
    const res = await fetch(`/api/admin/batches/${batch.id}`);
    const j = await res.json();
    setDetayLoading(false);
    if (j.ok) setDetayBatch({ ...j.batch, seriNumaralari: j.seriNumaralari });
  }

  async function openSeri(batch: Batch) {
    setSeriSearch("");
    setSeriModal(null);
    const res = await fetch(`/api/admin/batches/${batch.id}`);
    const j = await res.json();
    if (j.ok) setSeriModal({ ...j.batch, seriNumaralari: j.seriNumaralari });
  }

  async function handleDelete() {
    if (!deleteBatch) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/admin/batches/${deleteBatch.id}`, { method: "DELETE" });
    const j = await res.json();
    setDeleteLoading(false);
    if (j.ok) { setBatches(prev => prev.filter(b => b.id !== deleteBatch.id)); setDeleteBatch(null); }
  }

  const filteredSeri = seriModal?.seriNumaralari.filter(s => s.includes(seriSearch.toUpperCase())) ?? [];

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="inventory" label="Toplam Üretilen" value={toplam} color="#00d4ff" />
        <Stat icon="warehouse" label="Stokta" value={sum("STOKTA")} color="#42faba" />
        <Stat icon="assignment_turned_in" label="Tahsis Edildi" value={sum("TAHSIS")} color="#6001d1" />
        <Stat icon="factory" label="Üretimde" value={sum("URETIMDE")} color="#a8e8ff" />
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Üretim Partileri (Batch)</h3>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
          <span className="material-symbols-outlined text-base">add</span>Yeni Üretim Siparişi
        </button>
      </div>

      {loading ? <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Yükleniyor...</div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {batches.map(b => (
            <div key={b.id} className="glass-card rounded-2xl p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-on-surface-variant">Batch Kodu</p>
                  <p className="text-on-surface font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>{b.kod}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: `${batchDurumMap[b.durum].color}15`, color: batchDurumMap[b.durum].color, border: `1px solid ${batchDurumMap[b.durum].color}30` }}>
                    {batchDurumMap[b.durum].label}
                  </span>
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-all" title="Düzenle">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button onClick={() => setDeleteBatch(b)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all" title="Sil">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><p className="text-xs text-on-surface-variant">Miktar</p><p className="text-on-surface font-medium">{b.miktar.toLocaleString("tr-TR")} adet</p></div>
                <div><p className="text-xs text-on-surface-variant">Seri Prefix</p><p className="text-on-surface font-medium font-mono text-sm">{b.seriPrefix}</p></div>
                <div><p className="text-xs text-on-surface-variant">Üretici</p><p className="text-on-surface text-sm">{b.uretici}</p></div>
                <div><p className="text-xs text-on-surface-variant">Üretim Tarihi</p><p className="text-on-surface text-sm">{trDate(b.uretimTarihi)}</p></div>
              </div>
              {b.tahsisFirma && (
                <div className="pt-3 border-t border-white/5">
                  <p className="text-xs text-on-surface-variant">Tahsis Edilen Firma</p>
                  <p className="text-primary text-sm font-medium">{b.tahsisFirma}</p>
                </div>
              )}
              <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                <button onClick={() => openDetay(b)} className="flex-1 py-2 glass-card rounded-lg text-xs text-on-surface-variant hover:text-primary transition-all flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span>Detay
                </button>
                <button onClick={() => openSeri(b)} className="flex-1 py-2 glass-card rounded-lg text-xs text-on-surface-variant hover:text-primary transition-all flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">list</span>Seri No Listesi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detay Modal */}
      {(detayLoading || detayBatch) && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { setDetayBatch(null); setDetayLoading(false); }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <h3 className="font-semibold text-on-surface">Batch Detayı</h3>
              <button onClick={() => { setDetayBatch(null); setDetayLoading(false); }} className="text-on-surface-variant hover:text-on-surface transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {detayLoading ? (
              <div className="p-12 text-center text-on-surface-variant text-sm">Yükleniyor...</div>
            ) : detayBatch && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-on-surface font-mono">{detayBatch.kod}</p>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${batchDurumMap[detayBatch.durum].color}15`, color: batchDurumMap[detayBatch.durum].color, border: `1px solid ${batchDurumMap[detayBatch.durum].color}30` }}>
                    {batchDurumMap[detayBatch.durum].label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Miktar", value: `${detayBatch.miktar.toLocaleString("tr-TR")} adet` },
                    { label: "Seri Prefix", value: detayBatch.seriPrefix, mono: true },
                    { label: "Üretici", value: detayBatch.uretici },
                    { label: "Üretim Tarihi", value: trDate(detayBatch.uretimTarihi) },
                    { label: "Kayıt Tarihi", value: trDate(detayBatch.createdAt) },
                    { label: "Tahsis Firması", value: detayBatch.tahsisFirma ?? "—" },
                  ].map(({ label, value, mono }) => (
                    <div key={label}>
                      <p className="text-xs text-on-surface-variant mb-0.5">{label}</p>
                      <p className={`text-on-surface text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-white/3 border border-white/8 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Toplam seri numarası</span>
                  <span className="text-sm font-semibold text-primary">{detayBatch.seriNumaralari.length.toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setSeriModal(detayBatch); setSeriSearch(""); setDetayBatch(null); }}
                    className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">list</span>Seri No Listesi
                  </button>
                  <button onClick={() => setDeleteBatch(detayBatch)}
                    className="py-2.5 px-4 rounded-xl text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">delete</span>Sil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seri No Listesi Modal */}
      {seriModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSeriModal(null)}>
          <div className="w-full max-w-md rounded-2xl flex flex-col" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", maxHeight: "80vh" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-on-surface">Seri No Listesi</h3>
                <p className="text-xs text-on-surface-variant">{seriModal.kod} — {seriModal.miktar.toLocaleString("tr-TR")} adet</p>
              </div>
              <button onClick={() => setSeriModal(null)} className="text-on-surface-variant hover:text-on-surface transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-3 border-b border-white/8 flex-shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
                <input value={seriSearch} onChange={e => setSeriSearch(e.target.value)} placeholder="Seri numarası ara..."
                  className="w-full bg-surface-dim border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-primary outline-none" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-2 gap-1.5">
                {filteredSeri.slice(0, 200).map(s => (
                  <div key={s} className="px-3 py-1.5 rounded-lg bg-white/3 border border-white/5 text-xs font-mono text-on-surface">{s}</div>
                ))}
              </div>
              {filteredSeri.length > 200 && (
                <p className="text-xs text-on-surface-variant text-center mt-3">... ve {(filteredSeri.length - 200).toLocaleString("tr-TR")} adet daha. Aramayı daraltın.</p>
              )}
              {filteredSeri.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center mt-4">Sonuç bulunamadı.</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/8 flex-shrink-0 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">{filteredSeri.length.toLocaleString("tr-TR")} sonuç</span>
              <button onClick={() => {
                const txt = seriModal.seriNumaralari.join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
                a.download = `${seriModal.kod}-seri-numaralari.txt`;
                a.click();
              }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-sm">download</span>TXT İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenle Modal */}
      {editBatch && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditBatch(null)}>
          <div className="w-full max-w-lg rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <div>
                <h3 className="font-semibold text-on-surface">Batch Düzenle</h3>
                <p className="text-xs text-on-surface-variant font-mono">{editBatch.kod}</p>
              </div>
              <button onClick={() => setEditBatch(null)} className="text-on-surface-variant hover:text-on-surface transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Batch Kodu *</label>
                    <input required value={editForm.kod} onChange={e => setEditForm(p => ({ ...p, kod: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Seri Prefix</label>
                    <input value={editForm.seriPrefix} onChange={e => setEditForm(p => ({ ...p, seriPrefix: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Miktar (adet) *</label>
                    <input required type="number" min={1} value={editForm.miktar} onChange={e => setEditForm(p => ({ ...p, miktar: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Üretim Tarihi</label>
                    <input type="date" value={editForm.uretimTarihi} onChange={e => setEditForm(p => ({ ...p, uretimTarihi: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all [color-scheme:dark]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Üretici Firma</label>
                  <input value={editForm.uretici} onChange={e => setEditForm(p => ({ ...p, uretici: e.target.value }))}
                    placeholder="Üretici firma adı"
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Durum</label>
                    <select value={editForm.durum} onChange={e => setEditForm(p => ({ ...p, durum: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                      <option value="URETIMDE">Üretimde</option>
                      <option value="STOKTA">Stokta</option>
                      <option value="TAHSIS">Tahsis Edildi</option>
                      <option value="IPTAL">İptal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Tahsis Edilen Firma</label>
                    <select value={editForm.tahsisFirma} onChange={e => setEditForm(p => ({ ...p, tahsisFirma: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                      <option value="">— Seçilmedi —</option>
                      {firmalar.map(f => <option key={f.id} value={f.ad}>{f.ad}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-5">
                {editError && <p className="text-xs text-red-400 flex items-center gap-1 mb-3"><span className="material-symbols-outlined text-sm">error</span>{editError}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditBatch(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">
                    İptal
                  </button>
                  <button type="submit" disabled={editLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60">
                    {editLoading ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sil Onay Dialog */}
      {deleteBatch && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setDeleteBatch(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-400 text-2xl">delete_forever</span>
            </div>
            <h3 className="font-semibold text-on-surface text-center mb-1">Batch&apos;i Sil</h3>
            <p className="text-sm text-on-surface-variant text-center mb-1">
              <span className="text-on-surface font-medium font-mono">{deleteBatch.kod}</span>
            </p>
            <p className="text-xs text-on-surface-variant text-center mb-5">
              {deleteBatch.miktar.toLocaleString("tr-TR")} adetlik bu üretim partisi kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteBatch(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">
                İptal
              </button>
              <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60">
                {deleteLoading ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
        <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value.toLocaleString("tr-TR")}</p>
      <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
    </div>
  );
}
