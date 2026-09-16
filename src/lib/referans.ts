// Firmaya özel satış linki: https://qontac.net/?ref=<firmaId>
// Ziyaretçi linkle geldiğinde referans 30 gün tarayıcıda saklanır ve
// sipariş verirken /api/siparis'e gönderilir (sunucu firmayı doğrular).
const ANAHTAR = "qontac_ref";
const SURE_MS = 30 * 24 * 60 * 60 * 1000;

export const satisLinki = (firmaId: string) => `https://qontac.net/?ref=${encodeURIComponent(firmaId)}`;

export function referansiYakala() {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem(ANAHTAR, JSON.stringify({ ref, t: Date.now() }));
  } catch {}
}

export function referansiOku(): string | undefined {
  try {
    const kayit = JSON.parse(localStorage.getItem(ANAHTAR) ?? "null") as { ref: string; t: number } | null;
    if (kayit && Date.now() - kayit.t < SURE_MS) return kayit.ref;
  } catch {}
  return undefined;
}
