"use client";
import { useEffect, useMemo, useState } from "react";
import { trDate } from "@/lib/labels";
import { QRCodeSVG } from "qrcode.react";
import { kartNfcUrl, kartQrUrl } from "@/lib/kart-url";

interface Kart {
  id: string; seriNo: string; token: string; aktif: boolean; aktivasyonAt: string | null;
  firmaId: string | null; orderId: string | null; memberId: string | null; notlar: string; createdAt: string;
  member: { id: string; ad: string; soyad: string; email: string } | null;
}
interface Secenek { id: string; ad: string }
interface Uye { id: string; ad: string; email: string; kartVar: boolean }
interface Siparis { id: string; siparisNo: string; firma: string; firmaId: string | null; musteriAd: string; urun: string; adet: number }

interface KartForm { firmaId: string; orderId: string; memberId: string; notlar: string; adet: string }
const BOS_FORM: KartForm = { firmaId: "", orderId: "", memberId: "", notlar: "", adet: "1" };

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
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");

  const [silinecek, setSilinecek] = useState<Kart | null>(null);
  const [qrKart, setQrKart] = useState<Kart | null>(null);

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
      const uye = k.member ? `${k.member.ad} ${k.member.soyad} ${k.member.email}` : "";
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
    setForm(BOS_FORM); setHata(""); setModal({ kart: null });
  }
  function duzenleAc(k: Kart) {
    setForm({ firmaId: k.firmaId ?? "", orderId: k.orderId ?? "", memberId: k.memberId ?? "", notlar: k.notlar, adet: "1" });
    setHata(""); setModal({ kart: k });
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
          body: JSON.stringify({ firmaId: form.firmaId, orderId: form.orderId, memberId: form.memberId, notlar: form.notlar }),
        });
        const j = await res.json();
        if (!j.ok) { setHata(j.error || "Kaydedilemedi."); return; }
      } else {
        const res = await fetch("/api/admin/kartlar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firmaId: form.firmaId, orderId: form.orderId, notlar: form.notlar, adet: Number(form.adet) || 1 }),
        });
        const j = await res.json();
        if (!j.ok) { setHata(j.error || "Oluşturulamadı."); return; }
      }
      await yukle(); // üye listesindeki "kartı var" bilgisi de tazelensin
      setModal(null);
    } finally { setKaydediliyor(false); }
  }

  async function sil() {
    if (!silinecek) return;
    const res = await fetch(`/api/admin/kartlar/${silinecek.id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) { setKartlar(p => p.filter(k => k.id !== silinecek.id)); setSilinecek(null); }
  }

  function tsvIndir() {
    const satirlar = liste.map(k => [
      k.seriNo, k.member ? `${k.member.ad} ${k.member.soyad}`.trim() : "", firmaAd(k.firmaId), siparisNo(k.orderId),
      kartNfcUrl(k.token), kartQrUrl(k.token), k.aktif ? "Aktif" : "Bekliyor", trDate(k.createdAt),
    ].join("\t"));
    const txt = "Seri No\tÜye\tFirma\tSipariş\tNFC URL\tQR URL\tDurum\tTarih\n" + satirlar.join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/tab-separated-values" }));
    a.download = "satilan-kartlar.tsv";
    a.click();
  }

  const aktifSayi = kartlar.filter(k => k.aktif).length;
  const referansli = kartlar.filter(k => k.firmaId).length;
  const duzenlenen = modal?.kart;
  const secilebilirUyeler = uyeler.filter(u => !u.kartVar || u.id === duzenlenen?.memberId);

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

      {loading ? <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Yükleniyor...</div>
        : liste.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant text-sm">
            {kartlar.length === 0 ? "Henüz kart yok. Satış yapıldıkça “Kart Ekle” ile kart açın." : "Sonuç bulunamadı."}
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="hidden lg:grid grid-cols-[110px_1.3fr_1fr_110px_1.6fr_80px_76px] gap-3 px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
              <span>Seri No</span><span>Üye</span><span>Firma</span><span>Sipariş</span><span>Kart Adresi</span><span>Durum</span><span />
            </div>
            {liste.map(k => (
              <div key={k.id} className="grid grid-cols-1 lg:grid-cols-[110px_1.3fr_1fr_110px_1.6fr_80px_76px] gap-1.5 lg:gap-3 lg:items-center px-4 py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-xs font-mono text-on-surface">{k.seriNo}</p>
                  <p className="text-[10px] text-on-surface-variant">{trDate(k.createdAt)}</p>
                </div>
                <div className="min-w-0">
                  {k.member ? (
                    <>
                      <p className="text-sm text-on-surface truncate">{`${k.member.ad} ${k.member.soyad}`.trim()}</p>
                      <p className="text-xs text-on-surface-variant truncate">{k.member.email}</p>
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
                {k.aktif
                  ? <span className="text-xs text-tertiary" title={k.aktivasyonAt ? trDate(k.aktivasyonAt) : ""}>Aktif</span>
                  : <span className="text-xs text-on-surface-variant/50">Bekliyor</span>}
                <div className="flex gap-1 lg:justify-end">
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
          <div className="w-full max-w-lg rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
              <div>
                <h3 className="font-semibold text-on-surface">{duzenlenen ? "Kartı Düzenle" : "Kart Ekle"}</h3>
                <p className="text-xs text-on-surface-variant font-mono">{duzenlenen ? duzenlenen.seriNo : "Seri no ve kart adresi otomatik üretilir"}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={kaydet}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Sipariş</label>
                  <select value={form.orderId} onChange={e => siparisSec(e.target.value)} className={inputCls}>
                    <option value="">— Siparişsiz —</option>
                    {siparisler.map(s => (
                      <option key={s.id} value={s.id}>{s.siparisNo} · {s.musteriAd || s.firma} · {s.adet} adet</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Referans Firma</label>
                  <select value={form.firmaId} onChange={e => setForm(p => ({ ...p, firmaId: e.target.value }))} className={inputCls}>
                    <option value="">— Firmasız —</option>
                    {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
                  </select>
                  <p className="text-[11px] text-on-surface-variant/70 mt-1">Kart aktive edildiğinde üye bu firmaya bağlanır.</p>
                </div>
                {duzenlenen ? (
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Üye</label>
                    <select value={form.memberId} onChange={e => setForm(p => ({ ...p, memberId: e.target.value }))} className={inputCls}>
                      <option value="">— Bağlı değil (üye kartı okutunca kendisi bağlar) —</option>
                      {secilebilirUyeler.map(u => <option key={u.id} value={u.id}>{u.ad} · {u.email}</option>)}
                    </select>
                    <p className="text-[11px] text-on-surface-variant/70 mt-1">Üye seçilirse kart hemen aktive edilir.</p>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Adet</label>
                    <input type="number" min={1} max={50} value={form.adet} onChange={e => setForm(p => ({ ...p, adet: e.target.value }))} className={inputCls} />
                  </div>
                )}
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Not</label>
                  <input value={form.notlar} onChange={e => setForm(p => ({ ...p, notlar: e.target.value }))} placeholder="Ör. metal kart, siyah" className={inputCls} />
                </div>
              </div>
              <div className="px-6 pb-5">
                {hata && <p className="text-xs text-red-400 flex items-center gap-1 mb-3"><span className="material-symbols-outlined text-sm">error</span>{hata}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface-variant hover:bg-white/5">İptal</button>
                  <button type="submit" disabled={kaydediliyor} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black disabled:opacity-60">
                    {kaydediliyor ? "Kaydediliyor..." : duzenlenen ? "Kaydet" : "Oluştur"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
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
