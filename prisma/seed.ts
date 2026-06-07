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
