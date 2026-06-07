import { NextRequest, NextResponse } from "next/server";
import { sendMail, htmlLayout, row } from "@/lib/mailer";

interface Payload {
  ad?: string;
  firma?: string;
  email?: string;
  telefon?: string;
  uyeSayisi?: string;
  mesaj?: string;
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as Payload;
    const { ad, firma, email, telefon, uyeSayisi, mesaj } = data;

    if (!ad || !email || !firma) {
      return NextResponse.json({ ok: false, error: "Zorunlu alanlar eksik." }, { status: 400 });
    }

    const bodyHtml = `
      <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
        QONTAC landing sayfasından yeni bir <strong>demo talebi</strong> geldi.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;border-top:1px solid #eef0f5;">
        ${row("Yetkili", ad)}
        ${row("Firma", firma)}
        ${row("E-posta", email)}
        ${row("Telefon", telefon ?? "—")}
        ${row("Üye sayısı", uyeSayisi ?? "—")}
        ${row("Mesaj", mesaj ?? "—")}
      </table>
      <p style="margin:24px 0 0;color:#6b7280;font-size:12px;">Bu talebi <a href="mailto:${email}" style="color:#00d4ff;">${email}</a> adresine yanıtlayabilirsiniz.</p>
    `;

    await sendMail({
      subject: `Yeni Demo Talebi · ${firma}`,
      html: htmlLayout("Yeni Demo Talebi", bodyHtml),
      replyTo: email,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[demo-talep]", err);
    return NextResponse.json({ ok: false, error: "Mail gönderilemedi." }, { status: 500 });
  }
}
