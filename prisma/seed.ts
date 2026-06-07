import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  console.log("Eski kayıtlar temizleniyor...");
  await prisma.lead.deleteMany();
  await prisma.cardTemplate.deleteMany();
  await prisma.member.deleteMany();
  await prisma.firma.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.license.deleteMany();
  await prisma.cardBatch.deleteMany();
  await prisma.order.deleteMany();
  await prisma.application.deleteMany();
  await prisma.revenueSnapshot.deleteMany();

  // --- Admin ---
  await prisma.admin.create({
    data: {
      ad: "QONTAC Operasyon",
      email: "admin@qontac.net",
      passwordHash: hash("qontac123"),
      rol: "SUPER_ADMIN",
    },
  });

  // --- Firma (demo login: firma@qontac.net / 123456) ---
  const firma = await prisma.firma.create({
    data: {
      ad: "TechNet Türkiye A.Ş.",
      email: "firma@qontac.net",
      passwordHash: hash("123456"),
      telefon: "+90 212 555 0100",
      adres: "Maslak Mah. Büyükdere Cad. No:123, Sarıyer/İstanbul",
      website: "https://technet.com.tr",
      sektor: "Teknoloji",
      temsilci: "Ahmet Yılmaz",
      paket: "PROFESYONEL",
      durum: "AKTIF",
      paketBitis: new Date("2025-01-15"),
      mrr: 4990,
    },
  });

  // --- Şablonlar ---
  await prisma.cardTemplate.createMany({
    data: [
      { firmaId: firma.id, ad: "Cyber Blue", renk: "#00d4ff", aktif: true },
      { firmaId: firma.id, ad: "Neon Purple", renk: "#6001d1", aktif: true },
      { firmaId: firma.id, ad: "Mint Green", renk: "#42faba", aktif: false },
    ],
  });

  // --- Üyeler (demo login: demo@qontac.net / 123456 = Mehmet) ---
  const members = [
    {
      email: "demo@qontac.net", ad: "Mehmet", soyad: "Kaya", unvan: "Satış Müdürü", departman: "Satış",
      telefon: "+90 532 111 2233", whatsapp: "+90 532 111 2233", linkedin: "linkedin.com/in/mehmetkaya",
      instagram: "", website: "", biyografi: "10 yıllık satış deneyimiyle müşteri memnuniyetini ön planda tutuyorum.",
      kartRenk: "#00d4ff", aktif: true, goruntulemeSayisi: 248, leadSayisi: 32,
    },
    {
      email: "zeynep@technet.com.tr", ad: "Zeynep", soyad: "Arslan", unvan: "Pazarlama Uzmanı", departman: "Pazarlama",
      telefon: "+90 535 222 3344", whatsapp: "+90 535 222 3344", linkedin: "linkedin.com/in/zeyneparslan",
      instagram: "@zeynep.arslan", website: "", biyografi: "Dijital pazarlama ve marka stratejisi konusunda uzmanlaşmış bir profesyonel.",
      kartRenk: "#6001d1", aktif: true, goruntulemeSayisi: 189, leadSayisi: 21,
    },
    {
      email: "ali@technet.com.tr", ad: "Ali", soyad: "Demir", unvan: "Yazılım Geliştirici", departman: "Teknoloji",
      telefon: "+90 541 333 4455", whatsapp: "", linkedin: "linkedin.com/in/alidemir",
      instagram: "", website: "alidemir.dev", biyografi: "Full-stack geliştirici. React, Node.js ve cloud teknolojileri.",
      kartRenk: "#42faba", aktif: true, goruntulemeSayisi: 92, leadSayisi: 8,
    },
    {
      email: "elif@technet.com.tr", ad: "Elif", soyad: "Şahin", unvan: "İnsan Kaynakları Uzmanı", departman: "İnsan Kaynakları",
      telefon: "+90 544 444 5566", whatsapp: "+90 544 444 5566", linkedin: "linkedin.com/in/elifsahin",
      instagram: "", website: "", biyografi: "Yetenek yönetimi ve işe alım süreçlerinde 7 yıllık deneyim.",
      kartRenk: "#00d4ff", aktif: false, goruntulemeSayisi: 45, leadSayisi: 3,
    },
    {
      email: "can@technet.com.tr", ad: "Can", soyad: "Yıldız", unvan: "Ürün Müdürü", departman: "Ürün",
      telefon: "+90 546 555 6677", whatsapp: "+90 546 555 6677", linkedin: "linkedin.com/in/canyildiz",
      instagram: "@can.yildiz.pm", website: "", biyografi: "Ürün stratejisi ve kullanıcı deneyimi odaklı ürün yöneticisi.",
      kartRenk: "#00d4ff", aktif: true, goruntulemeSayisi: 167, leadSayisi: 19,
    },
  ];

  const createdMembers = [];
  for (const m of members) {
    const created = await prisma.member.create({
      data: {
        firmaId: firma.id,
        passwordHash: hash("123456"),
        ...m,
        // boş alanların toggle'ı kapalı başlasın
        showInstagram: !!m.instagram,
        showWebsite: !!m.website,
        showWhatsapp: !!m.whatsapp,
        showLinkedin: !!m.linkedin,
        showBio: !!m.biyografi,
      },
    });
    createdMembers.push(created);
  }

  // --- Lead'ler (Mehmet'e) ---
  const mehmet = createdMembers[0];
  await prisma.lead.createMany({
    data: [
      { memberId: mehmet.id, ad: "Serkan Öztürk", email: "serkan@example.com", telefon: "+90 532 000 1111", sirket: "Öztürk Holding", kaynak: "NFC" },
      { memberId: mehmet.id, ad: "Burcu Çelik", email: "burcu@example.com", telefon: "+90 535 000 2222", sirket: "Çelik İnşaat", kaynak: "QR" },
      { memberId: mehmet.id, ad: "Murat Yılmaz", email: "murat@example.com", telefon: "+90 541 000 3333", sirket: "Yılmaz Tekstil", kaynak: "NFC" },
      { memberId: mehmet.id, ad: "Ayşe Kara", email: "ayse@example.com", telefon: "", sirket: "Kara Gıda", kaynak: "LINK" },
      { memberId: mehmet.id, ad: "Hasan Doğan", email: "hasan@example.com", telefon: "+90 544 000 4444", sirket: "Doğan Lojistik", kaynak: "NFC" },
    ],
  });

  // --- Ek firmalar (admin paneli görünümü) ---
  const digerFirmalar = [
    { ad: "GlobalWell Sağlık", email: "info@globalwell.com.tr", telefon: "+90 216 444 0220", sektor: "Sağlık & Kozmetik", temsilci: "Selin Aydın", paket: "KURUMSAL" as const, durum: "AKTIF" as const, mrr: 12990, paketBitis: new Date("2025-02-01") },
    { ad: "VitaForce Network", email: "destek@vitaforce.com", telefon: "+90 232 333 0011", sektor: "Wellness", temsilci: "Mert Kılıç", paket: "BASLANGIC" as const, durum: "AKTIF" as const, mrr: 1490, paketBitis: new Date("2025-09-10") },
    { ad: "PrimeHome Ürünleri", email: "iletisim@primehome.com.tr", telefon: "+90 224 222 4488", sektor: "Ev & Yaşam", temsilci: "Burak Şenel", paket: "BASLANGIC" as const, durum: "DENEME" as const, mrr: 0, paketBitis: new Date("2024-12-20") },
    { ad: "NeoBeauty Network", email: "info@neobeauty.com", telefon: "+90 312 777 1010", sektor: "Kozmetik", temsilci: "Damla Acar", paket: "PROFESYONEL" as const, durum: "AKTIF" as const, mrr: 4990, paketBitis: new Date("2025-03-05") },
    { ad: "EnerjiPlus Direct", email: "merkez@enerjiplus.com", telefon: "+90 242 888 1212", sektor: "Beslenme", temsilci: "Onur Bilgin", paket: "BASLANGIC" as const, durum: "ASKIDA" as const, mrr: 0, paketBitis: new Date("2024-12-01") },
  ];
  // Bu firmalara temsilci üye sayıları (gerçekçi görünüm için)
  const uyeSayilari = [128, 24, 9, 56, 12];
  for (let i = 0; i < digerFirmalar.length; i++) {
    const f = digerFirmalar[i];
    const created = await prisma.firma.create({ data: { ...f, passwordHash: hash("123456") } });
    // her firmaya birkaç placeholder üye (admin üye sayısı için)
    const adet = Math.min(uyeSayilari[i], 8); // demo için sınırlı
    for (let j = 0; j < adet; j++) {
      await prisma.member.create({
        data: {
          firmaId: created.id,
          ad: `Üye${j + 1}`,
          soyad: created.ad.split(" ")[0],
          email: `uye${j + 1}.${created.email}`,
          passwordHash: hash("123456"),
          aktif: j % 4 !== 0,
        },
      });
    }
  }

  // --- Lisanslar ---
  await prisma.license.createMany({
    data: [
      { ad: "BASLANGIC", aylikFiyat: 1490, yillikFiyat: 14900, maxUye: 50, maxTemplate: 1, renk: "#a8e8ff", ozellikler: ["Firma template", "NFC + QR aktivasyonu", "Üye profilleri", "Temel istatistik", "Standart destek"] },
      { ad: "PROFESYONEL", aylikFiyat: 4990, yillikFiyat: 49900, maxUye: 500, maxTemplate: 3, renk: "#00d4ff", ozellikler: ["Tüm başlangıç özellikleri", "Lead formları", "Kampanya yönetimi", "Ürün alanları", "Gelişmiş raporlar", "Firma paneli"] },
      { ad: "KURUMSAL", aylikFiyat: 12990, yillikFiyat: 129900, maxUye: -1, maxTemplate: -1, renk: "#6001d1", ozellikler: ["Özel domain", "Özel template tasarımı", "API entegrasyonları", "Toplu kart yönetimi", "Gelişmiş yetkilendirme", "Kurumsal destek"] },
    ],
  });

  // --- Kart partileri ---
  await prisma.cardBatch.createMany({
    data: [
      { kod: "QNC-B2410-001", miktar: 1000, uretici: "NFC Solutions Ltd.", uretimTarihi: new Date("2024-10-08"), durum: "STOKTA", seriPrefix: "QNC-2410" },
      { kod: "QNC-B2411-002", miktar: 500, uretici: "NFC Solutions Ltd.", uretimTarihi: new Date("2024-11-12"), durum: "TAHSIS", tahsisFirma: "GlobalWell Sağlık", seriPrefix: "QNC-2411" },
      { kod: "QNC-B2411-003", miktar: 250, uretici: "ChipCraft", uretimTarihi: new Date("2024-11-25"), durum: "TAHSIS", tahsisFirma: "TechNet Türkiye A.Ş.", seriPrefix: "QNC-2411B" },
      { kod: "QNC-B2412-004", miktar: 2000, uretici: "NFC Solutions Ltd.", uretimTarihi: new Date("2024-12-02"), durum: "URETIMDE", seriPrefix: "QNC-2412" },
      { kod: "QNC-B2409-005", miktar: 100, uretici: "ChipCraft", uretimTarihi: new Date("2024-09-15"), durum: "BITTI", tahsisFirma: "NeoBeauty Network", seriPrefix: "QNC-2409" },
    ],
  });

  // --- Siparişler ---
  await prisma.order.createMany({
    data: [
      { siparisNo: "SIP-2024-1201", firma: "GlobalWell Sağlık", urun: "NFC Kart (Standart)", adet: 100, tutar: 8500, durum: "KARGODA", kargoNo: "TRK1029847", createdAt: new Date("2024-12-01") },
      { siparisNo: "SIP-2024-1202", firma: "TechNet Türkiye A.Ş.", urun: "NFC Kart (Metalik)", adet: 50, tutar: 7000, durum: "URETIMDE", createdAt: new Date("2024-12-03") },
      { siparisNo: "SIP-2024-1203", firma: "NeoBeauty Network", urun: "NFC Kart (Standart)", adet: 30, tutar: 2550, durum: "TESLIM", kargoNo: "TRK1028721", createdAt: new Date("2024-11-28") },
      { siparisNo: "SIP-2024-1204", firma: "VitaForce Network", urun: "NFC Kart (Premium)", adet: 25, tutar: 3750, durum: "HAZIRLANIYOR", createdAt: new Date("2024-12-05") },
      { siparisNo: "SIP-2024-1205", firma: "GlobalWell Sağlık", urun: "NFC Kart (Standart)", adet: 200, tutar: 17000, durum: "TESLIM", kargoNo: "TRK1015632", createdAt: new Date("2024-10-12") },
      { siparisNo: "SIP-2024-1206", firma: "PrimeHome Ürünleri", urun: "NFC Kart (Standart)", adet: 10, tutar: 850, durum: "IPTAL", createdAt: new Date("2024-11-30") },
    ],
  });

  // --- Başvurular ---
  await prisma.application.createMany({
    data: [
      { firmaAdi: "NaturaLife Ürünleri", yetkili: "Cem Karakaş", email: "cem@naturalife.com.tr", telefon: "+90 532 444 1100", uyeSayisi: "100-500", mesaj: "200 kişilik ekibimize NFC kart yapısı kurmak istiyoruz.", durum: "YENI", createdAt: new Date("2024-12-06") },
      { firmaAdi: "FitWave Türkiye", yetkili: "Ezgi Tan", email: "ezgi@fitwave.com", telefon: "+90 535 222 5566", uyeSayisi: "0-100", mesaj: "Yeni temsilci ağımız için dijital kartvizit altyapısı arıyoruz.", durum: "ILETISIMDE", createdAt: new Date("2024-12-04") },
      { firmaAdi: "HomeGlow Network", yetkili: "Berk Ulusoy", email: "berk@homeglow.com", telefon: "+90 541 999 1010", uyeSayisi: "500+", mesaj: "Mevcut dijital kartvizit sağlayıcımızdan geçiş planlıyoruz.", durum: "DONUSUM", createdAt: new Date("2024-12-02") },
      { firmaAdi: "GreenSlim Beslenme", yetkili: "Pınar Yıldırım", email: "pinar@greenslim.com.tr", telefon: "+90 544 333 2211", uyeSayisi: "0-100", mesaj: "Demo görmek istiyoruz.", durum: "YENI", createdAt: new Date("2024-12-07") },
      { firmaAdi: "TrendDirect", yetkili: "Hakan Ergin", email: "hakan@trenddirect.com", telefon: "+90 532 777 8899", uyeSayisi: "100-500", mesaj: "Bütçemiz net değil, önce paket detaylarını öğrenmek istiyoruz.", durum: "KAYIP", createdAt: new Date("2024-11-20") },
    ],
  });

  // --- Gelir geçmişi ---
  const revenue = [
    { ay: "Oca", mrr: 8470, yeniFirma: 1, iptal: 0 }, { ay: "Şub", mrr: 21460, yeniFirma: 1, iptal: 0 },
    { ay: "Mar", mrr: 26450, yeniFirma: 1, iptal: 0 }, { ay: "Nis", mrr: 26450, yeniFirma: 0, iptal: 0 },
    { ay: "May", mrr: 26450, yeniFirma: 0, iptal: 0 }, { ay: "Haz", mrr: 27940, yeniFirma: 1, iptal: 0 },
    { ay: "Tem", mrr: 27940, yeniFirma: 0, iptal: 0 }, { ay: "Ağu", mrr: 27940, yeniFirma: 0, iptal: 0 },
    { ay: "Eyl", mrr: 29430, yeniFirma: 1, iptal: 0 }, { ay: "Eki", mrr: 29430, yeniFirma: 0, iptal: 0 },
    { ay: "Kas", mrr: 29430, yeniFirma: 1, iptal: 1 }, { ay: "Ara", mrr: 24460, yeniFirma: 0, iptal: 1 },
  ];
  await prisma.revenueSnapshot.createMany({
    data: revenue.map((r, i) => ({ sira: i, ...r })),
  });

  console.log("✓ Seed tamamlandı:");
  console.log(`  Admin: admin@qontac.net / qontac123`);
  console.log(`  Firma: firma@qontac.net / 123456 (${firma.ad})`);
  console.log(`  Üye:   demo@qontac.net / 123456 (Mehmet Kaya, id=${mehmet.id})`);
  console.log(`  Toplam ${createdMembers.length} üye, 3 şablon, 5 lead`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
