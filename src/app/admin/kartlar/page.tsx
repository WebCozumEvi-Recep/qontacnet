"use client";
import { useEffect, useMemo, useState } from "react";
import { trDate } from "@/lib/labels";
import { QRCodeSVG } from "qrcode.react";
import { kartNfcUrl, kartQrUrl } from "@/lib/kart-url";
import { KartBaskiModal } from "@/components/kart-baski/KartBaskiModal";

interface Kart {
  id: string; seriNo: string; token: string; aktif: boolean; aktivasyonAt: string | null;
  firmaId: string | null; orderId: string | null; memberId: string | null; notlar: string; createdAt: string;
  member: { id: string; ad: string; soyad: string; email: string; telefon: string; unvan: string } | null;
}
interface Secenek { id: string; ad: string }
interface Uye { id: string; ad: string; email: string; telefon: string; firmaId: string | null; kartVar: boolean }
interface Siparis { id: string; siparisNo: string; firma: string; firmaId: string | null; musteriAd: string; urun: string; adet: number }

interface KartForm { firmaId: string; orderId: string; memberId: string; notlar: string; adet: string; baslangic: string }

// Türkiye saatine göre "YYYY-AA-GG"
const gunAnahtari = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
const BOS_FORM = (): KartForm => ({ firmaId: "", orderId: "", memberId: "", notlar: "", adet: "1", baslangic: gunAnahtari(new Date()) });

// Toplu düzenlemede DEGISTIRME seçili alanlar olduğu gibi kalır; "" alanı temizler.
const DEGISTIRME = "__degistirme__";
interface TopluForm { firmaId: string; orderId: string; notDegistir: boolean; notlar: string }
const BOS_TOPLU: TopluForm = { firmaId: DEGISTIRME, orderId: DEGISTIRME, notDegistir: false, notlar: "" };

const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary outline-none";

