"use client";
import { useEffect, useState } from "react";
import { fiyatMetni } from "@/lib/domain-fiyat";
import { KartFormu, BOS_KART, type KartAlanlari } from "@/components/odeme/KartFormu";
import { odemeyeGit, type OdemeYaniti } from "@/components/odeme/odeme-yonlendir";

interface Sonuc {
  alanAdi: string;
  tld: string;
  fiyat: number;
}

const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all";

/**
 * Profildeki telefonu ülke kodundan arındırır — "+90 532 111 2233" ve "0532..."
 * girdilerinin ikisi de "5321112233" olur, böylece +90 alanıyla çakışmaz.
 */
function yerelTelefon(ham: string): string {
  const rakam = (ham || "").replace(/\D/g, "");
  if (rakam.length > 10 && rakam.startsWith("90")) return rakam.slice(2);
  if (rakam.length > 10 && rakam.startsWith("0")) return rakam.slice(1);
  return rakam;
}

export function SatinAlmaFormu({ sonuc, profil, onKapat, onTamamlandi }: {
  sonuc: Sonuc;
  profil?: { ad: string; soyad: string; email: string; telefon: string };
  onKapat: () => void;
  onTamamlandi: () => void;
}) {
  const [form, setForm] = useState({
    ad: profil?.ad ?? "",
    soyad: profil?.soyad ?? "",
    firma: "",
    email: profil?.email ?? "",
    telefonUlkeKodu: "+90",
    telefon: yerelTelefon(profil?.telefon ?? ""),
    adres: "",
    sehir: "",
    ilce: "",
    postaKodu: "",
    ulke: "TR",
  });
  const [onay, setOnay] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [kart, setKart] = useState<KartAlanlari>(BOS_KART);
  // Seçili ödeme sağlayıcısı kart bilgisini bizden mi bekliyor?
  const [kartGerekli, setKartGerekli] = useState(false);

  useEffect(() => {
    fetch("/api/odeme/durum")
      .then(r => r.json())
      .then(j => { if (j?.ok) setKartGerekli(Boolean(j.kartGerekli)); })
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHata(""); setGonderiliyor(true);

    const j = await fetch("/api/me/alan-adi/satin-al", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tld: sonuc.tld,
        alanAdiEtiketi: sonuc.alanAdi.split(".")[0],
        sozlesmeOnay: onay,
        ...(kartGerekli ? { kart } : {}),
      }),
    }).then(r => r.json()).catch(() => null);

    if (!j?.ok) {
      setGonderiliyor(false);
      setHata(j?.error || "Sipariş oluşturulamadı.");
      if (j?.error?.includes("müsait")) onTamamlandi();
      return;
    }
    odemeyeGit(j.odeme as OdemeYaniti);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <form onSubmit={gonder} className="glass-card rounded-2xl p-5 sm:p-6 w-full max-w-2xl my-4 bg-surface">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
            www.{sonuc.alanAdi}
          </h3>
          <button type="button" onClick={onKapat} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="text-xs text-on-surface-variant mb-5">
          1 yıllık kayıt — <strong className="text-on-surface">{fiyatMetni(sonuc.fiyat)}</strong> (KDV dahil).
          Alan adı kayıt kurallarına göre aşağıdaki bilgiler sizin adınıza kayıt için kullanılır.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <Alan label="Ad"><input required value={form.ad} onChange={set("ad")} className={inputCls} /></Alan>
          <Alan label="Soyad"><input required value={form.soyad} onChange={set("soyad")} className={inputCls} /></Alan>
          <Alan label="Firma (varsa)" ipucu="Boş bırakırsanız ad soyadınız kullanılır.">
            <input value={form.firma} onChange={set("firma")} className={inputCls} />
          </Alan>
          <Alan label="E-posta"><input required type="email" value={form.email} onChange={set("email")} className={inputCls} /></Alan>
          <Alan label="Telefon">
            <div className="flex gap-2">
              <input required value={form.telefonUlkeKodu} onChange={set("telefonUlkeKodu")} className={`${inputCls} w-20`} />
              <input required inputMode="numeric" value={form.telefon} onChange={set("telefon")} placeholder="5xxxxxxxxx" className={inputCls} />
            </div>
          </Alan>
          <Alan label="Ülke">
            <select value={form.ulke} onChange={set("ulke")} className={inputCls}>
              <option value="TR">Türkiye</option>
              <option value="DE">Almanya</option>
              <option value="NL">Hollanda</option>
              <option value="GB">Birleşik Krallık</option>
              <option value="US">Amerika Birleşik Devletleri</option>
            </select>
          </Alan>
          <div className="sm:col-span-2">
            <Alan label="Adres"><input required value={form.adres} onChange={set("adres")} className={inputCls} /></Alan>
          </div>
          <Alan label="İl"><input required value={form.sehir} onChange={set("sehir")} className={inputCls} /></Alan>
          <Alan label="İlçe"><input value={form.ilce} onChange={set("ilce")} className={inputCls} /></Alan>
          <Alan label="Posta Kodu"><input required inputMode="numeric" value={form.postaKodu} onChange={set("postaKodu")} className={inputCls} /></Alan>
        </div>

        {kartGerekli && (
          <div className="mb-4">
            <KartFormu kart={kart} onChange={setKart} />
          </div>
        )}

        <label className="flex items-start gap-2 text-xs text-on-surface-variant mb-4 cursor-pointer">
          <input type="checkbox" checked={onay} onChange={e => setOnay(e.target.checked)} className="mt-0.5" />
          <span>
            Alan adı hizmet şartlarını okudum ve onaylıyorum. Bu bilgilerin alan adı kaydı için
            kayıt kuruluşuna aktarılacağını kabul ediyorum. Alan adı kaydı tamamlandıktan sonra
            iade edilemez.
          </span>
        </label>

        {hata && (
          <p className="text-xs text-red-400 flex items-center gap-1 mb-3">
            <span className="material-symbols-outlined text-sm">error</span>{hata}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={!onay || gonderiliyor}
            className="px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60 inline-flex items-center gap-2">
            <span className={`material-symbols-outlined text-base ${gonderiliyor ? "animate-spin" : ""}`}>
              {gonderiliyor ? "progress_activity" : "lock"}
            </span>
            {gonderiliyor ? "Yönlendiriliyor..." : `${fiyatMetni(sonuc.fiyat)} — Ödemeye Geç`}
          </button>
          <button type="button" onClick={onKapat}
            className="px-5 py-2.5 border border-white/10 text-on-surface-variant rounded-xl text-sm hover:text-on-surface transition-all">
            Vazgeç
          </button>
        </div>
      </form>
    </div>
  );
}

function Alan({ label, ipucu, children }: { label: string; ipucu?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-on-surface-variant mb-1.5">{label}</label>
      {children}
      {ipucu && <p className="text-[11px] text-on-surface-variant mt-1">{ipucu}</p>}
    </div>
  );
}
