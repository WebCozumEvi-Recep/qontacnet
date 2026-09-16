"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiparisFormu, type SiparisUrun } from "@/components/siparis/SiparisFormu";

// Siparişi açan tarayıcı, şifre belirleme anahtarını ödeme dönüşüne kadar saklar.
const anahtar = (no: string) => `qontac_hesap_${no}`;

type Sonuc =
  | { tip: "yukleniyor"; no: string }
  | { tip: "yeni"; no: string; token: string }
  | { tip: "mevcut"; no: string; email: string }
  | { tip: "eposta"; no: string } // token bu tarayıcıda yok ya da onay gecikti
  | { tip: "basarisiz"; no: string };

export function FirmaSatis({ firmaId, urun, odeme, no }: { firmaId: string; urun: SiparisUrun; odeme?: string; no: string }) {
  // Ödeme dönüşü (?odeme=...&no=...) sunucuda okunup buraya gelir.
  const [sonuc, setSonuc] = useState<Sonuc | null>(
    !odeme ? null : odeme === "basarili" ? { tip: "yukleniyor", no } : { tip: "basarisiz", no },
  );

  useEffect(() => {
    if (!odeme) return;
    window.history.replaceState({}, "", window.location.pathname);
    if (odeme !== "basarili") return;

    let token = "";
    try { token = sessionStorage.getItem(anahtar(no)) ?? ""; } catch {}
    const istek = token
      ? fetch(`/api/f/hesap?no=${encodeURIComponent(no)}&token=${encodeURIComponent(token)}`).then(r => r.json())
      : Promise.resolve(null);
    istek
      .then(j => {
        if (j?.durum === "yeni") setSonuc({ tip: "yeni", no, token });
        else if (j?.durum === "mevcut") setSonuc({ tip: "mevcut", no, email: j.email ?? "" });
        else setSonuc({ tip: "eposta", no });
      })
      .catch(() => setSonuc({ tip: "eposta", no }));
  }, [odeme, no]);

  if (sonuc) {
    const ok = sonuc.tip !== "basarisiz";
    return (
      <div className="glass-card rounded-2xl p-8 text-center space-y-4">
        <span className={`material-symbols-outlined text-6xl block ${ok ? "text-green-400" : "text-red-400"}`}>{ok ? "check_circle" : "error"}</span>
        <h2 className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
          {ok ? "Ödemeniz alındı, teşekkürler!" : "Ödeme tamamlanamadı"}
        </h2>
        {sonuc.no && <p className="text-sm text-on-surface-variant">Sipariş no: <span className="text-primary font-bold">{sonuc.no}</span></p>}

        {sonuc.tip === "yukleniyor" && <p className="text-sm text-on-surface-variant">Hesabınız hazırlanıyor...</p>}
        {sonuc.tip === "yeni" && (
          <>
            <p className="text-sm text-on-surface-variant">Üyelik hesabınız oluşturuldu. Giriş yapabilmek için şimdi şifrenizi belirleyin.</p>
            <Link href={`/auth/reset-password/${sonuc.token}?role=uye`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-bold">
              <span className="material-symbols-outlined text-base">key</span>Şifremi Belirle
            </Link>
          </>
        )}
        {sonuc.tip === "mevcut" && (
          <>
            <p className="text-sm text-on-surface-variant">
              {sonuc.email ? <><b>{sonuc.email}</b> adresiyle</> : "Bu e-posta adresiyle"} zaten bir hesabınız olduğu için siparişiniz mevcut hesabınıza eklendi.
            </p>
            <Link href="/auth/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-bold">
              <span className="material-symbols-outlined text-base">login</span>Giriş Yap
            </Link>
          </>
        )}
        {sonuc.tip === "eposta" && (
          <p className="text-sm text-on-surface-variant">Hesap bilgileriniz e-posta adresinize gönderildi. E-postadaki bağlantıdan şifrenizi belirleyebilirsiniz.</p>
        )}
        {sonuc.tip === "basarisiz" && (
          <>
            <p className="text-sm text-on-surface-variant">Kartınızdan tahsilat yapılmadı. Bilgilerinizi kontrol edip tekrar deneyebilirsiniz.</p>
            <button onClick={() => setSonuc(null)} className="px-6 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-bold">Tekrar Dene</button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6">
      <h2 className="text-base font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Satın Al</h2>
      <SiparisFormu
        urun={urun}
        endpoint={`/api/f/${firmaId}/siparis`}
        firmaAlani={false}
        adetAlani={false}
        onOdemeOncesi={(y) => {
          if (!y.hesapToken) return;
          try { sessionStorage.setItem(anahtar(y.siparisNo), y.hesapToken); } catch {}
        }}
      />
    </div>
  );
}
