# QONTAC.NET — Proje Planı

> Bu dosya bağlam kopmasın diye tutulur. Her aşama tamamlandığında işaretle ve notlar ekle.
> Stack: Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript. Mock data: `src/lib/mock-data.ts`. Auth context: `src/lib/auth-context.tsx`.

---

## Ürün Özeti
QONTAC Network Card — network marketing firmaları için NFC + QR destekli dijital kartvizit / üye tanıtım platformu.
3 ana kullanıcı tipi: **Platform Admin**, **Firma**, **Üye**. Dış kullanıcı: kart okutan ziyaretçi (public kart sayfası).

---

## AŞAMA 1 — Landing Page ✅ TAMAMLANDI

Bileşenler `src/components/` altında, `src/app/page.tsx` üzerinde compose edildi.

- [x] Header / Footer (shared)
- [x] Hero (NFC kart + telefon mockup)
- [x] ProblemSolution
- [x] HowItWorks (3 adım)
- [x] DigitalPage (kart okutunca açılan sayfa önizleme)
- [x] ForFirms (6 fayda kartı)
- [x] ForMembers
- [x] Features (grid)
- [x] Panels (3 panel tanıtımı)
- [x] UseCases
- [x] Pricing (3 paket — Teklif Al)
- [x] DemoForm
- [x] FAQ
- [x] UI primitives: GlassCard, GradientButton, SectionTitle, PhoneMockup, NFCCardMockup

---

## AŞAMA 2 — Auth & Public Kart Sayfası ✅ TAMAMLANDI

- [x] `/auth/login` — giriş (rol seçimli: üye / firma)
- [x] `/auth/register` — kayıt
- [x] `/kart/[id]` — kart okutunca açılan public dijital sayfa
- [x] `src/lib/auth-context.tsx` — auth state
- [x] `src/lib/mock-data.ts` — mock veri

---

## AŞAMA 3 — Firma Paneli ✅ TAMAMLANDI

`src/app/firma/` + paylaşılan `src/components/dashboard/` (DashboardTopBar, DashboardSidebar).

- [x] `/firma` — dashboard ana (özet metrikler)
- [x] `/firma/uyeler` — üye listesi
- [x] `/firma/uyeler/[id]` — üye detay
- [x] `/firma/template` — kurumsal kartvizit template editörü
- [x] `/firma/analitik` — lead / tıklama raporları
- [x] `/firma/ayarlar` — firma profili / marka ayarları

---

## AŞAMA 4 — Üye Paneli ✅ TAMAMLANDI

`src/app/uye/` — sidebar/topbar firma paneliyle paylaşılıyor.

- [x] `/uye` — dashboard ana
- [x] `/uye/kartim` — kart aktivasyon / durumu
- [x] `/uye/profil` — profil düzenleme (iletişim, sosyal, referans)
- [x] `/uye/qr` — QR paylaşım
- [x] `/uye/liderler` — sponsor / ekip görünümü

---

## AŞAMA 5 — Platform Admin Paneli ✅ TAMAMLANDI

- [x] `/admin` — dashboard (firma sayısı, MRR, kart, sipariş, MRR grafiği, top firma)
- [x] `/admin/firmalar` — firma listesi (arama, durum & paket filtreleri)
- [x] `/admin/firmalar/[id]` — firma detay (lisans, sipariş geçmişi)
- [x] `/admin/kartlar` — batch yönetimi (üretim, stok, tahsis durumları)
- [x] `/admin/siparisler` — sipariş takibi (sekmeli durum filtresi)
- [x] `/admin/lisanslar` — paket yönetimi + firma–lisans eşleştirme
- [x] `/admin/gelir` — MRR chart, paket bazlı dağılım, aylık tablo
- [x] `/admin/basvurular` — landing'den gelen başvurular + detay modal
- [x] `/admin/ayarlar` — platform ayarları & güvenlik
- [x] `auth-context` admin rolü + ADMIN_CREDENTIALS
- [x] `DashboardSidebar` admin nav
- [x] Login sayfasına admin sekmesi

**Demo giriş:** `admin@qontac.net` / `qontac123`

---

## AŞAMA 5.5 — Kapsamlı Audit & Fix Pass ✅ TAMAMLANDI

Tüm akışları gerçek navigasyonla test ettim. Bulunan ve düzeltilen sorunlar:

**Kritik bug'lar:**
- 🐛 **Tailwind v4 `max-w-*` çakışması** — Custom `--spacing-sm/md/lg/xl` tanımları `max-w-sm/md/lg/xl/2xl/7xl` utility'lerini eziyordu (16px hesaplanıyordu). `globals.css`'e plain CSS override eklendi.
- 🐛 **Arbitrary grid-cols virgül parse hatası** — `grid-cols-[2fr,1.5fr,...]` TW v4'te tek kolon üretiyordu. `_` ile değiştirildi.
- 🐛 **Landing'de eksik 3 bölüm** — `ForMembers`, `Panels`, `UseCases` bileşenleri vardı ama `page.tsx`'e import edilmemişti.
- 🐛 **Chart çubukları görünmüyordu** — Bar wrapper'larında `h-full` + `justify-end` eksikti, % yükseklik 0 hesaplanıyordu. 5 dosyada düzeltildi (admin/page, admin/gelir, firma/page, firma/analitik, uye/page).
- 🐛 **Chart bar opacity** — `rgba(0,212,255,0.2)` çok solgundu, `0.35-0.4` aralığına yükseltildi.

**Doğrulanan akışlar:**
- ✅ Landing 14 bölüm tam
- ✅ Login 3 rol (üye/firma/admin) + yanlış cred → hata → doğru hata mesajı
- ✅ Register checkbox + yönlendirme
- ✅ Demo doldur butonu (3 rol)
- ✅ `/kart/[id]` geçerli + geçersiz id (fallback) + Tanış modal
- ✅ Tüm `/uye/*` sayfaları
- ✅ Tüm `/firma/*` sayfaları (üye tablosu, üye detay, template, analitik, ayarlar)
- ✅ Tüm `/admin/*` sayfaları (firmalar filtre, siparişler tab, başvurular modal)

**Test bilgileri:**
- Üye: `demo@qontac.net` / `123456`
- Firma: `firma@qontac.net` / `123456`
- Admin: `admin@qontac.net` / `qontac123`

---

## AŞAMA 6 — Sonrası (henüz planlanmadı)

- [ ] Gerçek backend (DB + auth + API)
- [ ] Mobil uygulama (üye kart aktivasyon)
- [ ] Ödeme entegrasyonu
- [ ] Çok dilli destek
- [ ] KVKK / form altyapısı

---

## Notlar
- Next.js 16 — `node_modules/next/dist/docs/` altındaki güncel guide'ları kontrol et, training data'daki Next.js bilgisi eski olabilir.
- Tüm metinler **Türkçe**, ton kurumsal-güven veren.
- Renk paleti / font / glass-card stilleri `globals.css` + tailwind config'de tanımlı.
