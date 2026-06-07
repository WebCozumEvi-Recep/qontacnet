export type UserRole = "uye" | "firma";

export interface Member {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon: string;
  unvan: string;
  departman: string;
  firmaId: string;
  firmaAdi: string;
  avatar: string;
  whatsapp: string;
  linkedin: string;
  instagram: string;
  website: string;
  biyografi: string;
  aktif: boolean;
  kartRenk: string;
  olusturmaTarihi: string;
  goruntulemeSayisi: number;
  leadSayisi: number;
}

export interface Firma {
  id: string;
  ad: string;
  email: string;
  telefon: string;
  adres: string;
  website: string;
  sektor: string;
  logo: string;
  temsilci: string;
  uyeSayisi: number;
  aktifKart: number;
  olusturmaTarihi: string;
  paket: "Başlangıç" | "Profesyonel" | "Kurumsal";
}

export interface Lead {
  id: string;
  ad: string;
  email: string;
  telefon: string;
  sirket: string;
  tarih: string;
  kaynak: "NFC" | "QR" | "Link";
  uyeId: string;
}

export interface CardTemplate {
  id: string;
  ad: string;
  renk: string;
  aktif: boolean;
}

export const mockFirma: Firma = {
  id: "firma-001",
  ad: "TechNet Türkiye A.Ş.",
  email: "admin@technet.com.tr",
  telefon: "+90 212 555 0100",
  adres: "Maslak Mah. Büyükdere Cad. No:123, Sarıyer/İstanbul",
  website: "https://technet.com.tr",
  sektor: "Teknoloji",
  logo: "",
  temsilci: "Ahmet Yılmaz",
  uyeSayisi: 47,
  aktifKart: 43,
  olusturmaTarihi: "2024-01-15",
  paket: "Profesyonel",
};

export const mockMembers: Member[] = [
  {
    id: "uye-001",
    ad: "Mehmet",
    soyad: "Kaya",
    email: "mehmet@technet.com.tr",
    telefon: "+90 532 111 2233",
    unvan: "Satış Müdürü",
    departman: "Satış",
    firmaId: "firma-001",
    firmaAdi: "TechNet Türkiye A.Ş.",
    avatar: "",
    whatsapp: "+90 532 111 2233",
    linkedin: "linkedin.com/in/mehmetkaya",
    instagram: "",
    website: "",
    biyografi: "10 yıllık satış deneyimiyle müşteri memnuniyetini ön planda tutuyorum.",
    aktif: true,
    kartRenk: "#00d4ff",
    olusturmaTarihi: "2024-02-01",
    goruntulemeSayisi: 248,
    leadSayisi: 32,
  },
  {
    id: "uye-002",
    ad: "Zeynep",
    soyad: "Arslan",
    email: "zeynep@technet.com.tr",
    telefon: "+90 535 222 3344",
    unvan: "Pazarlama Uzmanı",
    departman: "Pazarlama",
    firmaId: "firma-001",
    firmaAdi: "TechNet Türkiye A.Ş.",
    avatar: "",
    whatsapp: "+90 535 222 3344",
    linkedin: "linkedin.com/in/zeyneparslan",
    instagram: "@zeynep.arslan",
    website: "",
    biyografi: "Dijital pazarlama ve marka stratejisi konusunda uzmanlaşmış bir profesyonel.",
    aktif: true,
    kartRenk: "#6001d1",
    olusturmaTarihi: "2024-02-10",
    goruntulemeSayisi: 189,
    leadSayisi: 21,
  },
  {
    id: "uye-003",
    ad: "Ali",
    soyad: "Demir",
    email: "ali@technet.com.tr",
    telefon: "+90 541 333 4455",
    unvan: "Yazılım Geliştirici",
    departman: "Teknoloji",
    firmaId: "firma-001",
    firmaAdi: "TechNet Türkiye A.Ş.",
    avatar: "",
    whatsapp: "",
    linkedin: "linkedin.com/in/alidemir",
    instagram: "",
    website: "alidemir.dev",
    biyografi: "Full-stack geliştirici. React, Node.js ve cloud teknolojileri.",
    aktif: true,
    kartRenk: "#42faba",
    olusturmaTarihi: "2024-03-05",
    goruntulemeSayisi: 92,
    leadSayisi: 8,
  },
  {
    id: "uye-004",
    ad: "Elif",
    soyad: "Şahin",
    email: "elif@technet.com.tr",
    telefon: "+90 544 444 5566",
    unvan: "İnsan Kaynakları Uzmanı",
    departman: "İnsan Kaynakları",
    firmaId: "firma-001",
    firmaAdi: "TechNet Türkiye A.Ş.",
    avatar: "",
    whatsapp: "+90 544 444 5566",
    linkedin: "linkedin.com/in/elifsahin",
    instagram: "",
    website: "",
    biyografi: "Yetenek yönetimi ve işe alım süreçlerinde 7 yıllık deneyim.",
    aktif: false,
    kartRenk: "#00d4ff",
    olusturmaTarihi: "2024-03-20",
    goruntulemeSayisi: 45,
    leadSayisi: 3,
  },
  {
    id: "uye-005",
    ad: "Can",
    soyad: "Yıldız",
    email: "can@technet.com.tr",
    telefon: "+90 546 555 6677",
    unvan: "Ürün Müdürü",
    departman: "Ürün",
    firmaId: "firma-001",
    firmaAdi: "TechNet Türkiye A.Ş.",
    avatar: "",
    whatsapp: "+90 546 555 6677",
    linkedin: "linkedin.com/in/canyildiz",
    instagram: "@can.yildiz.pm",
    website: "",
    biyografi: "Ürün stratejisi ve kullanıcı deneyimi odaklı ürün yöneticisi.",
    aktif: true,
    kartRenk: "#00d4ff",
    olusturmaTarihi: "2024-04-01",
    goruntulemeSayisi: 167,
    leadSayisi: 19,
  },
];

