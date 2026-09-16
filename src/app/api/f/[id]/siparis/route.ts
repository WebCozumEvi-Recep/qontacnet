import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteSiparisiOlustur } from "@/lib/site-siparis";

// Public: firma satış sayfasından (/f/<id>) satın alma. Sipariş firmanın referansıyla
// açılır; ödeme onaylanınca alıcıya firmaya bağlı üye hesabı oluşturulur (odeme-sonuc.ts).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const firma = await prisma.firma.findUnique({ where: { id }, select: { id: true, durum: true, urunId: true } });
  if (!firma || firma.durum !== "AKTIF" || !firma.urunId) {
    return NextResponse.json({ ok: false, error: "Bu satış sayfası şu an kullanılamıyor." }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return siteSiparisiOlustur(req, body, {
    kaynak: "FIRMA_LINK",
    firmaId: firma.id,
    izinliUrunId: firma.urunId,
    donusYolu: `/f/${firma.id}`,
  });
}
