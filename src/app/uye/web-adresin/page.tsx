"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { etiketHatasi, etiketNormalize } from "@/lib/domain-kurallar";
import { fiyatMetni } from "@/lib/domain-fiyat";
import { PazarlamaAraclari } from "./PazarlamaAraclari";
import { SatinAlmaFormu } from "./SatinAlmaFormu";
import { KartFormu, BOS_KART, type KartAlanlari } from "@/components/odeme/KartFormu";
import { odemeyeGit, type OdemeYaniti } from "@/components/odeme/odeme-yonlendir";

export interface AlanAdiKaydi {
  id: string;
  alanAdi: string;
  tld: string;
  durum: "ODEME_BEKLIYOR" | "KAYIT_EDILIYOR" | "YAYILIYOR" | "AKTIF" | "HATA" | "SURESI_DOLDU";
  yil: number;
  satisTutar: number;
  kayitTarihi: string | null;
  bitisTarihi: string | null;
  otoYenile: boolean;
  hataMesaji: string;
  cfNameServers: string[];
  tanitimAdimlari: Record<string, boolean>;
}

interface SorguSonucu {
  alanAdi: string;
  tld: string;
  musait: boolean;
  premium: boolean;
  fiyat: number;
  satinAlinabilir: boolean;
  not: string;
}

interface Ozet {
  satisAcik: boolean;
  kartAktif: boolean;
  profil: { ad: string; soyad: string; unvan: string; email: string; telefon: string };
  domainZiyaret: number;
  alanAdlari: AlanAdiKaydi[];
  /** Kalan gün sunucuda hesaplanır (render sırasında Date.now() çağırmamak için). */
  kalanGun: { id: string; gun: number | null }[];
}

const DURUM_ROZET: Record<AlanAdiKaydi["durum"], { metin: string; renk: string; ikon: string }> = {
  ODEME_BEKLIYOR: { metin: "Ödeme bekleniyor", renk: "text-amber-400 border-amber-400/30 bg-amber-400/10", ikon: "pending" },
  KAYIT_EDILIYOR: { metin: "Kaydediliyor", renk: "text-sky-400 border-sky-400/30 bg-sky-400/10", ikon: "progress_activity" },
  YAYILIYOR: { metin: "Yayına alınıyor", renk: "text-sky-400 border-sky-400/30 bg-sky-400/10", ikon: "cloud_sync" },
  AKTIF: { metin: "Yayında", renk: "text-green-400 border-green-400/30 bg-green-400/10", ikon: "check_circle" },
  HATA: { metin: "Kurulum hatası", renk: "text-red-400 border-red-400/30 bg-red-400/10", ikon: "error" },
  SURESI_DOLDU: { metin: "Süresi doldu", renk: "text-red-400 border-red-400/30 bg-red-400/10", ikon: "event_busy" },
};

export default function WebAdresinPage() {
  const params = useSearchParams();
  const [ozet, setOzet] = useState<Ozet | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yukle = useCallback(() => {
    return fetch("/api/me/alan-adi")
      .then(r => r.json())
      .then(j => { if (j?.ok) setOzet(j); })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    // İlk yükleme — setState fetch tamamlandığında, yani efekt gövdesinden sonra çalışır.
    fetch("/api/me/alan-adi")
      .then(r => r.json())
      .then(j => { if (j?.ok) setOzet(j); })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  // Ödeme dönüşünde kurulum arka planda sürüyor olabilir — bir süre tazele.
  const odemeSonuc = params.get("odeme");
  useEffect(() => {
    if (odemeSonuc !== "basarili") return;
    const t = setInterval(yukle, 5000);
    const dur = setTimeout(() => clearInterval(t), 60_000);
    return () => { clearInterval(t); clearTimeout(dur); };
  }, [odemeSonuc, yukle]);

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
      </div>
    );
  }

  const aktifKayit = ozet?.alanAdlari.find(a => a.durum !== "SURESI_DOLDU") ?? null;

  return (
    <div className="max-w-4xl space-y-6">
      {odemeSonuc === "basarili" && (
        <div className="glass-card rounded-2xl p-4 border border-green-400/30 bg-green-400/5 flex items-start gap-3">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <div>
            <p className="text-sm font-semibold text-on-surface">Ödemeniz alındı.</p>
            <p className="text-xs text-on-surface-variant">Web adresiniz kaydediliyor — bu sayfa otomatik güncellenecek.</p>
          </div>
        </div>
      )}
      {odemeSonuc === "basarisiz" && (
        <div className="glass-card rounded-2xl p-4 border border-red-400/30 bg-red-400/5 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-400">error</span>
          <div>
            <p className="text-sm font-semibold text-on-surface">Ödeme tamamlanamadı.</p>
            <p className="text-xs text-on-surface-variant">Adresiniz hâlâ müsaitse tekrar deneyebilirsiniz.</p>
          </div>
        </div>
      )}

      {aktifKayit
        ? <SahipGorunumu kayit={aktifKayit} ozet={ozet!} onDegisti={yukle} />
        : <SatinAlmaGorunumu ozet={ozet} onSatinAlindi={yukle} />}
    </div>
  );
}

