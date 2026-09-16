"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trDate } from "@/lib/labels";

interface Uye {
  id: string; ad: string; soyad: string; email: string; telefon: string; aktif: boolean; createdAt: string;
  firmaId: string | null; firmaAd: string | null; sifreBekliyor: boolean; siparis: number;
  physicalCard: { seriNo: string; aktif: boolean } | null;
}
interface Firma { id: string; ad: string }

const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none";
const FIRMASIZ = "__firmasiz__";

export default function AdminUyelerPage() {
  const [uyeler, setUyeler] = useState<Uye[]>([]);
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [loading, setLoading] = useState(true);
  const [arama, setArama] = useState("");
  const [firmaFiltre, setFirmaFiltre] = useState("");
  const [kartFiltre, setKartFiltre] = useState<"" | "var" | "yok">("");

  const [duzenlenen, setDuzenlenen] = useState<Uye | null>(null);
  const [form, setForm] = useState({ firmaId: "", aktif: true });
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

  function duzenleAc(u: Uye) {
    setDuzenlenen(u); setForm({ firmaId: u.firmaId ?? "", aktif: u.aktif }); setHata("");
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!duzenlenen) return;
    setKaydediliyor(true); setHata("");
    try {
      const j = await fetch(`/api/admin/uyeler/${duzenlenen.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      }).then(r => r.json());
      if (!j.ok) { setHata(j.error || "Kaydedilemedi."); return; }
      setUyeler(p => p.map(u => u.id === duzenlenen.id ? { ...u, firmaId: j.uye.firmaId, firmaAd: j.uye.firmaAd, aktif: j.uye.aktif } : u));
      setDuzenlenen(null);
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

      {duzenlenen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <div className="min-w-0">
                <h3 className="font-semibold text-on-surface truncate">{`${duzenlenen.ad} ${duzenlenen.soyad}`.trim()}</h3>
                <p className="text-xs text-on-surface-variant truncate">{duzenlenen.email}</p>
              </div>
              <button onClick={() => setDuzenlenen(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={kaydet}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Firma</label>
                  <select value={form.firmaId} onChange={e => setForm(p => ({ ...p, firmaId: e.target.value }))} className={inputCls}>
                    <option value="">— Firmasız —</option>
                    {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                  <input type="checkbox" checked={form.aktif} onChange={e => setForm(p => ({ ...p, aktif: e.target.checked }))} className="accent-[#d4af37] w-4 h-4" />
                  Üye aktif
                </label>
              </div>
              <div className="px-6 pb-5">
                {hata && <p className="text-xs text-red-400 flex items-center gap-1 mb-3"><span className="material-symbols-outlined text-sm">error</span>{hata}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setDuzenlenen(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5">İptal</button>
                  <button type="submit" disabled={kaydediliyor} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black disabled:opacity-60">
                    {kaydediliyor ? "Kaydediliyor..." : "Kaydet"}
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
