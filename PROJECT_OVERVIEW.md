# QONTAC.NET — Proje Dokümanı (Güncel Durum)

> Bu doküman, projede **fiilen yapılmış / uygulanmış** her şeyi tek yerde toplar ve
> değerlendirme için referans kaynağıdır. Tarih: 2026-07-15.
> Aşama bazlı ilerleme geçmişi için ayrıca [`PROJECT_PLAN.md`](PROJECT_PLAN.md).

---

## 1. Ürün Özeti

**QONTAC Network Card** — network marketing firmaları için **NFC + QR destekli dijital
kartvizit / üye tanıtım platformu**.

**Kullanıcı tipleri:**
- **Platform Admin** — tüm firmaları, lisansları, kart üretimini, siparişleri, gelir ve
  başvuruları yönetir.
- **Firma** — kendi üyelerini, kurumsal kart şablonunu, modüllerini, başvurularını yönetir.
- **Üye** — kendi profilini, kartını, modüllerini, QR/bağlantılarını yönetir.
- **Ziyaretçi (dış)** — kart okutunca açılan public dijital sayfayı görür, iletişim formu
  (lead) bırakır.

---

## 2. Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | **Next.js 16** (App Router) + React 19 |
| Dil | TypeScript 5 |
| Stil | Tailwind CSS v4 |
| Veritabanı | **PostgreSQL** + Prisma 7 (`@prisma/adapter-pg`, pg driver) |
| Auth | bcryptjs + JWT (jose) httpOnly cookie |
| E-posta | nodemailer (SMTP) |
| Zengin metin | CKEditor 5 |
| QR | qrcode.react |
| Excel | xlsx |
| Çeviri | Claude (Anthropic) API — doğrudan fetch |
| Dağıtım | Docker Compose (app + nginx + postgres), Cloudflare + Let's Encrypt TLS |
| CI/CD | GitHub Actions → sunucuya otomatik deploy |

> ⚠️ **Not (AGENTS.md):** Bu Next.js sürümünde kırıcı değişiklikler var; kod yazmadan önce
> `node_modules/next/dist/docs/` altındaki güncel rehber okunmalı.

---

## 3. Uygulanan Özellikler (Modül Modül)

### 3.1 Landing / Ana Sayfa
14+ bölüm: Hero (NFC kart + telefon mockup), ProblemSolution, HowItWorks, DigitalPage,
ForFirms, ForMembers, Features, Panels, UseCases, Products (Ürün Tanıtımı), Pricing,
DemoForm, FAQ, Header/Footer.
- Gold/altın varak tema (turkuazdan çevrildi).
- Premium NFC kart mockup'ı (çip + NFC + QR, QONTACNET wordmark).
- Ürün galerisi + tam ekran lightbox.
- Favicon ve site logo/metni admin panelinden yönetilir.

### 3.2 Kimlik Doğrulama (Auth)
- Gerçek auth: **bcrypt + JWT httpOnly cookie**, 3 rol (admin / firma / üye).
- `/api/auth/{login, register, logout, me}`.
- Kayıtta **KVKK / Kullanım Koşulları popup onayı**.
- **Şifremi unuttum / sıfırlama** akışı (üye) — `forgot-password` / `reset-password/[token]`,
  e-posta ile token.
- **Captcha**: admin girişinde basit matematik captcha, tüm girişlere uygulandı.
- Admin girişi **gizli** (yalnız doğrudan URL ile erişim); demo giriş butonları kaldırıldı.

### 3.3 Public Kart Sayfası — `/kart/[id]`
- Kart okutunca açılan dijital sayfa; unvan, biyografi, sosyal (WhatsApp/LinkedIn/Instagram/
  Website) görünürlük toggle'ları.
- **İletişim / "Tanış" modalı** → lead DB'ye yazılır + sayaç.
- Üye modülleri kartta **ikon buton + lightbox** olarak render edilir.
- Çok dilli: `?lang=` ile unvan/biyografi/modül başlık+içerik otomatik çevrilir.

### 3.4 Firma Paneli — `/firma/*`
Dashboard (özet metrikler), üye listesi + detay, kurumsal kart **şablon editörü**,
analitik (lead/tıklama), ayarlar (marka/profil), **modüller** (sıralama dahil),
**başvurular**, **ürün tanıtım**, özel **sayfa**. Tümü DB'den beslenir.

