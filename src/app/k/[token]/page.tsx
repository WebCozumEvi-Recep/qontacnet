"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type State = "loading" | "redirect" | "activate" | "activating" | "done" | "error" | "invalid";

export default function KartAktivasyon() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      // 1. Kartın durumunu sorgula
      const res = await fetch(`/api/aktiv/${token}`);
      const data = await res.json();

      if (!res.ok || !data.ok) { setState("invalid"); return; }

      if (data.aktif && data.memberId) {
        // Kart zaten aktif → doğrudan üyenin public kartına yönlendir
        router.replace(`/kart/${data.memberId}`);
        setState("redirect");
        return;
      }

      // Kart henüz aktive edilmemiş — kullanıcı giriş yapmış mı?
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (!meData.user || meData.user.role !== "uye") {
        // Giriş yoksa login'e yönlendir, geri dönecek URL parametre olarak
        router.replace(`/auth/login?next=/k/${token}`);
        return;
      }

      setState("activate");
    })();
  }, [token, router]);

  const doActivate = async () => {
    setState("activating");
    const res = await fetch(`/api/aktiv/${token}`, { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      setState("done");
    } else {
      setErrorMsg(data.error ?? "Aktivasyon başarısız.");
      setState("error");
    }
  };

  if (state === "loading" || state === "redirect") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-red-400">error</span>
          <h2 className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Geçersiz Kart</h2>
          <p className="text-sm text-on-surface-variant">Bu QR kodu geçerli bir QONTAC kartına ait değil.</p>
          <Link href="/" className="inline-block px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
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
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-red-400">nfc</span>
          <h2 className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Aktivasyon Başarısız</h2>
          <p className="text-sm text-red-400">{errorMsg}</p>
          <Link href="/uye" className="inline-block px-5 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant">
            Panele Dön
          </Link>
        </div>
      </div>
    );
  }

  // state === "activate" || "activating"
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full space-y-6">
        {/* Header */}
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

        {/* Info box */}
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
          onClick={doActivate}
          disabled={state === "activating"}
          className="w-full py-3.5 bg-primary-container text-on-primary-container rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:scale-100"
        >
          {state === "activating" ? (
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base">nfc</span>
          )}
          {state === "activating" ? "Aktive ediliyor..." : "Kartımı Aktive Et"}
        </button>

        <p className="text-center text-xs text-on-surface-variant">
          Sorun mu var?{" "}
          <Link href="/uye" className="text-primary hover:underline">Panele dön</Link>
        </p>
      </div>
    </div>
  );
}
