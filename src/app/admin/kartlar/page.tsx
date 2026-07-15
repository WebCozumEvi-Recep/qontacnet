"use client";
import { useEffect, useState } from "react";
import { batchDurumMap, trDate } from "@/lib/labels";

interface Batch {
  id: string; kod: string; miktar: number; uretici: string; uretimTarihi: string;
  durum: string; tahsisFirma: string | null; tahsisFirmaId: string | null; seriPrefix: string; createdAt: string;
}

interface PhysicalCardRow { id: string; seriNo: string; token: string; aktif: boolean; aktivasyonAt: string | null; memberId: string | null; nfcPwd?: string | null; nfcPack?: string | null; }
interface BatchDetail extends Batch { seriNumaralari: string[]; physicalCards?: PhysicalCardRow[]; }

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
  const [nfcKilitAktif, setNfcKilitAktif] = useState(false);
  const [nfcDestek, setNfcDestek] = useState(false);
  // Yazma durumu: hangi seri no yazılıyor + sonuç
  const [nfcYaz, setNfcYaz] = useState<{ seri: string; durum: "yaziliyor" | "ok" | "hata"; mesaj?: string; url?: string } | null>(null);

  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ kod: "", miktar: "", seriPrefix: "", uretici: "", uretimTarihi: "", durum: "", tahsisFirma: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteBatch, setDeleteBatch] = useState<Batch | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const emptyNewForm: EditForm = { kod: "", miktar: "", seriPrefix: "", uretici: "", uretimTarihi: new Date().toISOString().slice(0, 10), durum: "URETIMDE", tahsisFirma: "" };
  const [newModal, setNewModal] = useState(false);
  const [newForm, setNewForm] = useState<EditForm>(emptyNewForm);
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState("");

  useEffect(() => {
    fetch("/api/admin/batches").then(r => r.json()).then(j => { if (j.ok) setBatches(j.batches); }).finally(() => setLoading(false));
    fetch("/api/admin/firmalar").then(r => r.json()).then(j => { if (j.ok) setFirmalar(j.firmalar.map((f: { id: string; ad: string }) => ({ id: f.id, ad: f.ad }))); });
    // Web NFC yazma desteği (yalnız Android Chrome + HTTPS)
    setNfcDestek(typeof window !== "undefined" && "NDEFReader" in window);
  }, []);

  // Boş NFC karta URL'yi telefonla doğrudan yaz (Web NFC — Android Chrome).
  // Not: NDEF URL yazar; donanım kilidini (PWD/PACK) set edemez — o native araç ister.
  async function yazNfc(seriNo: string, url: string) {
    type NdefWriter = { write: (m: { records: { recordType: string; data: string }[] }) => Promise<void> };
    const Ctor = (window as unknown as { NDEFReader?: new () => NdefWriter }).NDEFReader;
    if (!Ctor) {
      const iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      setNfcYaz({
        seri: seriNo,
        durum: "hata",
        url,
        mesaj: iOS
          ? "iPhone/iPad tarayıcısı NFC'ye YAZMAYı desteklemiyor (Apple sınırı — verilebilecek bir izin yok). Aşağıdaki URL'yi kopyalayıp kendi iOS NFC uygulamanıza yapıştırarak yazabilirsiniz. Android + Chrome'da ise doğrudan buradan yazılır."
          : "Bu cihaz/tarayıcı NFC yazmayı desteklemiyor. Android telefonda Chrome ile açın — ya da URL'yi kopyalayıp bir NFC uygulaması/encoder ile yazın.",
      });
      return;
    }
    try {
      setNfcYaz({ seri: seriNo, durum: "yaziliyor" });
      await new Ctor().write({ records: [{ recordType: "url", data: url }] });
      setNfcYaz({ seri: seriNo, durum: "ok" });
    } catch (e) {
      setNfcYaz({ seri: seriNo, durum: "hata", mesaj: e instanceof Error ? e.message : "Yazılamadı." });
    }
  }

  function toDateInput(v?: string | null) {
    if (!v) return "";
    return new Date(v).toISOString().slice(0, 10);
  }

  function openEdit(b: Batch) {
    setEditBatch(b);
    setEditForm({
      kod: b.kod, miktar: String(b.miktar), seriPrefix: b.seriPrefix,
      uretici: b.uretici, uretimTarihi: toDateInput(b.uretimTarihi),
      durum: b.durum, tahsisFirma: b.tahsisFirmaId ?? "",
    });
    setEditError("");
  }

  async function handleNew(e: React.FormEvent) {
    e.preventDefault();
    setNewLoading(true); setNewError("");
    const res = await fetch("/api/admin/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newForm, miktar: parseInt(newForm.miktar) }),
    });
    const j = await res.json();
    setNewLoading(false);
    if (!j.ok) { setNewError(j.error || "Oluşturma başarısız."); return; }
    setBatches(prev => [j.batch, ...prev]);
    setNewModal(false);
    setNewForm(emptyNewForm);
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
    if (j.ok) setDetayBatch({ ...j.batch, seriNumaralari: (j.physicalCards ?? []).map((c: PhysicalCardRow) => c.seriNo), physicalCards: j.physicalCards ?? [] });
  }

  async function openSeri(batch: Batch) {
    setSeriSearch("");
    setSeriModal(null);
    const res = await fetch(`/api/admin/batches/${batch.id}`);
    const j = await res.json();
    if (j.ok) {
      setNfcKilitAktif(Boolean(j.nfcKilitAktif));
      setSeriModal({ ...j.batch, seriNumaralari: (j.physicalCards ?? []).map((c: PhysicalCardRow) => c.seriNo), physicalCards: j.physicalCards ?? [] });
    }
  }

  async function handleDelete() {
    if (!deleteBatch) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/admin/batches/${deleteBatch.id}`, { method: "DELETE" });
    const j = await res.json();
    setDeleteLoading(false);
    if (j.ok) { setBatches(prev => prev.filter(b => b.id !== deleteBatch.id)); setDeleteBatch(null); }
  }

  // Fiziksel kart URL'leri — kaynak ayrımı için ?src parametresi taşır.
  // NFC çipine nfcUrl, basılı QR'a qrUrl yazılır; ziyaret kaynağı böyle ayrışır.
  const nfcUrl = (token: string) => `https://qontac.net/k/${token}?src=nfc`;
  const qrUrl = (token: string) => `https://qontac.net/k/${token}?src=qr`;

  const filteredCards = (seriModal?.physicalCards ?? []).filter(c =>
    !seriSearch || c.seriNo.toUpperCase().includes(seriSearch.toUpperCase()) || c.token.includes(seriSearch)
  );
  const filteredSeri = seriModal?.seriNumaralari.filter(s => s.includes(seriSearch.toUpperCase())) ?? [];

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="inventory" label="Toplam Üretilen" value={toplam} color="#d4af37" />
        <Stat icon="warehouse" label="Stokta" value={sum("STOKTA")} color="#42faba" />
        <Stat icon="assignment_turned_in" label="Tahsis Edildi" value={sum("TAHSIS")} color="#6001d1" />
        <Stat icon="factory" label="Üretimde" value={sum("URETIMDE")} color="#f0d289" />
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Üretim Partileri (Batch)</h3>
        <button onClick={() => { setNewForm(emptyNewForm); setNewError(""); setNewModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
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
              {b.tahsisFirmaId && (
                <div className="pt-3 border-t border-white/5">
                  <p className="text-xs text-on-surface-variant">Tahsis Edilen Firma</p>
                  <p className="text-primary text-sm font-medium">{firmalar.find(f => f.id === b.tahsisFirmaId)?.ad ?? b.tahsisFirma ?? b.tahsisFirmaId}</p>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
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
                    { label: "Tahsis Firması", value: firmalar.find(f => f.id === detayBatch.tahsisFirmaId)?.ad ?? detayBatch.tahsisFirma ?? "—" },
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl flex flex-col" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", maxHeight: "80vh" }}>
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
            <div className="overflow-y-auto flex-1 p-4 space-y-1.5">
              {/* PhysicalCard kayıtları varsa NFC/QR URL'leriyle göster, yoksa eski seri listesi */}
              {filteredCards.length > 0 ? (
                <>
                  {!nfcKilitAktif && (
                    <div className="flex items-start gap-2 px-3 py-2 mb-1.5 rounded-lg bg-amber-400/8 border border-amber-400/20 text-[11px] text-amber-300/90">
                      <span className="material-symbols-outlined text-sm flex-shrink-0">lock_open</span>
                      <span>NFC kilit anahtarı tanımsız — parola (PWD/PACK) hesaplanamıyor. Ayarlar → NFC Kart Kilit Anahtarı&apos;ndan tanımlayın.</span>
                    </div>
                  )}
                  <div className="hidden sm:flex items-center gap-3 px-3 pb-1 text-[10px] uppercase tracking-wider text-on-surface-variant/60">
                    <span className="w-2 flex-shrink-0" />
                    <span className="w-24 flex-shrink-0">Seri No</span>
                    <span className="flex-1">NFC URL</span>
                    <span className="flex-1">QR URL</span>
                    <span className="w-28 flex-shrink-0">Kilit (PWD/PACK)</span>
                    <span className="w-14 flex-shrink-0 text-right">Durum</span>
                    <span className="w-24 flex-shrink-0 text-right">İşlem</span>
                  </div>
                  {filteredCards.slice(0, 200).map(c => (
                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
                      <span className={`hidden sm:block w-2 h-2 rounded-full flex-shrink-0 ${c.aktif ? "bg-tertiary" : "bg-white/20"}`} />
                      <span className="text-xs font-mono text-on-surface flex-shrink-0 sm:w-24">{c.seriNo}</span>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(nfcUrl(c.token))}
                        title="Kopyalamak için tıkla — NFC çipine yazılır"
                        className="text-left text-xs font-mono text-primary/80 hover:text-primary flex-1 truncate transition-colors">
                        {nfcUrl(c.token)}
                      </button>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(qrUrl(c.token))}
                        title="Kopyalamak için tıkla — basılı QR koduna gömülür"
                        className="text-left text-xs font-mono text-tertiary/80 hover:text-tertiary flex-1 truncate transition-colors">
                        {qrUrl(c.token)}
                      </button>
                      {c.nfcPwd ? (
                        <button type="button" onClick={() => navigator.clipboard?.writeText(`${c.nfcPwd} ${c.nfcPack}`)}
                          title="Kopyalamak için tıkla — çipin PWD ve PACK değeri"
                          className="text-left text-xs font-mono text-amber-300/80 hover:text-amber-300 flex-shrink-0 sm:w-28 truncate transition-colors">
                          {c.nfcPwd}/{c.nfcPack}
                        </button>
                      ) : (
                        <span className="text-xs text-on-surface-variant/30 flex-shrink-0 sm:w-28">—</span>
                      )}
                      {c.aktif
                        ? <span className="text-xs text-tertiary flex-shrink-0 sm:w-14 sm:text-right">Aktif</span>
                        : <span className="text-xs text-on-surface-variant/40 flex-shrink-0 sm:w-14 sm:text-right">Bekliyor</span>}
                      <button type="button" onClick={() => yazNfc(c.seriNo, nfcUrl(c.token))}
                        title="Boş NFC kartı telefona yaklaştırıp URL'yi yaz"
                        className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-primary/15 border border-primary/25 text-primary text-[11px] font-medium whitespace-nowrap flex-shrink-0 sm:w-24">
                        <span className="material-symbols-outlined text-sm">nfc</span>NFC Yaz
                      </button>
                    </div>
                  ))}
                </>
              ) : filteredSeri.slice(0, 200).map(s => (
                <div key={s} className="px-3 py-1.5 rounded-lg bg-white/3 border border-white/5 text-xs font-mono text-on-surface">{s}</div>
              ))}
              {(filteredCards.length > 200 || filteredSeri.length > 200) && (
                <p className="text-xs text-on-surface-variant text-center mt-3">... ve daha fazlası. Aramayı daraltın.</p>
              )}
              {filteredCards.length === 0 && filteredSeri.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center mt-4">Sonuç bulunamadı.</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/8 flex-shrink-0 flex items-center justify-between gap-2">
              <span className="text-xs text-on-surface-variant">
                {(filteredCards.length || filteredSeri.length).toLocaleString("tr-TR")} sonuç
                {nfcDestek && <span className="hidden sm:inline"> · Boş kartı telefona yaklaştırıp &quot;NFC Yaz&quot;a basın</span>}
              </span>
              <div className="flex gap-2">
                {filteredCards.length > 0 && (
                  <button onClick={() => {
                    const rows = (seriModal?.physicalCards ?? []).map(c => `${c.seriNo}\t${nfcUrl(c.token)}\t${qrUrl(c.token)}\t${c.nfcPwd ?? ""}\t${c.nfcPack ?? ""}\t${c.aktif ? "Aktif" : "Bekliyor"}`);
                    const txt = "Seri No\tNFC URL\tQR URL\tPWD\tPACK\tDurum\n" + rows.join("\n");
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(new Blob([txt], { type: "text/tab-separated-values" }));
                    a.download = `${seriModal?.kod}-kartlar.tsv`;
                    a.click();
                  }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                    <span className="material-symbols-outlined text-sm">download</span>TSV İndir
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NFC Yazma Durumu */}
      {nfcYaz && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => nfcYaz.durum !== "yaziliyor" && setNfcYaz(null)}>
          <div className="w-full max-w-xs rounded-2xl p-6 text-center" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
            {nfcYaz.durum === "yaziliyor" && (
              <>
                <span className="material-symbols-outlined text-primary text-5xl block animate-pulse">nfc</span>
                <p className="text-on-surface font-semibold mt-3">Kartı yaklaştırın</p>
                <p className="text-xs text-on-surface-variant mt-1">Boş NFC kartı telefonun arkasına dokundurun — <span className="font-mono">{nfcYaz.seri}</span> yazılıyor.</p>
              </>
            )}
            {nfcYaz.durum === "ok" && (
              <>
                <span className="material-symbols-outlined text-tertiary text-5xl block">check_circle</span>
                <p className="text-on-surface font-semibold mt-3">Yazıldı</p>
                <p className="text-xs text-on-surface-variant mt-1"><span className="font-mono">{nfcYaz.seri}</span> kartına URL yazıldı.</p>
                <p className="text-[11px] text-amber-300/70 mt-2">Not: Donanım kilidi (PWD/PACK) bu yolla yazılamaz — kilit için üretim/encoder aracı gerekir.</p>
                <button onClick={() => setNfcYaz(null)} className="mt-4 px-5 py-2 rounded-xl text-sm bg-primary-container text-on-primary-container font-semibold">Tamam</button>
              </>
            )}
            {nfcYaz.durum === "hata" && (
              <>
                <span className="material-symbols-outlined text-amber-400 text-5xl block">nfc</span>
                <p className="text-on-surface font-semibold mt-3">Bu cihazda yazılamıyor</p>
                <p className="text-xs text-on-surface-variant mt-1 text-left">{nfcYaz.mesaj}</p>
                {nfcYaz.url && (
                  <div className="mt-3 text-left">
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 mb-1">Kart URL&apos;si ({nfcYaz.seri})</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[11px] font-mono text-primary bg-surface-dim/70 border border-white/10 rounded-lg px-2 py-1.5 truncate">{nfcYaz.url}</code>
                      <button onClick={() => navigator.clipboard?.writeText(nfcYaz.url!)}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs bg-primary/15 border border-primary/25 text-primary inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">content_copy</span>Kopyala
                      </button>
                    </div>
                  </div>
                )}
                <button onClick={() => setNfcYaz(null)} className="mt-4 px-5 py-2 rounded-xl text-sm border border-white/10 text-on-surface-variant">Kapat</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Yeni Batch Modal */}
      {newModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <h3 className="font-semibold text-on-surface">Yeni Üretim Siparişi</h3>
              <button onClick={() => setNewModal(false)} className="text-on-surface-variant hover:text-on-surface transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleNew}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Batch Kodu *</label>
                    <input required value={newForm.kod} onChange={e => setNewForm(p => ({ ...p, kod: e.target.value }))}
                      placeholder="QNC-B2501-001"
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Seri Prefix</label>
                    <input value={newForm.seriPrefix} onChange={e => setNewForm(p => ({ ...p, seriPrefix: e.target.value }))}
                      placeholder="QNC-2501"
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Miktar (adet) *</label>
                    <input required type="number" min={1} value={newForm.miktar} onChange={e => setNewForm(p => ({ ...p, miktar: e.target.value }))}
                      placeholder="500"
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Üretim Tarihi</label>
                    <input type="date" value={newForm.uretimTarihi} onChange={e => setNewForm(p => ({ ...p, uretimTarihi: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all [color-scheme:dark]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Üretici Firma</label>
                  <input value={newForm.uretici} onChange={e => setNewForm(p => ({ ...p, uretici: e.target.value }))}
                    placeholder="NFC Solutions Ltd."
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Durum</label>
                    <select value={newForm.durum} onChange={e => setNewForm(p => ({ ...p, durum: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                      <option value="URETIMDE">Üretimde</option>
                      <option value="STOKTA">Stokta</option>
                      <option value="TAHSIS">Tahsis Edildi</option>
                      <option value="BITTI">Bitti</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Tahsis Edilen Firma</label>
                    <select value={newForm.tahsisFirma} onChange={e => setNewForm(p => ({ ...p, tahsisFirma: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                      <option value="">— Seçilmedi —</option>
                      {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-5">
                {newError && <p className="text-xs text-red-400 flex items-center gap-1 mb-3"><span className="material-symbols-outlined text-sm">error</span>{newError}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setNewModal(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all">
                    İptal
                  </button>
                  <button type="submit" disabled={newLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60">
                    {newLoading ? "Oluşturuluyor..." : "Oluştur"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Düzenle Modal */}
      {editBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
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
                      <option value="BITTI">Bitti</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Tahsis Edilen Firma</label>
                    <select value={editForm.tahsisFirma} onChange={e => setEditForm(p => ({ ...p, tahsisFirma: e.target.value }))}
                      className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none">
                      <option value="">— Seçilmedi —</option>
                      {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
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