export const mockLeads: Lead[] = [
  { id: "l-001", ad: "Serkan Öztürk", email: "serkan@example.com", telefon: "+90 532 000 1111", sirket: "Öztürk Holding", tarih: "2024-12-01", kaynak: "NFC", uyeId: "uye-001" },
  { id: "l-002", ad: "Burcu Çelik", email: "burcu@example.com", telefon: "+90 535 000 2222", sirket: "Çelik İnşaat", tarih: "2024-12-03", kaynak: "QR", uyeId: "uye-001" },
  { id: "l-003", ad: "Murat Yılmaz", email: "murat@example.com", telefon: "+90 541 000 3333", sirket: "Yılmaz Tekstil", tarih: "2024-12-05", kaynak: "NFC", uyeId: "uye-001" },
  { id: "l-004", ad: "Ayşe Kara", email: "ayse@example.com", telefon: "", sirket: "Kara Gıda", tarih: "2024-12-08", kaynak: "Link", uyeId: "uye-001" },
  { id: "l-005", ad: "Hasan Doğan", email: "hasan@example.com", telefon: "+90 544 000 4444", sirket: "Doğan Lojistik", tarih: "2024-12-10", kaynak: "NFC", uyeId: "uye-001" },
];

export const mockCardTemplates: CardTemplate[] = [
  { id: "t-001", ad: "Cyber Blue", renk: "#00d4ff", aktif: true },
  { id: "t-002", ad: "Neon Purple", renk: "#6001d1", aktif: true },
  { id: "t-003", ad: "Mint Green", renk: "#42faba", aktif: false },
];

export const weeklyViews = [42, 68, 55, 89, 76, 110, 95];
export const monthlyLeads = [8, 12, 9, 15, 21, 18, 24, 19, 28, 22, 32, 27];

// ============================================================
// PLATFORM ADMIN — TYPES & MOCK DATA
// ============================================================

export type FirmaDurum = "aktif" | "deneme" | "askida" | "iptal";
export type SiparisDurum = "hazirlaniyor" | "uretimde" | "kargoda" | "teslim" | "iptal";
export type BatchDurum = "uretimde" | "stokta" | "tahsis" | "bitti";
export type BasvuruDurum = "yeni" | "iletisimde" | "donusum" | "kayip";

