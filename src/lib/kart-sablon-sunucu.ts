import "server-only";
import { RENK, alanlariDuzenle, type Yon } from "@/lib/kart-baski";

const GORSEL_YOLU = /^\/uploads\/[\w./-]+$/;

/** İstek gövdesinden şablon alanlarını doğrular; yalnız gönderilen alanlar döner. */
export function sablonGovdesiOku(body: Record<string, unknown>, mevcutYon?: Yon) {
  const data: { ad?: string; yon?: Yon; onGorsel?: string; arkaGorsel?: string; onRenk?: string; arkaRenk?: string; onZeminBas?: boolean; arkaZeminBas?: boolean; alanlar?: object } = {};
  if (typeof body.ad === "string") {
    const ad = body.ad.trim().slice(0, 100);
    if (!ad) return { hata: "Şablon adı zorunludur." } as const;
    data.ad = ad;
  }
  if (body.yon === "yatay" || body.yon === "dikey") data.yon = body.yon;
  for (const k of ["onGorsel", "arkaGorsel"] as const) {
    if (typeof body[k] === "string") {
      const v = (body[k] as string).trim();
      if (v && !GORSEL_YOLU.test(v)) return { hata: "Geçersiz görsel yolu." } as const;
      data[k] = v;
    }
  }
  for (const k of ["onRenk", "arkaRenk"] as const) {
    if (typeof body[k] === "string" && RENK.test(body[k] as string)) data[k] = (body[k] as string).toLowerCase();
  }
  for (const k of ["onZeminBas", "arkaZeminBas"] as const) {
    if (typeof body[k] === "boolean") data[k] = body[k] as boolean;
  }
  if ("alanlar" in body) data.alanlar = alanlariDuzenle(body.alanlar, data.yon ?? mevcutYon ?? "yatay");
  return { data } as const;
}