### 3.5 Üye Paneli — `/uye/*`
Dashboard, `kartim` (aktivasyon/durum), `profil` (iletişim/sosyal/referans + kart arkaplan
görseli yükleme), `qr` (QR paylaşım), `modullerim` (modül ekleme/doldurma),
`baglantilar`. Mobil uygulama görünümüne uyarlandı.

### 3.6 Platform Admin Paneli — `/admin/*`
Dashboard (firma sayısı, MRR, kart, sipariş, MRR grafiği, top firma), firmalar + detay,
**kartlar** (batch üretim/stok/tahsis), **siparişler** (+ e-posta), **lisanslar** (paket
yönetimi + firma eşleştirme), **gelir** (MRR chart, paket dağılımı), **başvurular** (+ not,
durum güncelleme), **ürünler**, **ürün tanıtım**, **üye modülleri kataloğu**, **sayfalar**
(özel/sözleşme sayfaları + çeviri), **ayarlar** (site logo/metin/favicon/iletişim/sosyal).

### 3.7 Üye Modülleri Sistemi
- Admin **katalog tanımlar** (`UyeModulTanim`), üye kendi kartına **ekler/doldurur**.
- Modül tipleri (`UyeModulTip`): URL/Link, Görsel, İletişim Formu (lead) vb.
- Kartta hazır **ikon galerisi + buton/ikon rengi seçimi**, görsel yükleme.
- URL/Link modülü popup'ta açılır (açıklama + buton adı + URL üyeden alınır).
- Firma seviyesinde de modüller (`FirmaModul`) — şablona bağlanabilir.

### 3.8 Çok Dilli (i18n) Sistem — 5 Dil
- **TR (kaynak), EN, AR (RTL), BG, RU**. Çerez tabanlı locale (`NEXT_LOCALE`), route taşımadan.
- Çeviri motoru: **Claude API** + `Translation` DB önbelleği; API yoksa TR fallback.
- Ana sayfa: 182 anahtar 4 dilde **hazır seed** (`homepage-seed.ts`) — API/DB gerektirmeden anında.
- Kart sayfası, sözleşme/özel sayfalar çok dilli (elle çeviri > otomatik).
- Bayraklı dil seçici (auth + kart + ana sayfa).
- **Kalan:** admin/firma/üye panel arayüz metinleri henüz çevrilmedi (iç kullanım, düşük öncelik).

### 3.9 Ödeme (QNB Finansbank Sanal POS)
- **PayFor altyapısı** (NestPay değil), **3DHost** modeli — `src/lib/qnbpos.ts`.
- Callback: `/api/odeme/callback`. Sipariş akışı `/api/siparis`.
- **Ayarlar panelinden yönetim:** Admin → Ayarlar → **Sanal POS Ayarları** bölümünden
  MerchantID, UserCode, Mağaza 3D Anahtarı (MerchantPass), MbrId ve aktif/test toggle'ları
  doldurulur (`SiteSettings` DB alanları, `/api/admin/sanal-pos`). Gizli anahtar tarayıcıya
  geri gönderilmez ("kayıtlı" göstergesi); boş bırakılınca mevcut korunur. Test/canlı seçimi
  gate URL'yi otomatik ayarlar. DB boşsa `QNB_*` env değişkenlerine düşer (geriye dönük uyumlu).
- **Durum:** Yapılandırma arayüzü hazır; kullanıcı QNB panelinden aldığı **Mağaza 3D
  anahtarını** bu bölüme girip "Sanal POS aktif"i açınca ödeme akışı devreye girer.

### 3.10 Mobil Uygulama + Push
- Ayrı repo: **Expo WebView sarmalayıcı** (`eas init` bekliyor).
- **Expo push bildirim altyapısı** eklendi — `PushToken` modeli, `/api/uye/push-token`.
- Üye paneli mobil uygulama görünümüne uyarlandı.

---

## 4. Veri Modeli (Prisma)