export interface AdminFirma {
  id: string;
  ad: string;
  email: string;
  telefon: string;
  sektor: string;
  temsilci: string;
  uyeSayisi: number;
  aktifKart: number;
  paket: "Başlangıç" | "Profesyonel" | "Kurumsal";
  paketBaslangic: string;
  paketBitis: string;
  mrr: number;
  durum: FirmaDurum;
  olusturmaTarihi: string;
}

export interface CardBatch {
  id: string;
  kod: string;
  miktar: number;
  uretici: string;
  uretimTarihi: string;
  durum: BatchDurum;
  tahsisFirma?: string;
  seriPrefix: string;
}

export interface Order {
  id: string;
  siparisNo: string;
  firma: string;
  firmaId: string;
  urun: string;
  adet: number;
  tutar: number;
  durum: SiparisDurum;
  tarih: string;
  kargoNo?: string;
}

export interface License {
  id: string;
  ad: "Başlangıç" | "Profesyonel" | "Kurumsal";
  aylikFiyat: number;
  yillikFiyat: number;
  maxUye: number | "sinirsiz";
  maxTemplate: number | "sinirsiz";
  ozellikler: string[];
  aktifFirmaSayisi: number;
  renk: string;
}

export interface RevenueEntry {
  ay: string;
  mrr: number;
  yeniFirma: number;
  iptal: number;
}

export interface Application {
  id: string;
  firmaAdi: string;
  yetkili: string;
  email: string;
  telefon: string;
  uyeSayisi: string;
  mesaj: string;
  durum: BasvuruDurum;
  tarih: string;
}

export const mockAdminFirmalar: AdminFirma[] = [
  { id: "firma-001", ad: "TechNet Türkiye A.Ş.", email: "admin@technet.com.tr", telefon: "+90 212 555 0100", sektor: "Teknoloji", temsilci: "Ahmet Yılmaz", uyeSayisi: 47, aktifKart: 43, paket: "Profesyonel", paketBaslangic: "2024-01-15", paketBitis: "2025-01-15", mrr: 4990, durum: "aktif", olusturmaTarihi: "2024-01-15" },
  { id: "firma-002", ad: "GlobalWell Sağlık", email: "info@globalwell.com.tr", telefon: "+90 216 444 0220", sektor: "Sağlık & Kozmetik", temsilci: "Selin Aydın", uyeSayisi: 128, aktifKart: 119, paket: "Kurumsal", paketBaslangic: "2024-02-01", paketBitis: "2025-02-01", mrr: 12990, durum: "aktif", olusturmaTarihi: "2024-02-01" },
  { id: "firma-003", ad: "VitaForce Network", email: "destek@vitaforce.com", telefon: "+90 232 333 0011", sektor: "Wellness", temsilci: "Mert Kılıç", uyeSayisi: 24, aktifKart: 18, paket: "Başlangıç", paketBaslangic: "2024-09-10", paketBitis: "2025-09-10", mrr: 1490, durum: "aktif", olusturmaTarihi: "2024-09-10" },
  { id: "firma-004", ad: "PrimeHome Ürünleri", email: "iletisim@primehome.com.tr", telefon: "+90 224 222 4488", sektor: "Ev & Yaşam", temsilci: "Burak Şenel", uyeSayisi: 9, aktifKart: 3, paket: "Başlangıç", paketBaslangic: "2024-11-20", paketBitis: "2024-12-20", mrr: 0, durum: "deneme", olusturmaTarihi: "2024-11-20" },
  { id: "firma-005", ad: "NeoBeauty Network", email: "info@neobeauty.com", telefon: "+90 312 777 1010", sektor: "Kozmetik", temsilci: "Damla Acar", uyeSayisi: 56, aktifKart: 49, paket: "Profesyonel", paketBaslangic: "2024-03-05", paketBitis: "2025-03-05", mrr: 4990, durum: "aktif", olusturmaTarihi: "2024-03-05" },
  { id: "firma-006", ad: "EnerjiPlus Direct", email: "merkez@enerjiplus.com", telefon: "+90 242 888 1212", sektor: "Beslenme", temsilci: "Onur Bilgin", uyeSayisi: 12, aktifKart: 7, paket: "Başlangıç", paketBaslangic: "2024-06-01", paketBitis: "2024-12-01", mrr: 0, durum: "askida", olusturmaTarihi: "2024-06-01" },
];

