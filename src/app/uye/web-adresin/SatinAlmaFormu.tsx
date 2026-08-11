"use client";
import { useEffect, useMemo, useState } from "react";
import { fiyatMetni } from "@/lib/domain-fiyat";
import { KartFormu, BOS_KART, type KartAlanlari } from "@/components/odeme/KartFormu";
import { odemeyeGit, type OdemeYaniti } from "@/components/odeme/odeme-yonlendir";

interface TldNitelik {
  anahtar: string;
  aciklama: string;
  zorunlu: boolean;
  tip: string;
  secenekler: { deger: string; aciklama: string }[];
}

interface Sonuc {
  alanAdi: string;
  tld: string;
  fiyat: number;
  /** Uzantıya özel ek alanlar (ör. .com.tr belge bilgileri) — servisten gelir. */
  nitelikler?: TldNitelik[];
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

/**
 * Kullanılmayan/geçersiz ülke kodları. Tarayıcının ülke veritabanı bunları da
 * tanıdığı için ayıklamak gerekiyor — aksi hâlde ör. "Almanya" araması tarihe
 * karışmış Doğu Almanya kodu "DD"yi bulur ve kayıt kuruluşu isteği reddeder.
 *
 * İlk grup ISO 3166-3 (artık kullanılmayan ülkeler), ikinci grup ise ülke
 * olmayan özel/ayrılmış kodlardır (kıta, birlik, üs bölgesi vb.).
 */
const GECERSIZ_ULKE_KODLARI = new Set([
  "AN", "BU", "CS", "CT", "DD", "DY", "FQ", "FX", "HV", "JT", "MI", "NH",
  "NQ", "NT", "PC", "PU", "PZ", "RH", "SU", "TP", "VD", "WK", "YD", "YU", "ZR",
  "AC", "CP", "DG", "EA", "EU", "EZ", "IC", "QO", "TA", "UN", "XA", "XB", "ZZ",
]);

/**
 * Tüm ülkelerin Türkçe adı → ISO-2 kod eşlemesi. Tarayıcının kendi ülke
 * veritabanından üretilir, elle liste tutmaya gerek kalmaz.
 * Registrar ISO-2 kod beklediği için kullanıcının yazdığı ad koda çevrilir.
 */
function ulkeSozlugu(): { ad: string; kod: string }[] {
  try {
    const isim = new Intl.DisplayNames(["tr"], { type: "region" });
    const harfler = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const liste: { ad: string; kod: string }[] = [];
    const gorulenAdlar = new Set<string>();

    for (const a of harfler) {
      for (const b of harfler) {
        const kod = a + b;
        if (GECERSIZ_ULKE_KODLARI.has(kod)) continue;

        const ad = isim.of(kod);
        // Tanımsız kodlarda API kodun kendisini döndürür — onları eliyoruz.
        if (!ad || ad === kod) continue;

        // Aynı ada sahip ikinci bir kod kalmışsa yalnızca ilkini tut.
        const anahtar = ad.toLocaleLowerCase("tr");
        if (gorulenAdlar.has(anahtar)) continue;
        gorulenAdlar.add(anahtar);

        liste.push({ ad, kod });
      }
    }
    return liste.sort((x, y) => x.ad.localeCompare(y.ad, "tr"));
  } catch {
    return [];
  }
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
  });
  // Ülke: "TR" ya da "DIGER". "DIGER" seçilirse ad elle yazılır ve koda çevrilir.
  const [ulkeSecim, setUlkeSecim] = useState<"TR" | "DIGER">("TR");
  const [ulkeAdi, setUlkeAdi] = useState("");

  // Uzantıya özel alanların değerleri: { anahtar: değer }.
  const nitelikler = useMemo(() => sonuc.nitelikler ?? [], [sonuc.nitelikler]);
  const [nitelikDeger, setNitelikDeger] = useState<Record<string, string>>({});

  const [onay, setOnay] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [kart, setKart] = useState<KartAlanlari>(BOS_KART);
  // Seçili ödeme sağlayıcısı kart bilgisini bizden mi bekliyor?
  const [kartGerekli, setKartGerekli] = useState(false);

  const ulkeler = useMemo(() => ulkeSozlugu(), []);

  /** Yazılan ülke adının ISO-2 karşılığı; bulunamazsa boş. */
  const ulkeKodu = useMemo(() => {
    if (ulkeSecim === "TR") return "TR";
    const yazilan = ulkeAdi.trim().toLocaleLowerCase("tr");
    if (!yazilan) return "";
    // Kullanıcı doğrudan kod da yazmış olabilir (ör. "DE").
    if (/^[a-zA-Z]{2}$/.test(yazilan) && ulkeler.some(u => u.kod === yazilan.toUpperCase())) {
      return yazilan.toUpperCase();
    }
    return ulkeler.find(u => u.ad.toLocaleLowerCase("tr") === yazilan)?.kod ?? "";
  }, [ulkeSecim, ulkeAdi, ulkeler]);

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

    if (!ulkeKodu) {
      setHata("Ülke adını listeden seçin veya tam yazın (ör. Almanya).");
      return;
    }

    setHata(""); setGonderiliyor(true);

    const j = await fetch("/api/me/alan-adi/satin-al", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        ulke: ulkeKodu,
        tld: sonuc.tld,
        alanAdiEtiketi: sonuc.alanAdi.split(".")[0],
        sozlesmeOnay: onay,
        tldNitelikleri: nitelikDeger,
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
    <form onSubmit={gonder} className="space-y-4">
      {/* Başlık — sayfa akışının içinde, üstte "geri" ile */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <button type="button" onClick={onKapat}
          className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors mb-3">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Sorgu sonuçlarına dön
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-primary font-mono break-all" style={{ fontFamily: "Sora, sans-serif" }}>
            www.{sonuc.alanAdi}
          </h3>
          <span className="text-lg font-bold text-on-surface whitespace-nowrap">
            {fiyatMetni(sonuc.fiyat)}
            <span className="text-xs text-on-surface-variant font-normal"> / yıl</span>
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mt-2">
          1 yıllık kayıt, KDV dahil. Alan adı kayıt kurallarına göre aşağıdaki bilgiler
          sizin adınıza kayıt için kullanılır.
        </p>
      </div>

      {/* Kayıt sahibi bilgileri */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <p className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>
          Kayıt Sahibi Bilgileri
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
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
            {/* Seçim ve serbest metin alt alta — yan yana dizilince dar grid
                hücresinde kartın dışına taşıyordu. */}
            <select
              value={ulkeSecim}
              onChange={e => { setUlkeSecim(e.target.value as "TR" | "DIGER"); setHata(""); }}
              className={inputCls}
            >
              <option value="TR">Türkiye</option>
              <option value="DIGER">Diğer</option>
            </select>

            {ulkeSecim === "DIGER" && (
              <>
                <input
                  required
                  list="ulke-listesi"
                  value={ulkeAdi}
                  onChange={e => { setUlkeAdi(e.target.value); setHata(""); }}
                  placeholder="Ülke adı yazın"
                  className={`${inputCls} mt-2`}
                />
                <datalist id="ulke-listesi">
                  {ulkeler.map(u => <option key={u.kod} value={u.ad} />)}
                </datalist>
              </>
            )}
            {ulkeSecim === "DIGER" && (
              <p className={`text-[11px] mt-1 ${ulkeAdi && !ulkeKodu ? "text-amber-400" : "text-on-surface-variant"}`}>
                {ulkeAdi && !ulkeKodu
                  ? "Bu ülke bulunamadı — yazarken çıkan listeden seçin."
                  : ulkeKodu
                    ? `Seçilen ülke kodu: ${ulkeKodu}`
                    : "Yazmaya başlayınca ülke listesi açılır."}
              </p>
            )}
          </Alan>

          <div className="sm:col-span-2">
            <Alan label="Adres"><input required value={form.adres} onChange={set("adres")} className={inputCls} /></Alan>
          </div>
          <Alan label="İl"><input required value={form.sehir} onChange={set("sehir")} className={inputCls} /></Alan>
          <Alan label="İlçe"><input value={form.ilce} onChange={set("ilce")} className={inputCls} /></Alan>
          <Alan label="Posta Kodu"><input required inputMode="numeric" value={form.postaKodu} onChange={set("postaKodu")} className={inputCls} /></Alan>
        </div>
      </div>

      {/* Uzantıya özel alanlar — yalnızca servis istiyorsa gösterilir (.com.tr vb.) */}
      {nitelikler.length > 0 && (
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <p className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>
            .{sonuc.tld} Uzantısı İçin Ek Bilgiler
          </p>
          <p className="text-xs text-on-surface-variant mb-4">
            Bu uzantının kayıt kuruluşu aşağıdaki bilgileri zorunlu tutuyor. Eksik veya hatalı
            bilgi kaydın reddedilmesine yol açar.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {nitelikler.map(n => (
              <Alan key={n.anahtar} label={n.aciklama + (n.zorunlu ? "" : " (isteğe bağlı)")}>
                {n.secenekler.length > 0 ? (
                  <select
                    required={n.zorunlu}
                    value={nitelikDeger[n.anahtar] ?? ""}
                    onChange={e => setNitelikDeger(p => ({ ...p, [n.anahtar]: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Seçin</option>
                    {n.secenekler.map(o => <option key={o.deger} value={o.deger}>{o.aciklama}</option>)}
                  </select>
                ) : (
                  <input
                    required={n.zorunlu}
                    value={nitelikDeger[n.anahtar] ?? ""}
                    onChange={e => setNitelikDeger(p => ({ ...p, [n.anahtar]: e.target.value }))}
                    className={inputCls}
                  />
                )}
              </Alan>
            ))}
          </div>
        </div>
      )}

      {/* Ödeme */}
      {kartGerekli && (
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <p className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>
            Ödeme
          </p>
          <KartFormu kart={kart} onChange={setKart} />
        </div>
      )}

      {/* Onay + gönder */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
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
      </div>
    </form>
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