**Modeller (23):** Firma, FirmaModul, UyeModulTanim, MemberModul, FormBasvuru, Member,
PushToken, Admin, CardTemplate, Lead, License, CardBatch, PhysicalCard, Order, UrunTanitim,
SiteSettings, CustomPage, Product, Application, ApplicationNote, RevenueSnapshot, Translation.

**Enum'lar (8):** Paket, FirmaDurum, LeadKaynak, AdminRol, SiparisDurum, BatchDurum,
BasvuruDurum, FirmaModulTip, UyeModulTip.

**Migration sayısı:** 24 (init → `20260715120000_uye_modul_gorsel_form`).

**Seed:** 6 firma, 45 üye, 3 lisans, 5 batch, 6 sipariş, 5 başvuru, 12 gelir kaydı.

> ⚠️ Yerel dev DB driftli — migration'lar `migrate dev` yerine elle SQL + `migrate resolve
> --applied` (veya `db push`) ile yönetiliyor.

---

## 5. Dağıtım (Deployment)

- **Sunucu:** `root@157.180.121.96`, `/var/www/qontac`, Docker Compose (app + nginx + postgres).
- **nginx** reverse proxy → `app:3000`, Cloudflare real-IP, Let's Encrypt TLS.
- **Deploy (çalışan yöntem):** `main`'e push → GitHub Actions otomatik deploy
  (`.github/workflows/deploy.yml`). Elle deploy için tek satır SSH:
  ```
  ssh -i ~/.ssh/qontac_deploy root@157.180.121.96 'cd /var/www/qontac && git fetch origin && \
    git reset --hard origin/main && docker compose -f docker-compose.prod.yml build && \
    docker compose -f docker-compose.prod.yml up -d && \
    docker compose -f docker-compose.prod.yml up -d --force-recreate nginx'
  ```
- ⚠️ **nginx tuzağı:** app yeniden oluşturulunca eski IP cache'lenir → nginx **force-recreate**
  edilmeli (restart yetmez).
- **Migration prod'da:** `migrate` servisi her up'ta `prisma migrate deploy` (idempotent).
  Seed SADECE ilk kurulumda elle (deleteMany içerir!).
- **Env (sunucuda):** SMTP, DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY (çeviri için),
  QNB_* (Merchant Pass eksik). Postgres iç ağda, host'a kapalı.
- Doğrulama: `curl -so /dev/null -w "%{http_code}" https://qontac.net/`.

---

## 6. Bilinen Açık İşler / Riskler

| Öncelik | Konu |
|---|---|
| 🔴 Yüksek | **QNB Mağaza 3D anahtarı girilmeli** — artık Ayarlar → Sanal POS Ayarları'ndan doldurulur; girilip aktif edilene kadar ödeme açık değil. |
| 🟡 Orta | Mobil uygulama `eas init` + build/store süreci bekliyor. |
| 🟡 Orta | Admin/firma/üye panel arayüz metinleri henüz çevrilmedi (i18n eksik). |
| 🟡 Orta | Yerel dev DB drift'i — migration disiplini kırılgan (elle SQL). |
| 🟢 Düşük | `mock-data.ts` tamamen kaldırılmadı (3 tip importu kaldı). |
| 🟢 Düşük | Üye davet/aktivasyon akışı sınırlı (register ilk firmaya bağlıyor). |

---

## 7. Değerlendirme (Özet)

**Olgunluk:** Ürün **canlıda ve fonksiyonel** — 3 rollü paneller, gerçek DB persistence,
public kart, lead toplama, çok dilli ana sayfa/kart, e-posta ve mobil push altyapısı hazır.
123 commit'lik istikrarlı bir geliştirme geçmişi var.

**Tamamlanma tahmini:** Çekirdek platform ~%90. **Gelir kapısı (ödeme)** tek kritik blokaj —
QNB anahtarı girilene kadar satış/tahsilat otomasyonu kapalı. Mobil yayın ve panel i18n ise
tamamlayıcı işler.

**Öneri sırası:** (1) QNB Merchant Pass'i alıp ödemeyi uçtan uca test et → (2) mobil `eas init`
ve mağaza yayını → (3) panel arayüz i18n → (4) dev DB drift'ini temizleyip migration
disiplinini düzelt.