export const mockCardBatches: CardBatch[] = [
  { id: "b-001", kod: "QNC-B2410-001", miktar: 1000, uretici: "NFC Solutions Ltd.", uretimTarihi: "2024-10-08", durum: "stokta", seriPrefix: "QNC-2410" },
  { id: "b-002", kod: "QNC-B2411-002", miktar: 500, uretici: "NFC Solutions Ltd.", uretimTarihi: "2024-11-12", durum: "tahsis", tahsisFirma: "GlobalWell Sağlık", seriPrefix: "QNC-2411" },
  { id: "b-003", kod: "QNC-B2411-003", miktar: 250, uretici: "ChipCraft", uretimTarihi: "2024-11-25", durum: "tahsis", tahsisFirma: "TechNet Türkiye A.Ş.", seriPrefix: "QNC-2411B" },
  { id: "b-004", kod: "QNC-B2412-004", miktar: 2000, uretici: "NFC Solutions Ltd.", uretimTarihi: "2024-12-02", durum: "uretimde", seriPrefix: "QNC-2412" },
  { id: "b-005", kod: "QNC-B2409-005", miktar: 100, uretici: "ChipCraft", uretimTarihi: "2024-09-15", durum: "bitti", tahsisFirma: "NeoBeauty Network", seriPrefix: "QNC-2409" },
];

export const mockOrders: Order[] = [
  { id: "o-001", siparisNo: "SIP-2024-1201", firma: "GlobalWell Sağlık", firmaId: "firma-002", urun: "NFC Kart (Standart)", adet: 100, tutar: 8500, durum: "kargoda", tarih: "2024-12-01", kargoNo: "TRK1029847" },
  { id: "o-002", siparisNo: "SIP-2024-1202", firma: "TechNet Türkiye A.Ş.", firmaId: "firma-001", urun: "NFC Kart (Metalik)", adet: 50, tutar: 7000, durum: "uretimde", tarih: "2024-12-03" },
  { id: "o-003", siparisNo: "SIP-2024-1203", firma: "NeoBeauty Network", firmaId: "firma-005", urun: "NFC Kart (Standart)", adet: 30, tutar: 2550, durum: "teslim", tarih: "2024-11-28", kargoNo: "TRK1028721" },
  { id: "o-004", siparisNo: "SIP-2024-1204", firma: "VitaForce Network", firmaId: "firma-003", urun: "NFC Kart (Premium)", adet: 25, tutar: 3750, durum: "hazirlaniyor", tarih: "2024-12-05" },
  { id: "o-005", siparisNo: "SIP-2024-1205", firma: "GlobalWell Sağlık", firmaId: "firma-002", urun: "NFC Kart (Standart)", adet: 200, tutar: 17000, durum: "teslim", tarih: "2024-10-12", kargoNo: "TRK1015632" },
  { id: "o-006", siparisNo: "SIP-2024-1206", firma: "PrimeHome Ürünleri", firmaId: "firma-004", urun: "NFC Kart (Standart)", adet: 10, tutar: 850, durum: "iptal", tarih: "2024-11-30" },
];

