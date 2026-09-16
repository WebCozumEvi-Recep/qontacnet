"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trDate } from "@/lib/labels";

interface Uye {
  id: string; ad: string; soyad: string; email: string; telefon: string; unvan: string; aktif: boolean; createdAt: string;
  firmaId: string | null; firmaAd: string | null; sifreBekliyor: boolean; siparis: number;
  physicalCard: { seriNo: string; aktif: boolean } | null;
}
interface Firma { id: string; ad: string }

const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none";
const FIRMASIZ = "__firmasiz__";

interface UyeForm { ad: string; soyad: string; email: string; telefon: string; unvan: string; firmaId: string; aktif: boolean; sifre: string }
const BOS_FORM: UyeForm = { ad: "", soyad: "", email: "", telefon: "", unvan: "", firmaId: "", aktif: true, sifre: "" };

// Tahmin edilmesi zor, okunaklı geçici şifre (karışan karakterler yok)
function sifreUret() {
  const k = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const d = new Uint32Array(10);
  crypto.getRandomValues(d);
  return Array.from(d, n => k[n % k.length]).join("");
}

export default function AdminUyelerPage() {
  const [uyeler, setUyeler] = useState<Uye[]>([]);
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [loading, setLoading] = useState(true);
  const [arama, setArama] = useState("");
  const [firmaFiltre, setFirmaFiltre] = useState("");
  const [kartFiltre, setKartFiltre] = useState<"" | "var" | "yok">("");

  // modal: null kapalı, "yeni" ekleme, Uye düzenleme
  const [modal, setModal] = useState<"yeni" | Uye | null>(null);
  const [form, setForm] = useState<UyeForm>(BOS_FORM);
  const [sifreGoster, setSifreGoster] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");

  useEffect(() => {
    fetch("/api/admin/uyeler").then(r => r.json()).then(j => {
      if (j.ok) { setUyeler(j.uyeler); setFirmalar(j.firmalar); }
    }).finally(() => setLoading(false));
  }, []);

  const liste = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    return uyeler.filter(u => {
      if (firmaFiltre === FIRMASIZ ? u.firmaId : firmaFiltre && u.firmaId !== firmaFiltre) return false;
      if (kartFiltre === "var" && !u.physicalCard) return false;
      if (kartFiltre === "yok" && u.physicalCard) return false;
      if (!q) return true;
      return [`${u.ad} ${u.soyad}`, u.email, u.telefon, u.firmaAd ?? "", u.physicalCard?.seriNo ?? ""]
        .some(v => v.toLocaleLowerCase("tr").includes(q));
    });
  }, [uyeler, arama, firmaFiltre, kartFiltre]);

  function yeniAc() {
    setModal("yeni"); setForm({ ...BOS_FORM, sifre: sifreUret() }); setSifreGoster(true); setHata("");
  }
  function duzenleAc(u: Uye) {
    setModal(u); setSifreGoster(false); setHata("");
    setForm({ ad: u.ad, soyad: u.soyad, email: u.email, telefon: u.telefon, unvan: u.unvan, firmaId: u.firmaId ?? "", aktif: u.aktif, sifre: "" });
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setKaydediliyor(true); setHata("");
    try {
      const yeni = modal === "yeni";
      const j = await fetch(yeni ? "/api/admin/uyeler" : `/api/admin/uyeler/${modal.id}`, {
        method: yeni ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      }).then(r => r.json());
      if (!j.ok) { setHata(j.error || "Kaydedilemedi."); return; }
      if (yeni) setUyeler(p => [j.uye, ...p]);
      else setUyeler(p => p.map(u => u.id === modal.id ? { ...u, ...j.uye } : u));
      setModal(null);
    } finally { setKaydediliyor(false); }
  }

  const kartli = uyeler.filter(u => u.physicalCard).length;
  const firmali = uyeler.filter(u => u.firmaId).length;
  const bekleyen = uyeler.filter(u => u.sifreBekliyor).length;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="group" label="Toplam Üye" value={uyeler.length} color="#d4af37" />
        <Stat icon="corporate_fare" label="Firmaya Bağlı" value={firmali} color="#6001d1" />
        <Stat icon="credit_card" label="Kartı Olan" value={kartli} color="#42faba" />
        <Stat icon="key" label="Şifre Bekliyor" value={bekleyen} color="#f0d289" />
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
          <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Ad, e-posta, telefon, firma, seri no ara..."
            className="w-full bg-surface-dim border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:border-primary outline-none" />
        </div>
        <select value={firmaFiltre} onChange={e => setFirmaFiltre(e.target.value)} className={`${inputCls} md:w-52`}>
          <option value="">Tüm firmalar</option>
          <option value={FIRMASIZ}>Firmasız</option>
          {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
        </select>
        <select value={kartFiltre} onChange={e => setKartFiltre(e.target.value as typeof kartFiltre)} className={`${inputCls} md:w-40`}>
          <option value="">Kart: tümü</option>
          <option value="var">Kartı olan</option>
          <option value="yok">Kartı olmayan</option>
        </select>
        <button onClick={yeniAc} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all whitespace-nowrap">
          <span className="material-symbols-outlined text-base">person_add</span>Yeni Üye
        </button>
      </div>

      {loading ? <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Yükleniyor...</div>
        : liste.length === 0 ? <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant text-sm">Sonuç bulunamadı.</div>
        : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="hidden lg:grid grid-cols-[1.6fr_1fr_1.1fr_120px_70px_90px_40px] gap-3 px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
              <span>Üye</span><span>Telefon</span><span>Firma</span><span>Kart</span><span>Sipariş</span><span>Kayıt</span><span />
            </div>
            {liste.map(u => (
              <div key={u.id} className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1.1fr_120px_70px_90px_40px] gap-1 lg:gap-3 lg:items-center px-4 py-3 border-b border-white/5 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-on-surface truncate flex items-center gap-2">
                    <Link href={`/kart/${u.id}`} target="_blank" className="hover:text-primary truncate">{`${u.ad} ${u.soyad}`.trim()}</Link>
                    {!u.aktif && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Pasif</span>}
                    {u.sifreBekliyor && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20" title="Siparişten açıldı, şifresini henüz belirlemedi">Şifre bekliyor</span>}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                </div>
                <p className="text-sm text-on-surface">{u.telefon || <span className="text-on-surface-variant/50">—</span>}</p>
                {u.firmaId
                  ? <Link href={`/admin/firmalar/${u.firmaId}`} className="text-sm text-primary truncate hover:underline">{u.firmaAd}</Link>
                  : <p className="text-sm text-on-surface-variant/50">Firmasız</p>}
                {u.physicalCard
                  ? <p className="text-xs font-mono"><span className={u.physicalCard.aktif ? "text-tertiary" : "text-on-surface-variant"}>{u.physicalCard.seriNo}</span></p>
                  : <p className="text-xs text-on-surface-variant/50">Kart yok</p>}
                <p className="text-sm text-on-surface">{u.siparis || <span className="text-on-surface-variant/50">—</span>}</p>
                <p className="text-xs text-on-surface-variant">{trDate(u.createdAt)}</p>
                <button onClick={() => duzenleAc(u)} className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-on-surface justify-self-start lg:justify-self-end" title="Düzenle">
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
              </div>
            ))}
            <div className="px-4 py-3 border-t border-white/5 text-xs text-on-surface-variant">{liste.length.toLocaleString("tr-TR")} üye</div>
          </div>
        )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <div className="min-w-0">
                <h3 className="font-semibold text-on-surface truncate">{modal === "yeni" ? "Yeni Üye" : "Üyeyi Düzenle"}</h3>
                {modal !== "yeni" && <p className="text-xs text-on-surface-variant truncate">Kayıt: {trDate(modal.createdAt)}</p>}
              </div>
              <button onClick={() => setModal(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={kaydet}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Ad *</label>
                    <input required value={form.ad} onChange={e => setForm(p => ({ ...p, ad: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Soyad</label>
                    <input value={form.soyad} onChange={e => setForm(p => ({ ...p, soyad: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">E-posta *</label>
                    <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Telefon</label>
                    <input type="tel" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} className={inputCls} placeholder="05xx xxx xx xx" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-on-surface-variant mb-1 block">Unvan</label>
                    <input value={form.unvan} onChange={e => setForm(p => ({ ...p, unvan: e.target.value }))} className={inputCls} placeholder="Satış Müdürü" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-on-surface-variant mb-1.5 block">Firma</label>
                  <div className="flex gap-2 mb-2">
                    {([["", "Firmasız"], ["firmali", "Firmaya bağlı"]] as const).map(([v, etiket]) => {
                      const secili = v ? form.firmaId !== "" : form.firmaId === "";
                      return (
                        <button key={etiket} type="button"
                          onClick={() => setForm(p => ({ ...p, firmaId: v ? (p.firmaId || firmalar[0]?.id || "") : "" }))}
                          disabled={v !== "" && firmalar.length === 0}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 ${secili ? "bg-primary/15 text-primary border-primary/40" : "border-white/10 text-on-surface-variant hover:bg-white/5"}`}>
                          {etiket}
                        </button>
                      );
                    })}
                  </div>
                  {form.firmaId !== "" && (
                    <select value={form.firmaId} onChange={e => setForm(p => ({ ...p, firmaId: e.target.value }))} className={inputCls}>
                      {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">
                    {modal === "yeni" ? "Şifre *" : "Yeni Şifre"}
                    {modal !== "yeni" && <span className="text-on-surface-variant/60"> (değiştirmeyecekseniz boş bırakın)</span>}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type={sifreGoster ? "text" : "password"} required={modal === "yeni"} minLength={6} autoComplete="new-password"
                        value={form.sifre} onChange={e => setForm(p => ({ ...p, sifre: e.target.value }))} className={`${inputCls} pr-10 font-mono`} />
                      <button type="button" onClick={() => setSifreGoster(v => !v)} title={sifreGoster ? "Gizle" : "Göster"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface">
                        <span className="material-symbols-outlined text-base">{sifreGoster ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                    <button type="button" onClick={() => { setForm(p => ({ ...p, sifre: sifreUret() })); setSifreGoster(true); }} title="Rastgele şifre üret"
                      className="px-3 rounded-xl border border-white/10 text-on-surface-variant hover:text-primary">
                      <span className="material-symbols-outlined text-base">casino</span>
                    </button>
                    <button type="button" disabled={!form.sifre} onClick={() => navigator.clipboard?.writeText(form.sifre)} title="Kopyala"
                      className="px-3 rounded-xl border border-white/10 text-on-surface-variant hover:text-primary disabled:opacity-40">
                      <span className="material-symbols-outlined text-base">content_copy</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-on-surface-variant/70 mt-1">Şifreyi üyeye siz iletin; sistem e-posta göndermez. Üye girişten sonra değiştirebilir.</p>
                </div>

                <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                  <input type="checkbox" checked={form.aktif} onChange={e => setForm(p => ({ ...p, aktif: e.target.checked }))} className="accent-[#d4af37] w-4 h-4" />
                  Üye aktif
                </label>
              </div>
              <div className="px-6 pb-5">
                {hata && <p className="text-xs text-red-400 flex items-center gap-1 mb-3"><span className="material-symbols-outlined text-sm">error</span>{hata}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5">İptal</button>
                  <button type="submit" disabled={kaydediliyor} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black disabled:opacity-60">
                    {kaydediliyor ? "Kaydediliyor..." : modal === "yeni" ? "Üyeyi Ekle" : "Kaydet"}
                  </button>
                </div>
              </div>
            </form>
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
