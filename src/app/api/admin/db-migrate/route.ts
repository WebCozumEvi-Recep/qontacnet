import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

// DB şemasını admin panelinden günceller. Yalnız admin.
// `prisma db push` DB'yi uygulamanın beklediği şemaya eşitler: eksik kolon/enum
// değerlerini ekler. Migration geçmişine bakmaz — drift'li DB'de bile çalışır ve
// yalnız eksikleri ekler (toplayıcı). Veri kaybı gerektiren bir değişiklik varsa
// --accept-data-loss vermediğimiz için uygulanmaz, hata döner. Tekrar basmak güvenlidir.
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

function prismaBin() {
  return path.join(process.cwd(), "node_modules", ".bin", "prisma");
}

async function calistir(args: string[]) {
  const { stdout, stderr } = await execFileAsync(prismaBin(), args, {
    cwd: process.cwd(),
    timeout: 120_000,
    env: process.env,
    maxBuffer: 1024 * 1024 * 8,
  });
  return `${stdout}\n${stderr}`.trim();
}

// GET: bekleyen migration durumunu göster (uygulamadan)
export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  try {
    const cikti = await calistir(["migrate", "status"]);
    return NextResponse.json({ ok: true, cikti });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json({ ok: true, cikti: (err.stdout || "") + "\n" + (err.stderr || err.message || "") });
  }
}

// POST: DB şemasını uygulamanın beklediği hale eşitle (eksik kolon/enum ekler)
export async function POST() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  try {
    const cikti = await calistir(["db", "push"]);
    return NextResponse.json({ ok: true, cikti });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json(
      { ok: false, error: (err.stderr || err.message || "Migration başarısız.").toString().slice(0, 2000), cikti: (err.stdout || "").toString() },
      { status: 500 },
    );
  }
}
