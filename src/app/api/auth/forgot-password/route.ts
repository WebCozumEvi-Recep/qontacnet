import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMail, htmlLayout } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const { email, role } = (await req.json()) as { email?: string; role?: "firma" | "uye" };
  if (!email) return NextResponse.json({ ok: false, error: "E-posta gerekli." }, { status: 400 });

  const lower = email.toLowerCase().trim();
  const kind: "firma" | "uye" = role === "uye" ? "uye" : "firma";

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

  let to: string | null = null;
  let name = "";

  if (kind === "uye") {
    const member = await prisma.member.findUnique({ where: { email: lower } });
    if (member) {
      await prisma.member.update({
        where: { id: member.id },
        data: { resetToken: token, resetExpiry: expiry },
      });
      to = member.email;
      name = `${member.ad} ${member.soyad}`.trim();
    }
  } else {
    const firma = await prisma.firma.findUnique({ where: { email: lower } });
    if (firma) {
      await prisma.firma.update({
        where: { id: firma.id },
        data: { resetToken: token, resetExpiry: expiry },
      });
      to = firma.email;
      name = firma.ad;
    }
  }

  // Always return ok to avoid email enumeration
  if (!to) return NextResponse.json({ ok: true });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://qontac.net";
  const link = `${baseUrl}/auth/reset-password/${token}?role=${kind}`;

  await sendMail({
    to,
    subject: "QONTAC — Şifre Sıfırlama",
    html: htmlLayout("Şifrenizi Sıfırlayın", `
      <p style="color:#374151;font-size:15px;line-height:1.6;">Merhaba <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;">Şifre sıfırlama talebinde bulundunuz. Aşağıdaki bağlantıya tıklayarak yeni şifrenizi belirleyebilirsiniz.</p>
      <p style="margin:24px 0;">
        <a href="${link}" style="background:#00d4ff;color:#050816;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none;display:inline-block;font-size:15px;">Şifremi Sıfırla</a>
      </p>
      <p style="color:#9ca3af;font-size:13px;">Bu bağlantı 1 saat geçerlidir. Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
    `),
  });

  return NextResponse.json({ ok: true });
}
