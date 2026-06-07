"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { paketLabel, firmaDurumMap } from "@/lib/labels";

interface AdminFirma {
  id: string; ad: string; email: string; paket: string; durum: string;
  mrr: number; uyeSayisi: number; aktifKart: number;
  telefon?: string; adres?: string; website?: string; sektor?: string;
  temsilci?: string; paketBaslangic?: string; paketBitis?: string | null;
}

interface EditForm {
  ad: string; email: string; telefon: string; adres: string;
  website: string; sektor: string; temsilci: string;
  paket: string; durum: string; paketBaslangic: string; paketBitis: string;
}

export default function AdminFirmalarPage() {
  const [firmalar, setFirmalar] = useState<AdminFirma[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [durum, setDurum] = useState("tum");
  const [paket, setPaket] = useState("tum");

  const [editFirma, setEditFirma] = useState<AdminFirma | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ ad: "", email: "", telefon: "", adres: "", website: "", sektor: "", temsilci: "", paket: "", durum: "", paketBaslangic: "", paketBitis: "" });
  const [editTab, setEditTab] = useState<"genel" | "paket">("genel");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteFirma, setDeleteFirma] = useState<AdminFirma | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/firmalar").then(r => r.json()).then(j => { if (j.ok) setFirmalar(j.firmalar); }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => firmalar.filter(f => {
    if (durum !== "tum" && f.durum !== durum) return false;
    if (paket !== "tum" && f.paket !== paket) return false;
    if (q && !f.ad.toLowerCase().includes(q.toLowerCase()) && !f.email.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [firmalar, q, durum, paket]);

  function toDateInput(v?: string | null) {
    if (!v) return "";
    return new Date(v).toISOString().slice(0, 10);
  }

  function openEdit(f: AdminFirma) {
    setEditFirma(f);
    setEditTab("genel");
    setEditForm({
      ad: f.ad, email: f.email,
      telefon: f.telefon ?? "", adres: f.adres ?? "",
      website: f.website ?? "", sektor: f.sektor ?? "",
      temsilci: f.temsilci ?? "",
      paket: f.paket, durum: f.durum,
      paketBaslangic: toDateInput(f.paketBaslangic),
      paketBitis: toDateInput(f.paketBitis),
    });
    setEditError("");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editFirma) return;
    setEditLoading(true); setEditError("");
    const res = await fetch(`/api/admin/firmalar/${editFirma.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const j = await res.json();
    setEditLoading(false);
    if (!j.ok) { setEditError(j.error || "Güncelleme başarısız."); return; }
    setFirmalar(prev => prev.map(f => f.id === editFirma.id ? { ...f, ...editForm, paketBaslangic: editForm.paketBaslangic || f.paketBaslangic, paketBitis: editForm.paketBitis || null } : f));
    setEditFirma(null);
  }

  async function handleDelete() {
    if (!deleteFirma) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/admin/firmalar/${deleteFirma.id}`, { method: "DELETE" });
    const j = await res.json();
    setDeleteLoading(false);
    if (j.ok) {
      setFirmalar(prev => prev.filter(f => f.id !== deleteFirma.id));
      setDeleteFirma(null);
    }
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Firma adı veya e-posta ara..."
            className="w-full bg-surface-dim border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:ring-0 outline-none transition-all" />
        </div>
        <select value={durum} onChange={e => setDurum(e.target.value)} className="bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none">
          <option value="tum">Tüm Durumlar</option>
          <option value="AKTIF">Aktif</option><option value="DENEME">Deneme</option><option value="ASKIDA">Askıda</option><option value="IPTAL">İptal</option>
        </select>
        <select value={paket} onChange={e => setPaket(e.target.value)} className="bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none">
          <option value="tum">Tüm Paketler</option>
          <option value="BASLANGIC">Başlangıç</option><option value="PROFESYONEL">Profesyonel</option><option value="KURUMSAL">Kurumsal</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
          <span className="material-symbols-outlined text-base">add</span>Yeni Firma
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/3 border-b border-white/5">
              <tr className="text-left text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Firma</th>
                <th className="px-4 py-3 font-medium">Paket</th>
                <th className="px-4 py-3 font-medium text-center">Üye</th>
                <th className="px-4 py-3 font-medium text-center">Aktif Kart</th>
                <th className="px-4 py-3 font-medium text-right">MRR</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">Yükleniyor...</td></tr>
              ) : filtered.map(f => (
                <tr key={f.id} className="border-b border-white/5 hover:bg-white/3 transition-all">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-base">corporate_fare</span>
                      </div>
                      <div><p className="text-on-surface font-medium">{f.ad}</p><p className="text-xs text-on-surface-variant">{f.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-primary">{paketLabel[f.paket]}</span></td>
                  <td className="px-4 py-3 text-center text-on-surface">{f.uyeSayisi}</td>
                  <td className="px-4 py-3 text-center text-on-surface">{f.aktifKart}</td>
                  <td className="px-4 py-3 text-right font-medium text-on-surface">₺{f.mrr.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${firmaDurumMap[f.durum].color}15`, color: firmaDurumMap[f.durum].color, border: `1px solid ${firmaDurumMap[f.durum].color}30` }}>
                      {firmaDurumMap[f.durum].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/firmalar/${f.id}`} className="text-primary text-xs hover:underline">Detay →</Link>
                      <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-all" title="Düzenle">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => setDeleteFirma(f)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all" title="Sil">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (<tr><td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">Sonuç bulunamadı.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-on-surface-variant text-right">{filtered.length} firma listeleniyor.</p>

      {/* Düzenle Modal */}
      {editFirma && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditFirma(null)}>
          <div className="w-full max-w-lg rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
            {/* Başlık */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <h3 className="font-semibold text-on-surface text-base">Firmayı Düzenle</h3>
              <button onClick={() => setEditFirma(null)} className="text-on-surface-variant hover:text-on-surface transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Sekmeler */}
            <div className="flex border-b border-white/8">
              {(["genel", "paket"] as const).map(tab => (
                <button key={tab} onClick={() => setEditTab(tab)}
                  className={`px-6 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${editTab === tab ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
                  {tab === "genel" ? "Genel Bilgiler" : "Paket & Tarih"}
                </button>
              ))}
            </div>
            <form onSubmit={handleEdit}>
              <div className="p-6 space-y-4">
                {editTab === "genel" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Firma Adı *</label>
                        <input required value={editForm.ad} onChange={e => setEditForm(p => ({ ...p, ad: e.target.value }))}
                          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">E-Posta *</label>
                        <input required type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Telefon</label>
                        <input value={editForm.telefon} onChange={e => setEditForm(p => ({ ...p, telefon: e.target.value }))}
                          placeholder="+90 5xx xxx xx xx"
                          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Temsilci</label>
                        <input value={editForm.temsilci} onChange={e => setEditForm(p => ({ ...p, temsilci: e.target.value }))}
                          placeholder="Sorumlu kişi adı"
                          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Sektör</label>
                        <input value={editForm.sektor} onChange={e => setEditForm(p => ({ ...p, sektor: e.target.value }))}
                          placeholder="Teknoloji, Sağlık..."
                          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Website</label>
                        <input value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))}
                          placeholder="https://..."
                          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-on-surface-variant mb-1 block">Adres</label>
                      <input value={editForm.adres} onChange={e => setEditForm(p => ({ ...p, adres: e.target.value }))}
                        placeholder="Şirket adresi"
                        className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Paket</label>
                        <select value={editForm.paket} onChange={e => setEditForm(p => ({ ...p, paket: e.target.value }))}
                          className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                          <option value="BASLANGIC">Başlangıç</option>
                          <option value="PROFESYONEL">Profesyonel</option>
                          <option value="KURUMSAL">Kurumsal</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Durum</label>
                        <select value={editForm.durum} onChange={e => setEditForm(p => ({ ...p, durum: e.target.value }))}
                          className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                          <option value="AKTIF">Aktif</option>
                          <option value="DENEME">Deneme</option>
                          <option value="ASKIDA">Askıda</option>
                          <option value="IPTAL">İptal</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Paket Başlangıç</label>
                        <input type="date" value={editForm.paketBaslangic} onChange={e => setEditForm(p => ({ ...p, paketBaslangic: e.target.value }))}
                          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Paket Bitiş <span className="text-on-surface-variant/50">(opsiyonel)</span></label>
                        <input type="date" value={editForm.paketBitis} onChange={e => setEditForm(p => ({ ...p, paketBitis: e.target.value }))}
                          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all [color-scheme:dark]" />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/3 border border-white/8 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                      Paket değiştirildiğinde MRR otomatik güncellenir. Deneme durumunda MRR sıfırlanır.
                    </div>
                  </>
                )}
              </div>
              <div className="px-6 pb-5">
                {editError && <p className="text-xs text-red-400 flex items-center gap-1 mb-3"><span className="material-symbols-outlined text-sm">error</span>{editError}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditFirma(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">
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
      {deleteFirma && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setDeleteFirma(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-400 text-2xl">delete_forever</span>
            </div>
            <h3 className="font-semibold text-on-surface text-center mb-1">Firmayı Sil</h3>
            <p className="text-sm text-on-surface-variant text-center mb-5">
              <span className="text-on-surface font-medium">{deleteFirma.ad}</span> firması ve tüm verisi kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteFirma(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">
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