// ————————————————————————————————————————— Durum A: henüz adresi yok

function SatinAlmaGorunumu({ ozet, onSatinAlindi }: { ozet: Ozet | null; onSatinAlindi: () => void }) {
  const [girdi, setGirdi] = useState("");
  const [sorgulaniyor, setSorgulaniyor] = useState(false);
  const [sonuclar, setSonuclar] = useState<SorguSonucu[] | null>(null);
  const [hata, setHata] = useState("");
  const [secili, setSecili] = useState<SorguSonucu | null>(null);

  const kartAktif = ozet?.kartAktif ?? false;
  const satisAcik = ozet?.satisAcik ?? false;

  async function sorgula(e?: React.FormEvent) {
    e?.preventDefault();
    setHata(""); setSonuclar(null); setSecili(null);

    const onHata = etiketHatasi(etiketNormalize(girdi));
    if (onHata) { setHata(onHata); return; }

    setSorgulaniyor(true);
    const j = await fetch("/api/me/alan-adi/sorgula", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ad: girdi }),
    }).then(r => r.json()).catch(() => null);
    setSorgulaniyor(false);

    if (!j?.ok) { setHata(j?.error || "Sorgulama yapılamadı."); return; }
    setSonuclar(j.sonuclar as SorguSonucu[]);
  }

  return (
    <>
      {/* Tanıtım */}
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary">language</span>
          <h2 className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
            Kendi web adresini al
          </h2>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
          Tanıtım sayfanız şu an QONTAC adresinde yayında. Kendi adınıza bir web adresi alarak
          <strong className="text-on-surface"> işinizi kendi markanızla </strong>
          tanıtabilir, reklam verebilir, kartvizitinize ve e-posta imzanıza yazabilirsiniz.
          Adresiniz doğrudan tanıtım sayfanızı açar — ayrıca site yapmanıza gerek yok.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { ikon: "verified", baslik: "Kendi markanız", metin: "abcd.com sizin adınıza kaydedilir." },
            { ikon: "bolt", baslik: "Anında yayında", metin: "Kurulumu biz yapıyoruz, teknik bilgi gerekmez." },
            { ikon: "campaign", baslik: "Tanıtım araçları", metin: "QR, e-posta imzası ve hazır metinler dahil." },
          ].map(k => (
            <div key={k.ikon} className="bg-surface-dim border border-white/10 rounded-xl p-4">
              <span className="material-symbols-outlined text-primary text-xl">{k.ikon}</span>
              <p className="text-sm font-medium text-on-surface mt-1">{k.baslik}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{k.metin}</p>
            </div>
          ))}
        </div>
      </div>

      {!kartAktif && (
        <div className="glass-card rounded-2xl p-4 border border-amber-400/30 bg-amber-400/5 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-400">warning</span>
          <div>
            <p className="text-sm font-semibold text-on-surface">Önce kartınızı aktive edin.</p>
            <p className="text-xs text-on-surface-variant">Web adresi satın alabilmek için fiziksel kartınızın aktif olması gerekiyor.</p>
          </div>
        </div>
      )}

      {!satisAcik && (
        <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-start gap-3">
          <span className="material-symbols-outlined text-on-surface-variant">info</span>
          <p className="text-xs text-on-surface-variant">
            Web adresi satışı şu anda kapalı. Kısa süre içinde açılacak — bizi takipte kalın.
          </p>
        </div>
      )}

      {/* Sorgu kutusu */}
      <form onSubmit={sorgula} className="glass-card rounded-2xl p-5 sm:p-6">
        <label className="block text-sm font-semibold text-on-surface mb-3" style={{ fontFamily: "Sora, sans-serif" }}>
          Almak istediğiniz adresi yazın
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-stretch bg-surface-dim border border-white/10 rounded-xl overflow-hidden focus-within:border-primary transition-all">
            <span className="px-3 flex items-center text-sm text-on-surface-variant border-r border-white/10 select-none">www.</span>
            <input
              value={girdi}
              onChange={e => setGirdi(e.target.value)}
              disabled={!satisAcik}
              placeholder="firmaadi"
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              className="flex-1 min-w-0 bg-transparent px-3 py-3 text-sm outline-none disabled:opacity-50"
            />
          </div>
          <button type="submit" disabled={sorgulaniyor || !satisAcik}
            className="px-6 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2">
            <span className={`material-symbols-outlined text-base ${sorgulaniyor ? "animate-spin" : ""}`}>
              {sorgulaniyor ? "progress_activity" : "search"}
            </span>
            Sorgula
          </button>
        </div>
        <p className="text-[11px] text-on-surface-variant mt-2">
          En az 3 karakter; harf, rakam ve tire kullanabilirsiniz. Türkçe karakter kullanmayın.
        </p>
        {hata && (
          <p className="text-xs text-red-400 flex items-center gap-1 mt-2">
            <span className="material-symbols-outlined text-sm">error</span>{hata}
          </p>
        )}
      </form>

      {/* Sonuçlar */}
      {sonuclar && (
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <p className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>
            Sorgu sonuçları
          </p>
          <div className="space-y-2">
            {sonuclar.map(s => (
              <div key={s.alanAdi}
                className={`flex flex-wrap items-center gap-3 p-3 rounded-xl border transition-all ${
                  s.satinAlinabilir ? "border-white/10 bg-surface-dim hover:border-primary/40" : "border-white/5 bg-surface-dim/40"
                }`}>
                <span className={`material-symbols-outlined text-lg ${s.musait ? "text-green-400" : "text-on-surface-variant"}`}>
                  {s.musait ? "check_circle" : "cancel"}
                </span>
                <span className={`flex-1 min-w-[140px] text-sm font-mono ${s.musait ? "text-on-surface" : "text-on-surface-variant line-through"}`}>
                  www.{s.alanAdi}
                </span>
                {s.satinAlinabilir ? (
                  <>
                    <span className="text-sm font-semibold text-on-surface">{fiyatMetni(s.fiyat)}<span className="text-xs text-on-surface-variant font-normal"> / yıl</span></span>
                    <button type="button" onClick={() => setSecili(s)} disabled={!kartAktif}
                      className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-all disabled:opacity-40">
                      Satın Al
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-on-surface-variant">{s.not}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-4">
            Fiyatlar 1 yıllık kayıt bedelidir ve KDV dahildir. Adresiniz her yıl yenilenir; süre bitmeden önce hatırlatırız.
          </p>
        </div>
      )}

      {secili && (
        <SatinAlmaFormu
          sonuc={secili}
          profil={ozet?.profil}
          onKapat={() => setSecili(null)}
          onTamamlandi={onSatinAlindi}
        />
      )}
    </>
  );
}

// ————————————————————————————————————————— Durum B: adresi var

function SahipGorunumu({ kayit, ozet, onDegisti }: {
  kayit: AlanAdiKaydi; ozet: Ozet; onDegisti: () => void;
}) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const rozet = DURUM_ROZET[kayit.durum];
  const yayinda = kayit.durum === "AKTIF";

  const kalanGun = ozet.kalanGun.find(k => k.id === kayit.id)?.gun ?? null;

  function kopyala() {
    navigator.clipboard.writeText(`https://${kayit.alanAdi}`);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  }

  return (
    <>
      {/* Kocaman adres */}
      <div className="glass-card rounded-2xl p-6 sm:p-10 text-center">
        <p className="text-xs text-on-surface-variant mb-3 uppercase tracking-wider">Web adresiniz</p>
        <a href={`https://${kayit.alanAdi}`} target="_blank" rel="noreferrer"
          className="block text-2xl sm:text-4xl lg:text-5xl font-bold text-primary break-all hover:opacity-80 transition-opacity"
          style={{ fontFamily: "Sora, sans-serif" }}>
          www.{kayit.alanAdi}
        </a>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs ${rozet.renk}`}>
            <span className={`material-symbols-outlined text-sm ${kayit.durum === "KAYIT_EDILIYOR" ? "animate-spin" : ""}`}>{rozet.ikon}</span>
            {rozet.metin}
          </span>
          <button onClick={kopyala}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/10 bg-surface-dim text-xs text-on-surface-variant hover:text-primary transition-all">
            <span className="material-symbols-outlined text-sm">{kopyalandi ? "check" : "content_copy"}</span>
            {kopyalandi ? "Kopyalandı" : "Adresi kopyala"}
          </button>
        </div>

        {kayit.durum === "YAYILIYOR" && (
          <p className="text-xs text-on-surface-variant mt-4 max-w-md mx-auto">
            Adresiniz kaydedildi ve tanıtım sayfanıza bağlandı. Dünya genelinde yayılması
            genellikle 1-4 saat sürer; bu süre içinde açılmazsa endişelenmeyin.
          </p>
        )}
        {kayit.durum === "HATA" && (
          <p className="text-xs text-red-400 mt-4 max-w-md mx-auto">
            Kurulum tamamlanamadı, ekibimiz bilgilendirildi. Ödemeniz güvende — en kısa sürede sizinle iletişime geçeceğiz.
          </p>
        )}
      </div>

      {/* Özet kutuları */}
      <div className="grid sm:grid-cols-3 gap-3">
        <BilgiKutusu ikon="event" baslik="Bitiş tarihi"
          deger={kayit.bitisTarihi ? new Date(kayit.bitisTarihi).toLocaleDateString("tr-TR") : "—"}
          alt={kalanGun !== null && kalanGun > 0 ? `${kalanGun} gün kaldı` : ""} />
        <BilgiKutusu ikon="visibility" baslik="Bu adresten ziyaret"
          deger={String(ozet.domainZiyaret)} alt="tanıtım sayfası görüntülenmesi" />
        <BilgiKutusu ikon="autorenew" baslik="Yenileme"
          deger={kayit.otoYenile ? "Hatırlatmalı" : "Kapalı"} alt="süre bitmeden e-posta göndeririz" />
      </div>

      {/* Yenileme — süre yaklaştıysa veya dolduysa göster */}
      {(kayit.durum === "SURESI_DOLDU" || (kalanGun !== null && kalanGun <= 90)) && (
        <YenilemeKutusu kayit={kayit} kalanGun={kalanGun} />
      )}

      {yayinda && (
        <PazarlamaAraclari kayit={kayit} profil={ozet.profil} onDegisti={onDegisti} />
      )}
    </>
  );
}

function YenilemeKutusu({ kayit, kalanGun }: { kayit: AlanAdiKaydi; kalanGun: number | null }) {
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [kart, setKart] = useState<KartAlanlari>(BOS_KART);
  const [kartGerekli, setKartGerekli] = useState(false);
  const [kartAcik, setKartAcik] = useState(false);
  const doldu = kayit.durum === "SURESI_DOLDU";

  useEffect(() => {
    fetch("/api/odeme/durum")
      .then(r => r.json())
      .then(j => { if (j?.ok) setKartGerekli(Boolean(j.kartGerekli)); })
      .catch(() => {});
  }, []);

  async function yenile() {
    // Kart bilgisi gerekiyorsa önce formu aç, ikinci tıklamada gönder.
    if (kartGerekli && !kartAcik) { setKartAcik(true); return; }

    setHata(""); setGonderiliyor(true);
    const j = await fetch("/api/me/alan-adi/yenile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: kayit.id, ...(kartGerekli ? { kart } : {}) }),
    }).then(r => r.json()).catch(() => null);

    if (!j?.ok) {
      setGonderiliyor(false);
      setHata(j?.error || "Yenileme başlatılamadı.");
      return;
    }
    odemeyeGit(j.odeme as OdemeYaniti);
  }

  return (
    <div className={`glass-card rounded-2xl p-5 border ${doldu ? "border-red-400/30 bg-red-400/5" : "border-amber-400/30 bg-amber-400/5"}`}>
      <div className="flex items-start gap-3">
        <span className={`material-symbols-outlined ${doldu ? "text-red-400" : "text-amber-400"}`}>
          {doldu ? "event_busy" : "autorenew"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface">
            {doldu ? "Adresinizin süresi doldu." : `Adresinizin süresi ${kalanGun} gün sonra doluyor.`}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {doldu
              ? "Süresi dolan adresler kısa süre içinde başkaları tarafından alınabilir. Hemen yenileyin."
              : "Şimdi yenileyerek adresinizi bir yıl daha güvenceye alın."}
          </p>
          {kartAcik && (
            <div className="mt-3 max-w-md">
              <KartFormu kart={kart} onChange={setKart} />
            </div>
          )}
          {hata && (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-2">
              <span className="material-symbols-outlined text-sm">error</span>{hata}
            </p>
          )}
          <button type="button" onClick={yenile} disabled={gonderiliyor}
            className="mt-3 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60 inline-flex items-center gap-2">
            <span className={`material-symbols-outlined text-base ${gonderiliyor ? "animate-spin" : ""}`}>
              {gonderiliyor ? "progress_activity" : "autorenew"}
            </span>
            {gonderiliyor ? "Yönlendiriliyor..." : "1 Yıl Yenile"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BilgiKutusu({ ikon, baslik, deger, alt }: { ikon: string; baslik: string; deger: string; alt?: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary text-lg">{ikon}</span>
        <p className="text-xs text-on-surface-variant">{baslik}</p>
      </div>
      <p className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{deger}</p>
      {alt && <p className="text-[11px] text-on-surface-variant mt-0.5">{alt}</p>}
    </div>
  );
}
