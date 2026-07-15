import { createHmac } from "crypto";

/**
 * NFC çip kilit parolası — her kart için gizli anahtar + kart token'ından türetilir.
 *
 * NTAG213/215/216 çipleri 32-bit PWD + 16-bit PACK ile yazma korumasını destekler.
 * Parola HMAC-SHA256(anahtar, token)'dan türetildiği için:
 *  - Her çipin parolası benzersizdir (bir kart ele geçse diğerleri güvende),
 *  - Sistem anahtarı + token'ı bilerek parolayı istediği an yeniden hesaplayabilir,
 *  - Anahtarı bilmeyen çipin içeriğini (URL'yi) değiştiremez.
 *
 * @returns pwd: 8 hex hane (4 byte), pack: 4 hex hane (2 byte). Anahtar boşsa null.
 */
export function nfcParola(anahtar: string, token: string): { pwd: string; pack: string } | null {
  if (!anahtar) return null;
  const h = createHmac("sha256", anahtar).update(token).digest();
  return {
    pwd: h.subarray(0, 4).toString("hex").toUpperCase(),
    pack: h.subarray(4, 6).toString("hex").toUpperCase(),
  };
}
