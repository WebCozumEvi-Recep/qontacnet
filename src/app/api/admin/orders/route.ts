import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, orders });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const body = (await req.json()) as Record<string, unknown>;
  const { firma, urun, adet, birimFiyat, kdvOrani, indirim, notlar } = body;
  const tutar = body.tutar;
  if (!firma || !urun || !adet) return NextResponse.json({ ok: false, error: "Firma, ürün ve adet zorunlu." }, { status: 400 });

  const bp = Number(birimFiyat) || 0;
  const kv = Number(kdvOrani) ?? 20;
  const ind = Number(indirim) || 0;
  const araToplam = Number(adet) * bp;
  const hesaplananTutar = bp > 0 ? Math.round(araToplam + araToplam * kv / 100 - ind) : Number(tutar) || 0;

  const count = await prisma.order.count();
  const siparisNo = `SIP-${new Date().getFullYear()}-${String(1300 + count + 1)}`;
  const order = await prisma.order.create({
    data: {
      siparisNo, firma: String(firma), urun: String(urun), adet: Number(adet),
      tutar: hesaplananTutar, durum: "HAZIRLANIYOR",
      birimFiyat: bp, kdvOrani: kv, indirim: ind,
      notlar: String(notlar || ""),
    },
  });
  return NextResponse.json({ ok: true, order });
}

const DURUMLAR = ["HAZIRLANIYOR", "URETIMDE", "KARGODA", "TESLIM", "IPTAL"];

export async function PATCH(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id, durum, kargoNo } = (await req.json()) as Record<string, unknown>;
  if (!id) return NextResponse.json({ ok: false, error: "id gerekli." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof durum === "string" && DURUMLAR.includes(durum)) data.durum = durum;
  if (typeof kargoNo === "string") data.kargoNo = kargoNo;

  const order = await prisma.order.update({ where: { id: String(id) }, data });
  return NextResponse.json({ ok: true, order });
}
