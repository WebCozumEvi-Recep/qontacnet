import Link from "next/link";

export default function KartBulunamadi() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "#050816" }}>
      <span className="material-symbols-outlined text-on-surface-variant text-6xl">sentiment_dissatisfied</span>
      <h1 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Kart bulunamadı</h1>
      <p className="text-sm text-on-surface-variant">Bu kart pasif veya mevcut değil.</p>
      <Link href="/" className="text-primary text-sm hover:underline mt-2">QONTAC ana sayfa →</Link>
    </div>
  );
}
