"use client";
// NFC kartı hesaba bağlama adımı. Kartın durumu sunucuda çözülür; burada
// yalnızca aktivasyon isteği ve sonuç ekranları yer alır.
import { useState } from "react";
import Link from "next/link";

type Durum = "hazir" | "gonderiliyor" | "tamam" | "hata";

export function KartAktivasyonFormu({ token }: { token: string }) {
  const [durum, setDurum] = useState<Durum>("hazir");
  const [hata, setHata] = useState("");

  const aktiveEt = async () => {
    setDurum("gonderiliyor");
    try {
      const res = await fetch(`/api/aktiv/${token}`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setDurum("tamam");
      } else {
        setHata(data.error ?? "Aktivasyon başarısız.");
        setDurum("hata");
      }
    } catch {
      setHata("Bağlantı kurulamadı.");
      setDurum("hata");
    }
  };

  if (durum === "tamam") {
    return (
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-tertiary/20 border border-tertiary/30 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-tertiary text-3xl">check_circle</span>
        </div>
        <h2 className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Kartın Aktive Edildi!</h2>
        <p className="text-sm text-on-surface-variant">NFC kartın dijital profilinle bağlandı. Artık profilini düzenleyebilirsin.</p>
        <Link href="/uye" className="inline-block w-full py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold">
          Panele Git
        </Link>
      </div>
    );
  }

  if (durum === "hata") {
    return (
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-red-400">nfc</span>
        <h2 className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Aktivasyon Başarısız</h2>
        <p className="text-sm text-red-400">{hata}</p>
        <Link href="/uye" className="inline-block px-5 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant">
          Panele Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-8 max-w-md w-full space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-primary text-3xl">nfc</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
          QONTAC Kartını Aktive Et
        </h2>
        <p className="text-sm text-on-surface-variant">
          Bu NFC kartı hesabına bağlamak için aşağıdaki butona tıkla. Kart aktive olduğunda dijital profilinle eşleşir.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-primary font-medium">
          <span className="material-symbols-outlined text-base">info</span>
          Nasıl çalışır?
        </div>
        <ul className="text-on-surface-variant space-y-1 text-xs list-none ml-6">
          <li>• Kartı aktive ettiğinde seni temsil etmeye başlar</li>
          <li>• Birisi kartı okuttuğunda senin profilini görür</li>
          <li>• Profil bilgilerini istediğin zaman güncelleyebilirsin</li>
        </ul>
      </div>

      <button
        onClick={aktiveEt}
        disabled={durum === "gonderiliyor"}
        className="w-full py-3.5 bg-primary-container text-on-primary-container rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:scale-100"
      >
        <span className={`material-symbols-outlined text-base ${durum === "gonderiliyor" ? "animate-spin" : ""}`}>
          {durum === "gonderiliyor" ? "progress_activity" : "nfc"}
        </span>
        {durum === "gonderiliyor" ? "Aktive ediliyor..." : "Kartımı Aktive Et"}
      </button>

      <p className="text-center text-xs text-on-surface-variant">
        Sorun mu var?{" "}
        <Link href="/uye" className="text-primary hover:underline">Panele dön</Link>
      </p>
    </div>
  );
}
