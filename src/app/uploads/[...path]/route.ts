import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname, sep } from "path";

// Standalone sunucu, build sonrası public/ altına eklenen dosyaları servis
// etmiyor; çalışma anında yüklenen upload'ları buradan diskten okuyoruz.
const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const uploadsRoot = join(process.cwd(), "public", "uploads");
  const filePath = join(uploadsRoot, ...path);
  if (!filePath.startsWith(uploadsRoot + sep)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream",
        // Upload dosyaları içerik değişince yeni ada yazılır; bir yıl önbelleklenebilir.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
