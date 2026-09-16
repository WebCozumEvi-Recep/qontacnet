// Fiziksel kart URL'leri — kaynak ayrımı için ?src parametresi taşır.
// NFC çipine nfcUrl, basılı QR'a qrUrl yazılır; ziyaret kaynağı böyle ayrışır.
export const kartNfcUrl = (token: string) => `https://qontac.net/k/${token}?src=nfc`;
export const kartQrUrl = (token: string) => `https://qontac.net/k/${token}?src=qr`;
