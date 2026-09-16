import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { KartAktivasyonFormu } from "./KartAktivasyonFormu";

/**
 * NFC/QR kart giriş noktası (`/k/<token>`).
 *
 * Kartların ezici çoğunluğu aktif olduğu için asıl yol "aktif kart → üyenin
 * kartına git". Bu karar sunucuda verilir ve tarayıcıya doğrudan 307 yönlendirme
 * döner; eskiden burada boş sayfa → JS → /api/aktiv isteği → istemci
 * yönlendirmesi şeklinde üç adımlık bir bekleme vardı.
 */
export default async function KartAktivasyon({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  const { token } = await params;
  const { src } = await searchParams;

  const card = await prisma.physicalCard.findUnique({
    where: { token },
    select: { aktif: true, memberId: true, aktivasyonAt: true },
  });

  if (!card) {
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

  if (card.aktif && card.memberId && card.aktivasyonAt && card.aktivasyonAt > new Date()) {
    const tarih = card.aktivasyonAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-primary">event_upcoming</span>
          <h2 className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Kart henüz aktif değil</h2>
          <p className="text-sm text-on-surface-variant">Bu QONTAC kartı <b className="text-on-surface">{tarih}</b> tarihinde kullanıma açılacak.</p>
          <Link href="/" className="inline-block px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  if (card.aktif && card.memberId) {
    // Ziyaret kaynağını (nfc/qr) taşı ki panelde trafik ayrışsın.
    const q = src === "nfc" || src === "qr" ? `?src=${src}` : "";
    redirect(`/kart/${card.memberId}${q}`);
  }

  // Kart henüz aktive edilmemiş — yalnız giriş yapmış üye bağlayabilir.
  const session = await getSession();
  if (session?.role !== "uye") redirect(`/auth/login?next=/k/${token}`);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <KartAktivasyonFormu token={token} />
    </div>
  );
}
