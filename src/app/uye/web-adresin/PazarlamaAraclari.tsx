"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  TANITIM_ADIMLARI, imzaHtml, imzaMetin, paylasimBaglantilari, paylasimMetinleri,
  webAdresi, webUrl, adSoyad, type TanitimKisi,
} from "@/lib/domain-pazarlama";
import type { AlanAdiKaydi } from "./page";

type Sekme = "qr" | "imza" | "metin" | "liste";

const SEKMELER: { anahtar: Sekme; baslik: string; ikon: string }[] = [
  { anahtar: "qr", baslik: "QR & Baskı", ikon: "qr_code_2" },
  { anahtar: "imza", baslik: "E-posta İmzası", ikon: "mail" },
  { anahtar: "metin", baslik: "Hazır Metinler", ikon: "edit_note" },
  { anahtar: "liste", baslik: "Tanıtım Listesi", ikon: "checklist" },
];

export function PazarlamaAraclari({ kayit, profil, onDegisti }: {
  kayit: AlanAdiKaydi;
  profil: { ad: string; soyad: string; unvan: string; email: string; telefon: string };
  onDegisti: () => void;
}) {
  const [sekme, setSekme] = useState<Sekme>("qr");

  const kisi: TanitimKisi = useMemo(() => ({
    ad: profil.ad, soyad: profil.soyad, unvan: profil.unvan,
    telefon: profil.telefon, email: profil.email, alanAdi: kayit.alanAdi,
  }), [profil, kayit.alanAdi]);

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary text-lg">campaign</span>
        <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
          Web adresinizi tanıtın
        </h3>
      </div>
      <p className="text-xs text-on-surface-variant mb-5">
        Adresiniz ne kadar çok yerde görünürse o kadar çok kişiye ulaşırsınız.
        Aşağıdaki hazır araçlarla dakikalar içinde başlayabilirsiniz.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {SEKMELER.map(s => (
          <button key={s.anahtar} type="button" onClick={() => setSekme(s.anahtar)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              sekme === s.anahtar
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-surface-dim border-white/10 text-on-surface-variant hover:text-on-surface"
            }`}>
            <span className="material-symbols-outlined text-base">{s.ikon}</span>
            {s.baslik}
          </button>
        ))}
      </div>

      {sekme === "qr" && <QrSekmesi kisi={kisi} />}
      {sekme === "imza" && <ImzaSekmesi kisi={kisi} />}
      {sekme === "metin" && <MetinSekmesi kisi={kisi} />}
      {sekme === "liste" && <ListeSekmesi kayit={kayit} onDegisti={onDegisti} />}

      {/* Hızlı paylaş — her sekmede görünür */}
      <div className="mt-6 pt-5 border-t border-white/10">
        <p className="text-xs text-on-surface-variant mb-3">Hızlı paylaş</p>
        <div className="flex flex-wrap gap-2">
          {paylasimBaglantilari(kisi).map(p => (
            <a key={p.ad} href={p.url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-dim border border-white/10 rounded-xl text-xs text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all">
              <span className="material-symbols-outlined text-base">{p.ikon}</span>
              {p.ad}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————— QR & baskı

function QrSekmesi({ kisi }: { kisi: TanitimKisi }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const url = webUrl(kisi);

  const indir = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const boyut = 800;
    const canvas = document.createElement("canvas");
    canvas.width = boyut; canvas.height = boyut;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgStr = new XMLSerializer().serializeToString(svg);
    const blobUrl = URL.createObjectURL(new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, boyut, boyut);
      URL.revokeObjectURL(blobUrl);
      const a = document.createElement("a");
      a.download = `${kisi.alanAdi}-qr.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = blobUrl;
  }, [kisi.alanAdi]);

  /** Yazdırılabilir afiş — yeni sekmede açılır, kullanıcı Ctrl+P ile basar. */
  const afisYazdir = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${webAdresi(kisi)}</title>
      <style>
        @page { size: A4; margin: 0; }
        body { margin:0; font-family: Arial, Helvetica, sans-serif; display:flex; align-items:center; justify-content:center;
               height:100vh; background:#fff; color:#111; }
        .afis { text-align:center; padding:40px; }
        .qr { width:340px; height:340px; margin:0 auto 28px; }
        .qr svg { width:100%; height:100%; }
        h1 { font-size:44px; margin:0 0 8px; letter-spacing:-0.5px; }
        h2 { font-size:26px; margin:0 0 24px; color:#555; font-weight:normal; }
        .adres { font-size:34px; font-weight:bold; color:#8a6d1f; }
        p { font-size:16px; color:#666; margin-top:18px; }
      </style></head><body>
      <div class="afis">
        <div class="qr">${svgStr}</div>
        <h1>${adSoyad(kisi)}</h1>
        ${kisi.unvan ? `<h2>${kisi.unvan}</h2>` : ""}
        <div class="adres">${webAdresi(kisi)}</div>
        <p>Kameranızı QR koda tutun, tüm bilgilerime anında ulaşın.</p>
      </div></body></html>`);
    w.document.close();
  }, [kisi]);

  return (
    <div className="grid sm:grid-cols-[auto,1fr] gap-5 items-start">
      <div ref={qrRef} className="mx-auto sm:mx-0 p-4 rounded-2xl border border-white/10 bg-[#0f1321]">
        <QRCodeSVG value={url} size={180} bgColor="#0f1321" fgColor="#d4af37" level="H" style={{ borderRadius: 8 }} />
      </div>
      <div>
        <p className="text-sm text-on-surface mb-1">Web adresinizin QR kodu</p>
        <p className="text-xs text-on-surface-variant mb-4">
          Bu kod doğrudan <strong className="text-on-surface">{webAdresi(kisi)}</strong> adresine gider.
          Kartvizit arkası, vitrin, menü, araç giydirme ve broşürlerde kullanabilirsiniz.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={indir}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm hover:bg-primary/20 transition-all">
            <span className="material-symbols-outlined text-base">download</span>
            QR Kodu İndir (PNG)
          </button>
          <button type="button" onClick={afisYazdir}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-dim border border-white/10 text-on-surface-variant rounded-xl text-sm hover:text-primary transition-all">
            <span className="material-symbols-outlined text-base">print</span>
            A4 Afiş Yazdır
          </button>
        </div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————— e-posta imzası

function ImzaSekmesi({ kisi }: { kisi: TanitimKisi }) {
  const [kopyalandi, setKopyalandi] = useState("");
  const html = useMemo(() => imzaHtml(kisi), [kisi]);

  async function bicimliKopyala() {
    try {
      // Zengin metin olarak kopyala — Gmail/Outlook'a yapıştırınca biçim korunur.
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([imzaMetin(kisi)], { type: "text/plain" }),
        }),
      ]);
      setKopyalandi("bicimli");
    } catch {
      await navigator.clipboard.writeText(imzaMetin(kisi));
      setKopyalandi("duz");
    }
    setTimeout(() => setKopyalandi(""), 2000);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-on-surface-variant">
        Gönderdiğiniz her e-posta bir tanıtım fırsatı. Aşağıdaki imzayı kopyalayıp
        Gmail veya Outlook&apos;un imza ayarlarına yapıştırın.
      </p>

      <div className="bg-white rounded-xl p-5 overflow-x-auto">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={bicimliKopyala}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm hover:bg-primary/20 transition-all">
          <span className="material-symbols-outlined text-base">{kopyalandi ? "check" : "content_copy"}</span>
          {kopyalandi === "bicimli" ? "Kopyalandı" : kopyalandi === "duz" ? "Düz metin kopyalandı" : "İmzayı Kopyala"}
        </button>
        <button type="button" onClick={() => { navigator.clipboard.writeText(html); setKopyalandi("kod"); setTimeout(() => setKopyalandi(""), 2000); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-dim border border-white/10 text-on-surface-variant rounded-xl text-sm hover:text-primary transition-all">
          <span className="material-symbols-outlined text-base">code</span>
          {kopyalandi === "kod" ? "HTML kopyalandı" : "HTML Kodunu Kopyala"}
        </button>
      </div>
    </div>
  );
}

// ————————————————————————————————————————— hazır metinler

function MetinSekmesi({ kisi }: { kisi: TanitimKisi }) {
  const [kopyalanan, setKopyalanan] = useState("");
  const metinler = useMemo(() => paylasimMetinleri(kisi), [kisi]);

  function kopyala(baslik: string, metin: string) {
    navigator.clipboard.writeText(metin);
    setKopyalanan(baslik);
    setTimeout(() => setKopyalanan(""), 2000);
  }

  return (
    <div className="space-y-3">
      {metinler.map(m => (
        <div key={m.baslik} className="bg-surface-dim border border-white/10 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-sm font-medium text-on-surface">{m.baslik}</p>
              <p className="text-[11px] text-on-surface-variant">{m.aciklama}</p>
            </div>
            <button type="button" onClick={() => kopyala(m.baslik, m.metin)}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all">
              <span className="material-symbols-outlined text-sm">{kopyalanan === m.baslik ? "check" : "content_copy"}</span>
              {kopyalanan === m.baslik ? "Kopyalandı" : "Kopyala"}
            </button>
          </div>
          <pre className="text-xs text-on-surface-variant whitespace-pre-wrap font-sans leading-relaxed">{m.metin}</pre>
        </div>
      ))}
    </div>
  );
}

// ————————————————————————————————————————— tanıtım kontrol listesi

function ListeSekmesi({ kayit, onDegisti }: { kayit: AlanAdiKaydi; onDegisti: () => void }) {
  const [durum, setDurum] = useState<Record<string, boolean>>(kayit.tanitimAdimlari ?? {});

  async function degistir(anahtar: string) {
    const yeni = !durum[anahtar];
    setDurum(p => ({ ...p, [anahtar]: yeni })); // iyimser güncelleme
    const j = await fetch("/api/me/alan-adi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: kayit.id, adim: anahtar, isaretli: yeni }),
    }).then(r => r.json()).catch(() => null);
    if (!j?.ok) setDurum(p => ({ ...p, [anahtar]: !yeni }));
    else onDegisti();
  }

  const tamam = TANITIM_ADIMLARI.filter(a => durum[a.anahtar]).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-on-surface-variant">
          Adresinizi tanıtmak için yapabilecekleriniz. Tamamladıkça işaretleyin.
        </p>
        <span className="text-xs text-primary font-medium shrink-0">{tamam}/{TANITIM_ADIMLARI.length}</span>
      </div>

      <div className="h-1.5 bg-surface-dim rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${(tamam / TANITIM_ADIMLARI.length) * 100}%` }} />
      </div>

      {TANITIM_ADIMLARI.map(a => {
        const isaretli = Boolean(durum[a.anahtar]);
        return (
          <button key={a.anahtar} type="button" onClick={() => degistir(a.anahtar)}
            className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
              isaretli ? "border-primary/30 bg-primary/5" : "border-white/10 bg-surface-dim hover:border-white/20"
            }`}>
            <span className={`material-symbols-outlined text-lg shrink-0 ${isaretli ? "text-primary" : "text-on-surface-variant"}`}>
              {isaretli ? "check_circle" : a.ikon}
            </span>
            <span className="flex-1 min-w-0">
              <span className={`block text-sm ${isaretli ? "text-on-surface-variant line-through" : "text-on-surface"}`}>{a.baslik}</span>
              <span className="block text-[11px] text-on-surface-variant">{a.aciklama}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
