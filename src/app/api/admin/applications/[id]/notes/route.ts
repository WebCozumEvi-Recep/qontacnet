import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  const body = (await req.json()) as { icerik?: string };
  if (!body.icerik?.trim()) return NextResponse.json({ ok: false, error: "Not boş olamaz." }, { status: 400 });

  const user = await getCurrentUser();
  const adminAd = (user?.data?.["ad"] as string) ?? "Admin";

  const note = await prisma.applicationNote.create({
    data: { applicationId: id, icerik: body.icerik.trim(), adminAd },
  });
  return NextResponse.json({ ok: true, note });
}