export const mockLicenses: License[] = [
  {
    id: "lic-basic",
    ad: "Başlangıç",
    aylikFiyat: 1490,
    yillikFiyat: 14900,
    maxUye: 50,
    maxTemplate: 1,
    ozellikler: ["Firma template", "NFC + QR aktivasyonu", "Üye profilleri", "Temel istatistik", "Standart destek"],
    aktifFirmaSayisi: 2,
    renk: "#a8e8ff",
  },
  {
    id: "lic-pro",
    ad: "Profesyonel",
    aylikFiyat: 4990,
    yillikFiyat: 49900,
    maxUye: 500,
    maxTemplate: 3,
    ozellikler: ["Tüm başlangıç özellikleri", "Lead formları", "Kampanya yönetimi", "Ürün alanları", "Gelişmiş raporlar", "Firma paneli"],
    aktifFirmaSayisi: 2,
    renk: "#00d4ff",
  },
  {
    id: "lic-ent",
    ad: "Kurumsal",
    aylikFiyat: 12990,
    yillikFiyat: 129900,
    maxUye: "sinirsiz",
    maxTemplate: "sinirsiz",
    ozellikler: ["Özel domain", "Özel template tasarımı", "API entegrasyonları", "Toplu kart yönetimi", "Gelişmiş yetkilendirme", "Kurumsal destek"],
    aktifFirmaSayisi: 1,
    renk: "#6001d1",
  },
];

export const mockRevenue: RevenueEntry[] = [
  { ay: "Oca", mrr: 8470, yeniFirma: 1, iptal: 0 },
  { ay: "Şub", mrr: 21460, yeniFirma: 1, iptal: 0 },
  { ay: "Mar", mrr: 26450, yeniFirma: 1, iptal: 0 },
  { ay: "Nis", mrr: 26450, yeniFirma: 0, iptal: 0 },
  { ay: "May", mrr: 26450, yeniFirma: 0, iptal: 0 },
  { ay: "Haz", mrr: 27940, yeniFirma: 1, iptal: 0 },
  { ay: "Tem", mrr: 27940, yeniFirma: 0, iptal: 0 },
  { ay: "Ağu", mrr: 27940, yeniFirma: 0, iptal: 0 },
  { ay: "Eyl", mrr: 29430, yeniFirma: 1, iptal: 0 },
  { ay: "Eki", mrr: 29430, yeniFirma: 0, iptal: 0 },
  { ay: "Kas", mrr: 29430, yeniFirma: 1, iptal: 1 },
  { ay: "Ara", mrr: 24460, yeniFirma: 0, iptal: 1 },
];

export const mockApplications: Application[] = [
  { id: "ap-001", firmaAdi: "NaturaLife Ürünleri", yetkili: "Cem Karakaş", email: "cem@naturalife.com.tr", telefon: "+90 532 444 1100", uyeSayisi: "100-500", mesaj: "200 kişilik ekibimize NFC kart yapısı kurmak istiyoruz.", durum: "yeni", tarih: "2024-12-06" },
  { id: "ap-002", firmaAdi: "FitWave Türkiye", yetkili: "Ezgi Tan", email: "ezgi@fitwave.com", telefon: "+90 535 222 5566", uyeSayisi: "0-100", mesaj: "Yeni temsilci ağımız için dijital kartvizit altyapısı arıyoruz.", durum: "iletisimde", tarih: "2024-12-04" },
  { id: "ap-003", firmaAdi: "HomeGlow Network", yetkili: "Berk Ulusoy", email: "berk@homeglow.com", telefon: "+90 541 999 1010", uyeSayisi: "500+", mesaj: "Mevcut dijital kartvizit sağlayıcımızdan geçiş planlıyoruz.", durum: "donusum", tarih: "2024-12-02" },
  { id: "ap-004", firmaAdi: "GreenSlim Beslenme", yetkili: "Pınar Yıldırım", email: "pinar@greenslim.com.tr", telefon: "+90 544 333 2211", uyeSayisi: "0-100", mesaj: "Demo görmek istiyoruz.", durum: "yeni", tarih: "2024-12-07" },
  { id: "ap-005", firmaAdi: "TrendDirect", yetkili: "Hakan Ergin", email: "hakan@trenddirect.com", telefon: "+90 532 777 8899", uyeSayisi: "100-500", mesaj: "Bütçemiz net değil, önce paket detaylarını öğrenmek istiyoruz.", durum: "kayip", tarih: "2024-11-20" },
];
