import { NextRequest } from "next/server";
import { siteSiparisiOlustur } from "@/lib/site-siparis";

// Public: ana sayfadan ürün satın alma — sipariş ödeme beklemede oluşturulur,
// seçili ödeme sağlayıcısının 3D akışı başlatılır (bkz. src/lib/odeme.ts).
// Ödeme sonucu QNB'de /api/odeme/callback, DijiGate'te /api/odeme/dijigate/donus'ta işlenir.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return siteSiparisiOlustur(req, body, { kaynak: "SITE", donusYolu: "/" });
}
