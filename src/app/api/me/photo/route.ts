import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

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
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const filename = `member-${session.sub}-${randomBytes(8).toString("hex")}.${ext}`;
    const publicDir = join(process.cwd(), "public", "uploads", "members");
    await mkdir(publicDir, { recursive: true });
    await writeFile(join(publicDir, filename), Buffer.from(bytes));

    const photoUrl = `/uploads/members/${filename}`;
    await prisma.member.update({ where: { id: session.sub }, data: { avatar: photoUrl } });

    return NextResponse.json({ ok: true, photoUrl });
  } catch (err) {
    console.error("[me/photo]", err);
    return NextResponse.json({ ok: false, error: "Fotoğraf yüklenemedi." }, { status: 500 });
  }
}
