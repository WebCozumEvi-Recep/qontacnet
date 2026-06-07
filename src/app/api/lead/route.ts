import { NextRequest, NextResponse } from "next/server";
import { sendMail, htmlLayout, row } from "@/lib/mailer";
import { mockMembers } from "@/lib/mock-data";

interface Payload {
  uyeId?: string;
  ad?: string;
  sirket?: string;
  email?: string;
  telefon?: string;
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as Payload;
    const { uyeId, ad, sirket, email, telefon } = data;

    if (!ad || !email) {
      return NextResponse.json({ ok: false, error: "Ad ve e-posta zorunlu." }, { status: 400 });
    }

    const uye = mockMembers.find(m => m.id === uyeId);
    const uyeAdi = uye ? `${uye.ad} ${uye.soyad}` : "Üye";
    const firmaAdi = uye?.firmaAdi ?? "QONTAC";

    const bodyHtml = `
      <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
        <strong>${uyeAdi}</strong> üyenizin dijital kartından yeni bir <strong>lead</strong> kaydı geldi.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;border-top:1px solid #eef0f5;">
        ${row("Ad Soyad", ad)}
        ${row("E-posta", email)}
        ${row("Telefon", telefon ?? "—")}
        ${row("Şirket", sirket ?? "—")}
        ${row("Temsilci", `${uyeAdi} (${firmaAdi})`)}
      </table>
      <p style="margin:24px 0 0;color:#6b7280;font-size:12px;">QONTAC firma panelinden bu lead'i takip edebilirsiniz.</p>
    `;

    const tasks = [
      sendMail({
        subject: `Yeni Lead · ${ad} → ${uyeAdi}`,
        html: htmlLayout("Yeni Lead Kaydı", bodyHtml),
        replyTo: email,
      }),
    ];

    if (uye?.email) {
      const uyeBody = `
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
          Merhaba ${uye.ad}, dijital kartın aracılığıyla yeni bir kişi seninle iletişime geçmek istiyor:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;border-top:1px solid #eef0f5;">
          ${row("Ad Soyad", ad)}
          ${row("E-posta", email)}
          ${row("Telefon", telefon ?? "—")}
          ${row("Şirket", sirket ?? "—")}
        </table>
      `;
      tasks.push(
        sendMail({
          to: uye.email,
          subject: `Yeni temas: ${ad}`,
          html: htmlLayout("Sana Yeni Bir Lead Geldi", uyeBody),
          replyTo: email,
        }),
      );
    }

    await Promise.allSettled(tasks);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lead]", err);
    return NextResponse.json({ ok: false, error: "Mail gönderilemedi." }, { status: 500 });
  }
}
