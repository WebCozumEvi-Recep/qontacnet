"use client";
import { useEffect, useState } from "react";

interface AlanAdi {
  id: string;
  alanAdi: string;
  tld: string;
  durum: string;
  satisTutar: number;
  maliyetKurus: number;
  siparisNo: string | null;
  cfZoneId: string;
  cfNameServers: string[];
  kayitTarihi: string | null;
  bitisTarihi: string | null;
  hataMesaji: string;
  createdAt: string;
  member: { id: string; ad: string; soyad: string; email: string };
}

const DURUM_RENK: Record<string, string> = {
  ODEME_BEKLIYOR: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  KAYIT_EDILIYOR: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  YAYILIYOR: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  AKTIF: "text-green-400 border-green-400/30 bg-green-400/10",
  HATA: "text-red-400 border-red-400/30 bg-red-400/10",
  SURESI_DOLDU: "text-red-400 border-red-400/30 bg-red-400/10",
  IPTAL: "text-on-surface-variant border-white/10 bg-white/5",
};

const DURUM_METIN: Record<string, string> = {
  ODEME_BEKLIYOR: "Ödeme bekliyor",
  KAYIT_EDILIYOR: "Kaydediliyor",
  YAYILIYOR: "Yayılıyor",
  AKTIF: "Aktif",
  HATA: "Hata",
  SURESI_DOLDU: "Süresi doldu",
  IPTAL: "İptal",
};

export default function AdminAlanAdlariPage() {
  const [liste, setListe] = useState<AlanAdi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [ara, setAra] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function yukle() {
    return fetch("/api/admin/alan-adlari")
      .then(r => r.json())
      .then(j => { if (j.ok) setListe(j.alanAdlari); })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }

  useEffect(() => {
    fetch("/api/admin/alan-adlari")
      .then(r => r.json())
      .then(j => { if (j.ok) setListe(j.alanAdlari); })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  async function islem(id: string, islemAdi: "yeniden-dene" | "iptal") {
    if (islemAdi === "iptal" && !confirm("Bu alan adı kaydı iptal edilecek. Registrar tarafındaki kayıt SİLİNMEZ. Devam edilsin mi?")) return;
    const j = await fetch("/api/admin/alan-adlari", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, islem: islemAdi }),
    }).then(r => r.json()).catch(() => null);
    setMsg(j?.ok ? { ok: true, text: j.mesaj } : { ok: false, text: j?.error || "İşlem başarısız." });
    await yukle();
  }

  const filtreli = liste.filter(a => {
    const q = ara.trim().toLowerCase();
    if (!q) return true;
    return a.alanAdi.includes(q) || a.member.email.toLowerCase().includes(q) ||
      `${a.member.ad} ${a.member.soyad}`.toLowerCase().includes(q);
  });

  const aktifSayi = liste.filter(a => a.durum === "AKTIF").length;
  const hataSayi = liste.filter(a => a.durum === "HATA").length;
  const ciro = liste.filter(a => a.durum !== "ODEME_BEKLIYOR" && a.durum !== "IPTAL").reduce((t, a) => t + a.satisTutar, 0);

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-3">
        <Kutu ikon="language" baslik="Toplam" deger={String(liste.length)} />
        <Kutu ikon="check_circle" baslik="Aktif" deger={String(aktifSayi)} />
        <Kutu ikon="error" baslik="Hatalı" deger={String(hataSayi)} vurgu={hataSayi > 0} />
        <Kutu ikon="payments" baslik="Toplam satış" deger={`${ciro.toLocaleString("tr-TR")} TL`} />
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input value={ara} onChange={e => setAra(e.target.value)} placeholder="Alan adı, üye adı veya e-posta ara..."
            className="flex-1 min-w-[200px] bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all" />
          <button type="button" onClick={yukle}
            className="px-4 py-2.5 bg-surface-dim border border-white/10 rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">refresh</span>Yenile
          </button>
        </div>

        {msg && (
          <p className={`text-xs flex items-center gap-1 mb-3 ${msg.ok ? "text-green-400" : "text-red-400"}`}>
            <span className="material-symbols-outlined text-sm">{msg.ok ? "check_circle" : "error"}</span>{msg.text}
          </p>
        )}

        {filtreli.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">Kayıt bulunamadı.</p>
        ) : (
          <div className="space-y-2">
            {filtreli.map(a => (
              <div key={a.id} className="bg-surface-dim border border-white/10 rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <a href={`https://${a.alanAdi}`} target="_blank" rel="noreferrer"
                    className="text-sm font-mono font-semibold text-on-surface hover:text-primary transition-colors">
                    {a.alanAdi}
                  </a>
                  <span className={`px-2.5 py-1 rounded-full border text-[11px] ${DURUM_RENK[a.durum] ?? DURUM_RENK.IPTAL}`}>
                    {DURUM_METIN[a.durum] ?? a.durum}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {a.member.ad} {a.member.soyad} · {a.member.email}
                  </span>
                  <span className="ml-auto text-xs text-on-surface-variant">
                    {a.satisTutar.toLocaleString("tr-TR")} TL
                    <span className="opacity-60"> (maliyet {(a.maliyetKurus / 100).toLocaleString("tr-TR")} TL)</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
                  {a.siparisNo && <span>Sipariş: {a.siparisNo}</span>}
                  {a.kayitTarihi && <span>Kayıt: {new Date(a.kayitTarihi).toLocaleDateString("tr-TR")}</span>}
                  {a.bitisTarihi && <span>Bitiş: {new Date(a.bitisTarihi).toLocaleDateString("tr-TR")}</span>}
                  {a.cfNameServers.length > 0 && <span>NS: {a.cfNameServers.join(", ")}</span>}
                </div>

                {a.hataMesaji && (
                  <p className="text-[11px] text-red-400 mt-2 break-all">{a.hataMesaji}</p>
                )}

                {(a.durum === "HATA" || a.durum === "KAYIT_EDILIYOR" || a.durum === "YAYILIYOR") && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" onClick={() => islem(a.id, "yeniden-dene")}
                      className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-lg text-xs hover:bg-primary/20 transition-all inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">sync</span>Kurulumu Yeniden Dene
                    </button>
                    <button type="button" onClick={() => islem(a.id, "iptal")}
                      className="px-3 py-1.5 border border-white/10 text-on-surface-variant rounded-lg text-xs hover:text-red-400 transition-all">
                      İptal Et
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kutu({ ikon, baslik, deger, vurgu }: { ikon: string; baslik: string; deger: string; vurgu?: boolean }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={`material-symbols-outlined text-lg ${vurgu ? "text-red-400" : "text-primary"}`}>{ikon}</span>
        <p className="text-xs text-on-surface-variant">{baslik}</p>
      </div>
      <p className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{deger}</p>
    </div>
  );
}
