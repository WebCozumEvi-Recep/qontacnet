// DB enum değerlerini UI etiketlerine çevirir

export const paketLabel: Record<string, string> = {
  BASLANGIC: "Başlangıç",
  PROFESYONEL: "Profesyonel",
  KURUMSAL: "Kurumsal",
};

// Pakete göre oluşturulabilecek maksimum kart teması sayısı
export const temaLimiti: Record<string, number> = {
  BASLANGIC: 1,
  PROFESYONEL: 3,
  KURUMSAL: Infinity,
};

// Pakete göre eklenebilecek maksimum üye sayısı
export const uyeLimiti: Record<string, number> = {
  BASLANGIC: 50,
  PROFESYONEL: 500,
  KURUMSAL: Infinity,
};

export const firmaDurumMap: Record<string, { label: string; color: string }> = {
  AKTIF: { label: "Aktif", color: "#42faba" },
  DENEME: { label: "Deneme", color: "#a8e8ff" },
  ASKIDA: { label: "Askıda", color: "#ffb74d" },
  IPTAL: { label: "İptal", color: "#ff6b6b" },
};

export const siparisDurumMap: Record<string, { label: string; color: string; icon: string }> = {
  HAZIRLANIYOR: { label: "Hazırlanıyor", color: "#a8e8ff", icon: "pending" },
  URETIMDE: { label: "Üretimde", color: "#6001d1", icon: "factory" },
  KARGODA: { label: "Kargoda", color: "#00d4ff", icon: "local_shipping" },
  TESLIM: { label: "Teslim Edildi", color: "#42faba", icon: "check_circle" },
  IPTAL: { label: "İptal", color: "#ff6b6b", icon: "cancel" },
};

export const batchDurumMap: Record<string, { label: string; color: string }> = {
  URETIMDE: { label: "Üretimde", color: "#6001d1" },
  STOKTA: { label: "Stokta", color: "#42faba" },
  TAHSIS: { label: "Tahsis Edildi", color: "#00d4ff" },
  BITTI: { label: "Bitti", color: "#aab3c5" },
};

export const basvuruDurumMap: Record<string, { label: string; color: string }> = {
  YENI: { label: "Yeni", color: "#00d4ff" },
  ILETISIMDE: { label: "İletişimde", color: "#a8e8ff" },
  DONUSUM: { label: "Dönüşüm", color: "#42faba" },
  KAYIP: { label: "Kayıp", color: "#aab3c5" },
};

export const kaynakLabel: Record<string, string> = { NFC: "NFC", QR: "QR", LINK: "Link" };

export const trDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
