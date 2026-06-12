import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireRole } from "@/lib/auth";

// Büyük video yüklemelerine izin ver (route handler body'sini sınırlama)
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "Dosya bulunamadı." }, { status: 400 });

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      return NextResponse.json({ ok: false, error: "Sadece görsel veya video yüklenebilir." }, { status: 400 });
    }
    const limit = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > limit) {
      return NextResponse.json({ ok: false, error: isVideo ? "Video 200MB'dan büyük olamaz." : "Görsel 10MB'dan büyük olamaz." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "tanitim");
    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

    const url = `/uploads/tanitim/${filename}`;
    return NextResponse.json({ ok: true, url, ad: file.name });
  } catch {
    return NextResponse.json({ ok: false, error: "Yükleme başarısız." }, { status: 500 });
  }
}
