import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoTicket {
  status?: "ok" | "error";
  details?: { error?: string };
}

/**
 * Bir üyenin tüm kayıtlı cihazlarına Expo push bildirimi gönderir.
 * Geçersiz (DeviceNotRegistered) token'ları otomatik temizler.
 * Token yoksa veya hata olursa sessizce döner — çağıran akışı bloklamaz.
 */
export async function sendPushToMember(memberId: string, msg: PushMessage): Promise<void> {
  const kayitlar = await prisma.pushToken.findMany({ where: { memberId }, select: { token: true } });
  if (kayitlar.length === 0) return;

  const tokens = kayitlar.map(k => k.token);
  const messages = tokens.map(to => ({
    to,
    sound: "default",
    title: msg.title,
    body: msg.body,
    data: msg.data ?? {},
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    const json = (await res.json().catch(() => null)) as { data?: ExpoTicket[] } | null;

    const tickets = json?.data;
    if (Array.isArray(tickets)) {
      const sil: string[] = [];
      tickets.forEach((t, i) => {
        if (t?.status === "error" && t?.details?.error === "DeviceNotRegistered") sil.push(tokens[i]);
      });
      if (sil.length) await prisma.pushToken.deleteMany({ where: { token: { in: sil } } });
    }
  } catch (err) {
    console.error("[push]", err);
  }
}
