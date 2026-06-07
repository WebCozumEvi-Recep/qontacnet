import nodemailer from "nodemailer";

let cached: nodemailer.Transporter | null = null;

export function getTransporter() {
  if (cached) return cached;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("SMTP env değişkenleri eksik (.env.local'i kontrol et).");
  }

  cached = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ignoreTLS: !secure,
    tls: { rejectUnauthorized: false },
  });
  return cached;
}

export interface SendArgs {
  to?: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendMail({ to, subject, html, replyTo }: SendArgs) {
  const transporter = getTransporter();
  const from = `"${process.env.SMTP_FROM_NAME ?? "QONTAC"}" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`;
  const dest = to ?? process.env.NOTIFY_TO ?? process.env.SMTP_USER!;
  return transporter.sendMail({ from, to: dest, subject, html, replyTo });
}

export function htmlLayout(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f3f5fa;font-family:'Inter',Arial,sans-serif;color:#1a1f2e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5fa;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
        <tr><td style="background:linear-gradient(135deg,#050816,#0B1020);padding:24px 32px;">
          <div style="color:#00d4ff;font-weight:800;font-size:22px;letter-spacing:1px;font-family:'Sora',Arial,sans-serif;">QONTAC <span style="color:#aab3c5;font-weight:500;font-size:13px;">· Network Card</span></div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;font-family:'Sora',Arial,sans-serif;color:#0B1020;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f8f9fc;color:#6b7280;font-size:12px;text-align:center;border-top:1px solid #eef0f5;">
          QONTAC.NET · NFC + QR Dijital Kartvizit Platformu
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function row(label: string, value: string) {
  if (!value) return "";
  const safe = value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px;">${label}</td><td style="padding:8px 0;color:#1a1f2e;font-size:14px;font-weight:500;">${safe}</td></tr>`;
}