export default function SatilanKartlarPage() {
  const [kartlar, setKartlar] = useState<Kart[]>([]);
  const [firmalar, setFirmalar] = useState<Secenek[]>([]);
  const [uyeler, setUyeler] = useState<Uye[]>([]);
  const [siparisler, setSiparisler] = useState<Siparis[]>([]);
  const [loading, setLoading] = useState(true);

  const [arama, setArama] = useState("");
  const [durumFiltre, setDurumFiltre] = useState<"" | "aktif" | "bekliyor">("");
  const [firmaFiltre, setFirmaFiltre] = useState("");
  const [kopyalanan, setKopyalanan] = useState<string | null>(null);

  const [modal, setModal] = useState<{ kart: Kart | null } | null>(null); // kart null → yeni
  const [form, setForm] = useState<KartForm>(BOS_FORM);
  const [olusan, setOlusan] = useState<Kart[] | null>(null); // yeni kart sonrası adres özeti
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");

  const [silinecek, setSilinecek] = useState<Kart | null>(null);
  const [qrKart, setQrKart] = useState<Kart | null>(null);
  const [baskiKart, setBaskiKart] = useState<Kart | null>(null);

  // Toplu işlem
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [topluDuzenle, setTopluDuzenle] = useState(false);
  const [topluForm, setTopluForm] = useState<TopluForm>(BOS_TOPLU);
  const [topluSil, setTopluSil] = useState(false);

  function yukle() {
    return fetch("/api/admin/kartlar").then(r => r.json()).then(j => {
      if (!j.ok) return;
      setKartlar(j.kartlar); setFirmalar(j.firmalar); setUyeler(j.uyeler); setSiparisler(j.siparisler);
    });
  }
  useEffect(() => { yukle().finally(() => setLoading(false)); }, []);

  const firmaAd = (id: string | null) => (id ? firmalar.find(f => f.id === id)?.ad ?? "—" : "—");
  const siparisNo = (id: string | null) => (id ? siparisler.find(s => s.id === id)?.siparisNo ?? "—" : "—");

  const liste = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    return kartlar.filter(k => {
      if (durumFiltre === "aktif" && !k.aktif) return false;
      if (durumFiltre === "bekliyor" && k.aktif) return false;
      if (firmaFiltre && k.firmaId !== firmaFiltre) return false;
      if (!q) return true;
      const uye = k.member ? `${k.member.ad} ${k.member.soyad} ${k.member.email} ${k.member.telefon}` : "";
      return [k.seriNo, k.token, uye, firmaAd(k.firmaId), siparisNo(k.orderId), k.notlar]
        .some(v => v.toLocaleLowerCase("tr").includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kartlar, arama, durumFiltre, firmaFiltre, firmalar, siparisler]);

  function kopyala(anahtar: string, metin: string) {
    navigator.clipboard?.writeText(metin);
    setKopyalanan(anahtar);
    setTimeout(() => setKopyalanan(k => (k === anahtar ? null : k)), 1500);
  }

  function yeniAc() {
    setForm(BOS_FORM()); setHata(""); setOlusan(null); setModal({ kart: null });
  }
  function duzenleAc(k: Kart) {
    setForm({
      firmaId: k.firmaId ?? "", orderId: k.orderId ?? "", memberId: k.memberId ?? "", notlar: k.notlar, adet: "1",
      baslangic: gunAnahtari(k.aktivasyonAt ? new Date(k.aktivasyonAt) : new Date()),
    });
    setHata(""); setOlusan(null); setModal({ kart: k });
  }

  // Sipariş seçilince firma boşsa siparişin referans firmasıyla doldur.
  function siparisSec(orderId: string) {
    const s = siparisler.find(x => x.id === orderId);
    setForm(p => ({ ...p, orderId, firmaId: p.firmaId || s?.firmaId || "" }));
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setKaydediliyor(true); setHata("");
    try {
      if (modal.kart) {
        const res = await fetch(`/api/admin/kartlar/${modal.kart.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firmaId: form.firmaId, orderId: form.orderId, memberId: form.memberId, notlar: form.notlar, baslangic: form.memberId ? form.baslangic : undefined }),
        });
        const j = await res.json();
        if (!j.ok) { setHata(j.error || "Kaydedilemedi."); return; }
      } else {
        const res = await fetch("/api/admin/kartlar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firmaId: form.firmaId, orderId: form.orderId, notlar: form.notlar,
            adet: form.memberId ? 1 : Number(form.adet) || 1,
            memberId: form.memberId || undefined, baslangic: form.baslangic,
          }),
        });
        const j = await res.json();
        if (!j.ok) { setHata(j.error || "Oluşturulamadı."); return; }
        await yukle(); // üye listesindeki "kartı var" bilgisi de tazelensin
        setOlusan(j.kartlar);
        return;
      }
      await yukle();
      setModal(null);
    } finally { setKaydediliyor(false); }
  }

  async function sil() {
    if (!silinecek) return;
    const res = await fetch(`/api/admin/kartlar/${silinecek.id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) {
      setKartlar(p => p.filter(k => k.id !== silinecek.id));
      setSecili(p => { const y = new Set(p); y.delete(silinecek.id); return y; });
      setSilinecek(null);
    }
  }

  const tumuSecili = liste.length > 0 && liste.every(k => secili.has(k.id));
  function tumunuSec() {
    setSecili(tumuSecili ? new Set() : new Set(liste.map(k => k.id)));
  }
  function secimDegistir(id: string) {
    setSecili(p => { const y = new Set(p); if (y.has(id)) y.delete(id); else y.add(id); return y; });
  }
  const seciliKartlar = kartlar.filter(k => secili.has(k.id));

  async function topluIstek(govde: Record<string, unknown>) {
    setKaydediliyor(true); setHata("");
    try {
      const res = await fetch("/api/admin/kartlar/toplu", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...secili], ...govde }),
      });
      const j = await res.json();
      if (!j.ok) { setHata(j.error || "İşlem başarısız."); return false; }
      await yukle();
      setSecili(new Set());
      return true;
    } finally { setKaydediliyor(false); }
  }

  async function topluKaydet(e: React.FormEvent) {
    e.preventDefault();
    const govde: Record<string, unknown> = { islem: "guncelle" };
    if (topluForm.firmaId !== DEGISTIRME) govde.firmaId = topluForm.firmaId;
    if (topluForm.orderId !== DEGISTIRME) govde.orderId = topluForm.orderId;
    if (topluForm.notDegistir) govde.notlar = topluForm.notlar;
    if (Object.keys(govde).length === 1) { setHata("Değiştirilecek bir alan seçin."); return; }
    if (await topluIstek(govde)) setTopluDuzenle(false);
  }

  function tsvIndir() {
    const satirlar = liste.map(k => [
      k.seriNo, k.member ? `${k.member.ad} ${k.member.soyad}`.trim() : "", k.member?.telefon ?? "", firmaAd(k.firmaId), siparisNo(k.orderId),
      kartNfcUrl(k.token), kartQrUrl(k.token), k.aktif ? "Aktif" : "Bekliyor", trDate(k.createdAt),
    ].join("\t"));
    const txt = "Seri No\tÜye\tTelefon\tFirma\tSipariş\tNFC URL\tQR URL\tDurum\tTarih\n" + satirlar.join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/tab-separated-values" }));
    a.download = "satilan-kartlar.tsv";
    a.click();
  }

  const aktifSayi = kartlar.filter(k => k.aktif).length;
  const referansli = kartlar.filter(k => k.firmaId).length;
  const duzenlenen = modal?.kart;
  // Kartı olmayan üyeler: firma seçiliyse o firmanınkiler, değilse firmasızlar (düzenlenen kartın üyesi her zaman listede)
  const secilebilirUyeler = uyeler.filter(u =>
    u.id === duzenlenen?.memberId || (!u.kartVar && (form.firmaId ? u.firmaId === form.firmaId : !u.firmaId)));
  const gelecekMi = (k: Kart) => !!k.aktif && !!k.aktivasyonAt && new Date(k.aktivasyonAt) > new Date();

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="credit_card" label="Satılan Kart" value={kartlar.length} color="#d4af37" />
        <Stat icon="verified" label="Aktif" value={aktifSayi} color="#42faba" />
        <Stat icon="hourglass_top" label="Aktivasyon Bekliyor" value={kartlar.length - aktifSayi} color="#f0d289" />
        <Stat icon="handshake" label="Firma Referanslı" value={referansli} color="#6001d1" />
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
          <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Seri no, üye, firma, sipariş ara..."
            className="w-full bg-surface-dim border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:border-primary outline-none" />
        </div>
        <select value={durumFiltre} onChange={e => setDurumFiltre(e.target.value as typeof durumFiltre)} className={`${inputCls} md:w-40`}>
          <option value="">Tüm durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="bekliyor">Bekliyor</option>
        </select>
        <select value={firmaFiltre} onChange={e => setFirmaFiltre(e.target.value)} className={`${inputCls} md:w-48`}>
          <option value="">Tüm firmalar</option>
          {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
        </select>
        <button onClick={yeniAc} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all whitespace-nowrap">
          <span className="material-symbols-outlined text-base">add</span>Kart Ekle
        </button>
      </div>

      {secili.size > 0 && (
        <div className="sticky top-2 z-30 glass-card rounded-2xl px-4 py-3 flex flex-wrap items-center gap-2 border border-primary/30">
          <span className="text-sm text-on-surface font-medium mr-auto">{secili.size.toLocaleString("tr-TR")} kart seçildi</span>
          <button onClick={() => setSecili(new Set())} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-on-surface-variant hover:bg-white/5">Seçimi Kaldır</button>
          <button onClick={() => { setTopluForm(BOS_TOPLU); setHata(""); setTopluDuzenle(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-primary/15 border border-primary/25 text-primary">
            <span className="material-symbols-outlined text-sm">edit</span>Toplu Düzenle
          </button>
          <button onClick={() => { setHata(""); setTopluSil(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400">
            <span className="material-symbols-outlined text-sm">delete</span>Toplu Sil
          </button>
        </div>
      )}

      {loading ? <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Yükleniyor...</div>
        : liste.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant text-sm">
            {kartlar.length === 0 ? "Henüz kart yok. Satış yapıldıkça “Kart Ekle” ile kart açın." : "Sonuç bulunamadı."}
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex lg:grid lg:grid-cols-[24px_110px_1.3fr_1fr_110px_1.6fr_80px_104px] items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
              <input type="checkbox" checked={tumuSecili} onChange={tumunuSec} title="Listedeki tümünü seç" className="w-4 h-4 accent-[#d4af37] cursor-pointer" />
              <span className="lg:hidden normal-case tracking-normal text-xs">Tümünü seç</span>
              <span className="hidden lg:block">Seri No</span><span className="hidden lg:block">Üye</span><span className="hidden lg:block">Firma</span><span className="hidden lg:block">Sipariş</span><span className="hidden lg:block">Kart Adresi</span><span className="hidden lg:block">Durum</span><span className="hidden lg:block" />
            </div>
            {liste.map(k => (
              <div key={k.id} className={`grid grid-cols-[24px_1fr] lg:grid-cols-[24px_110px_1.3fr_1fr_110px_1.6fr_80px_104px] gap-x-3 gap-y-1.5 lg:items-center px-4 py-3 border-b border-white/5 last:border-0 ${secili.has(k.id) ? "bg-primary/5" : ""}`}>
                <input type="checkbox" checked={secili.has(k.id)} onChange={() => secimDegistir(k.id)} className="w-4 h-4 mt-0.5 lg:mt-0 accent-[#d4af37] cursor-pointer row-span-7 lg:row-span-1" />
                <div>
                  <p className="text-xs font-mono text-on-surface">{k.seriNo}</p>
                  <p className="text-[10px] text-on-surface-variant">{trDate(k.createdAt)}</p>
                </div>
                <div className="min-w-0">
                  {k.member ? (
                    <>
                      <p className="text-sm text-on-surface truncate">{`${k.member.ad} ${k.member.soyad}`.trim()}</p>
                      <p className="text-xs text-on-surface-variant truncate" title={k.member.email}>{k.member.telefon || <span className="opacity-50">Telefon yok</span>}</p>
                    </>
                  ) : <p className="text-xs text-on-surface-variant/50">Üye bağlanmadı</p>}
                  {k.notlar && <p className="text-[11px] text-on-surface-variant/70 truncate" title={k.notlar}>{k.notlar}</p>}
                </div>
                <p className={`text-sm truncate ${k.firmaId ? "text-primary" : "text-on-surface-variant/50"}`}>{firmaAd(k.firmaId)}</p>
                <p className="text-xs font-mono text-on-surface-variant">{siparisNo(k.orderId)}</p>
                <div className="flex flex-wrap gap-1.5 min-w-0">
                  <UrlButon etiket="NFC" url={kartNfcUrl(k.token)} kopyalandi={kopyalanan === `n${k.id}`} onClick={() => kopyala(`n${k.id}`, kartNfcUrl(k.token))} />
                  <UrlButon etiket="QR" url={kartQrUrl(k.token)} kopyalandi={kopyalanan === `q${k.id}`} onClick={() => kopyala(`q${k.id}`, kartQrUrl(k.token))} />
                  <button type="button" onClick={() => setQrKart(k)} title="QR kodu göster"
                    className="inline-flex items-center px-2 py-1 rounded-lg border border-white/10 text-on-surface-variant hover:text-primary">
                    <span className="material-symbols-outlined text-sm">qr_code_2</span>
                  </button>
                </div>
                {gelecekMi(k)
                  ? <span className="text-xs text-amber-300" title="Başlangıç tarihi">{trDate(k.aktivasyonAt!)}&apos;de başlar</span>
                  : k.aktif
                  ? <span className="text-xs text-tertiary" title={k.aktivasyonAt ? `Aktivasyon: ${trDate(k.aktivasyonAt)}` : ""}>Aktif</span>
                  : <span className="text-xs text-on-surface-variant/50">Bekliyor</span>}
                <div className="flex gap-1 lg:justify-end">
                  <button onClick={() => setBaskiKart(k)} className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-primary" title="Baskı görseli">
                    <span className="material-symbols-outlined text-base">print</span>
                  </button>
                  <button onClick={() => duzenleAc(k)} className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-on-surface" title="Düzenle">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button onClick={() => setSilinecek(k)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400" title="Sil">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <span className="text-xs text-on-surface-variant">{liste.length.toLocaleString("tr-TR")} kart</span>
              <button onClick={tsvIndir} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                <span className="material-symbols-outlined text-sm">download</span>TSV İndir
              </button>
            </div>
          </div>
        )}

      {/* Kart ekle / düzenle */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <div>
                <h3 className="font-semibold text-on-surface">{duzenlenen ? "Kartı Düzenle" : "Kart Ekle"}</h3>
                <p className="text-xs text-on-surface-variant font-mono">{duzenlenen ? duzenlenen.seriNo : "Seri no ve kart adresi otomatik üretilir"}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {olusan ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-tertiary text-sm font-medium">
                  <span className="material-symbols-outlined">check_circle</span>
                  {olusan.length > 1 ? `${olusan.length} kart oluşturuldu` : "Kart oluşturuldu"}
                </div>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {olusan.map(k => (
                    <div key={k.id} className="p-3 rounded-xl bg-white/3 border border-white/8 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-mono text-on-surface">{k.seriNo}</span>
                        {k.member && <span className="text-xs text-on-surface-variant truncate">{`${k.member.ad} ${k.member.soyad}`.trim()}</span>}
                      </div>
                      {k.member && k.aktivasyonAt && (
                        <p className="text-xs text-on-surface-variant">Başlangıç: <span className="text-on-surface">{trDate(k.aktivasyonAt)}</span></p>
                      )}
                      {([["NFC", kartNfcUrl(k.token), "n"], ["QR", kartQrUrl(k.token), "q"]] as const).map(([etiket, url, on]) => (
                        <div key={on} className="flex items-center gap-2">
                          <span className="text-[10px] w-7 text-on-surface-variant">{etiket}</span>
                          <code className="flex-1 min-w-0 truncate text-xs text-primary">{url}</code>
                          <UrlButon etiket="Kopyala" url={url} kopyalandi={kopyalanan === `${on}${k.id}`} onClick={() => kopyala(`${on}${k.id}`, url)} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={yeniAc} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5">Yeni Kart</button>
                  <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black">Tamam</button>
                </div>
              </div>
            ) : (
            <form onSubmit={kaydet}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Firma</label>
                  <select value={form.firmaId} onChange={e => setForm(p => ({ ...p, firmaId: e.target.value, memberId: duzenlenen ? p.memberId : "" }))} className={inputCls}>
                    <option value="">— Firmasız —</option>
                    {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Üye</label>
                  <select value={form.memberId} onChange={e => setForm(p => ({ ...p, memberId: e.target.value }))} className={inputCls}>
                    <option value="">{duzenlenen ? "— Bağlı değil (üye kartı okutunca kendisi bağlar) —" : "— Üye seçmeden boş kart oluştur —"}</option>
                    {secilebilirUyeler.map(u => <option key={u.id} value={u.id}>{u.ad} · {u.telefon || u.email}</option>)}
                  </select>
                  <p className="text-[11px] text-on-surface-variant/70 mt-1">
                    {form.firmaId ? "Bu firmanın kartı olmayan üyeleri listelenir." : "Firmasız ve kartı olmayan üyeler listelenir."}
                    {!duzenlenen && secilebilirUyeler.length === 0 && " Uygun üye yok — Üyeler menüsünden ekleyebilirsiniz."}
                  </p>
                </div>
                {form.memberId && (
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Kart Başlangıç Tarihi</label>
                    <input type="date" required value={form.baslangic} onChange={e => setForm(p => ({ ...p, baslangic: e.target.value }))}
                      className={`${inputCls} [color-scheme:dark]`} />
                    <p className="text-[11px] text-on-surface-variant/70 mt-1">Kart bu tarihten itibaren okutulunca üyenin kartvizitini açar; öncesinde bekleme mesajı gösterir.</p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Sipariş</label>
                  <select value={form.orderId} onChange={e => siparisSec(e.target.value)} className={inputCls}>
                    <option value="">— Siparişsiz (ücretsiz kart) —</option>
                    {siparisler.map(s => (
                      <option key={s.id} value={s.id}>{s.siparisNo} · {s.musteriAd || s.firma} · {s.adet} adet</option>
                    ))}
                  </select>
                </div>
                {!duzenlenen && !form.memberId && (
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Adet</label>
                    <input type="number" min={1} max={50} value={form.adet} onChange={e => setForm(p => ({ ...p, adet: e.target.value }))} className={inputCls} />
                  </div>
                )}
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Not</label>
                  <input value={form.notlar} onChange={e => setForm(p => ({ ...p, notlar: e.target.value }))} placeholder="Ör. ücretsiz tanıtım kartı" className={inputCls} />
                </div>
              </div>
              <div className="px-6 pb-5">
                {hata && <p className="text-xs text-red-400 flex items-center gap-1 mb-3"><span className="material-symbols-outlined text-sm">error</span>{hata}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5">İptal</button>
                  <button type="submit" disabled={kaydediliyor} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black disabled:opacity-60">
                    {kaydediliyor ? "Kaydediliyor..." : duzenlenen ? "Kaydet" : form.memberId ? "Kartı Oluştur ve Tanımla" : "Oluştur"}
                  </button>
                </div>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {baskiKart && (
        <KartBaskiModal
          seriNo={baskiKart.seriNo}
          qrUrl={kartQrUrl(baskiKart.token)}
          firmaId={baskiKart.firmaId}
          firmalar={firmalar}
          baslangic={{
            ad: baskiKart.member?.ad ?? "",
            soyad: baskiKart.member?.soyad ?? "",
            unvan: baskiKart.member?.unvan ?? "",
            gsm: baskiKart.member?.telefon ?? "",
          }}
          onClose={() => setBaskiKart(null)}
        />
      )}

      {/* QR kodu */}
      {qrKart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setQrKart(null)}>
          <div className="w-full max-w-xs rounded-2xl p-6 text-center space-y-4" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
            <p className="text-sm font-mono text-on-surface">{qrKart.seriNo}</p>
            <div id="kart-qr" className="bg-white rounded-xl p-4 inline-block">
              <QRCodeSVG value={kartQrUrl(qrKart.token)} size={200} marginSize={0} />
            </div>
            <p className="text-[11px] font-mono text-on-surface-variant break-all">{kartQrUrl(qrKart.token)}</p>
            <div className="flex gap-2">
              <button onClick={() => setQrKart(null)} className="flex-1 py-2 rounded-xl text-sm border border-white/10 text-on-surface-variant">Kapat</button>
              <button onClick={() => {
                const svg = document.querySelector("#kart-qr svg");
                if (!svg) return;
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
                a.download = `${qrKart.seriNo}-qr.svg`;
                a.click();
              }} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-primary text-black">SVG İndir</button>
            </div>
          </div>
        </div>
      )}

      {/* Toplu düzenle */}
      {topluDuzenle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <div>
                <h3 className="font-semibold text-on-surface">Toplu Düzenle</h3>
                <p className="text-xs text-on-surface-variant">{secili.size.toLocaleString("tr-TR")} kart · yalnız değiştirdiğiniz alanlar güncellenir</p>
              </div>
              <button onClick={() => setTopluDuzenle(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={topluKaydet}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Referans Firma</label>
                  <select value={topluForm.firmaId} onChange={e => setTopluForm(p => ({ ...p, firmaId: e.target.value }))} className={inputCls}>
                    <option value={DEGISTIRME}>— Değiştirme —</option>
                    <option value="">Firmayı kaldır</option>
                    {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
                  </select>
                  {seciliKartlar.some(k => k.memberId) && topluForm.firmaId && topluForm.firmaId !== DEGISTIRME && (
                    <p className="text-[11px] text-on-surface-variant/70 mt-1">Üyeye bağlı kartlarda üyenin firması da güncellenir.</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Sipariş</label>
                  <select value={topluForm.orderId} onChange={e => setTopluForm(p => ({ ...p, orderId: e.target.value }))} className={inputCls}>
                    <option value={DEGISTIRME}>— Değiştirme —</option>
                    <option value="">Sipariş bağını kaldır</option>
                    {siparisler.map(s => (
                      <option key={s.id} value={s.id}>{s.siparisNo} · {s.musteriAd || s.firma} · {s.adet} adet</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs text-on-surface-variant mb-1 cursor-pointer">
                    <input type="checkbox" checked={topluForm.notDegistir} onChange={e => setTopluForm(p => ({ ...p, notDegistir: e.target.checked }))} className="accent-[#d4af37]" />
                    Notu değiştir
                  </label>
                  <input value={topluForm.notlar} disabled={!topluForm.notDegistir} onChange={e => setTopluForm(p => ({ ...p, notlar: e.target.value }))}
                    placeholder="Boş bırakılırsa notlar silinir" className={`${inputCls} disabled:opacity-40`} />
                </div>
              </div>
              <div className="px-6 pb-5">
                {hata && <p className="text-xs text-red-400 flex items-center gap-1 mb-3"><span className="material-symbols-outlined text-sm">error</span>{hata}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setTopluDuzenle(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5">İptal</button>
                  <button type="submit" disabled={kaydediliyor} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black disabled:opacity-60">
                    {kaydediliyor ? "Kaydediliyor..." : `${secili.size} Kartı Güncelle`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toplu sil onayı */}
      {topluSil && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-400 text-2xl">delete_forever</span>
            </div>
            <h3 className="font-semibold text-on-surface text-center mb-1">{secili.size} Kartı Sil</h3>
            <p className="text-xs text-on-surface-variant text-center mb-5">
              {seciliKartlar.filter(k => k.aktif).length > 0 && (
                <span className="block text-red-400 mb-1">{seciliKartlar.filter(k => k.aktif).length} kart aktif ve üyeye bağlı; bağlantıları kaldırılacak.</span>
              )}
              Bu kartlara yazılmış NFC/QR adresleri artık çalışmaz. Bu işlem geri alınamaz.
            </p>
            {hata && <p className="text-xs text-red-400 text-center mb-3">{hata}</p>}
            <div className="flex gap-3">
              <button onClick={() => setTopluSil(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5">İptal</button>
              <button disabled={kaydediliyor} onClick={async () => { if (await topluIstek({ islem: "sil" })) setTopluSil(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white disabled:opacity-60">
                {kaydediliyor ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sil onayı */}
      {silinecek && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-400 text-2xl">delete_forever</span>
            </div>
            <h3 className="font-semibold text-on-surface text-center mb-1">Kartı Sil</h3>
            <p className="text-sm text-on-surface font-mono text-center mb-1">{silinecek.seriNo}</p>
            <p className="text-xs text-on-surface-variant text-center mb-5">
              {silinecek.member ? "Kartın üye bağlantısı da kaldırılacak. " : ""}Bu karta yazılmış NFC/QR adresi artık çalışmaz. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSilinecek(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5">İptal</button>
              <button onClick={sil} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white">Evet, Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UrlButon({ etiket, url, kopyalandi, onClick }: { etiket: string; url: string; kopyalandi: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={`${url}\nKopyalamak için tıkla`}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-colors ${
        kopyalandi ? "bg-tertiary/20 border-tertiary/40 text-tertiary" : "bg-primary/10 border-primary/25 text-primary"}`}>
      <span className="material-symbols-outlined text-sm">{kopyalandi ? "check" : "content_copy"}</span>
      {kopyalandi ? "Kopyalandı" : etiket}
    </button>
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
