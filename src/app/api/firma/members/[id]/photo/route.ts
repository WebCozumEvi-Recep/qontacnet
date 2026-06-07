import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const owned = await prisma.member.findFirst({ where: { id, firmaId: session.sub } });
  if (!owned) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ ok: false, error: "Dosya bulunamadı." }, { status: 400 });

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Sadece resim dosyaları kabul edilir." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Dosya boyutu 5MB'dan küçük olmalıdır." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const ext = file.type.split("/")[1] || "jpg";
    const filename = `member-${id}-${randomBytes(8).toString("hex")}.${ext}`;
    const publicDir = join(process.cwd(), "public", "uploads", "members");
    await mkdir(publicDir, { recursive: true });
    const filepath = join(publicDir, filename);
    await writeFile(filepath, Buffer.from(bytes));

    const photoUrl = `/uploads/members/${filename}`;
    await prisma.member.update({ where: { id }, data: { avatar: photoUrl } });

    return NextResponse.json({ ok: true, photoUrl });
  } catch (err) {
    console.error("[foto upload]", err);
    return NextResponse.json({ ok: false, error: "Fotoğraf yüklenemedi." }, { status: 500 });
  }
}
