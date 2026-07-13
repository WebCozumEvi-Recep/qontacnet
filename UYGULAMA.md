# QONTAC.NET — Uygulama Mantığı

> Bu doküman teknik değil; uygulamanın **ne işe yaradığını**, **kimin ne yaptığını** ve **işlerin nasıl aktığını** anlatır.

---

## Tek cümleyle

QONTAC, network marketing firmalarının üyelerine **fiziksel NFC kart** verip, kart okutulunca o üyenin **dijital tanıtım sayfasının** açılmasını sağlayan bir platformdur.

Kağıt kartvizit yerine: **kart + dijital profil + lead takibi**.

---

## Kim var, ne istiyor?

### Platform sahibi (Admin)
Tüm sistemi işleten taraf. Firmaları yönetir, kartları üretir, siparişleri takip eder, geliri görür.

**Der ki:** "Hangi firmalar abone? Kaç kart ürettik? Kim ödedi?"

### Firma
Network marketing şirketi. Kendi üyelerini yönetir, markasını kartlara yansıtır, kimin kaç kişiye ulaştığını görür.

**Der ki:** "Ekibim kim? Kartlarımız nasıl görünüyor? Kim kaç lead topladı?"

### Üye
Sahada çalışan temsilci. Kendi profilini düzenler, kartını aktive eder, insanlara tanıtır.

**Der ki:** "Benim kartım hazır mı? Profilim güncel mi? Bugün kaç kişi baktı?"

### Ziyaretçi
Kartı okutan veya QR tarayan kişi. Giriş yapmadan üyenin sayfasını görür, isterse iletişim bilgisi bırakır.

**Der ki:** "Bu kişi kim? Nasıl ulaşırım?"

---

## Temel fikir

```
Eski dünya:
  Üye → kağıt kartvizit verir → kaybolur, güncellenmez, kim baktı bilinmez

QONTAC dünyası:
  Üye → NFC kart verir → karşı taraf telefonda dijital sayfa görür
                      → profil anında güncellenir
                      → kim baktı, kim iletişim bıraktı ölçülür
```

---

## Kartın yaşam döngüsü

Bu uygulamanın kalbi şu akıştır:

```
1. ÜRETİM
   Admin toplu kart üretir (batch).
   Her karta benzersiz bir kod verilir.

2. TAHSİS
   Kartlar bir firmaya atanır.
   "Bu 500 kart X firmasına gidecek."

3. DAĞITIM
   Firma kartları üyelerine dağıtır.
   (Fiziksel süreç — uygulama dışında.)

4. AKTİVASYON
   Üye kartı ilk kez okutur.
   Sistem sorar: "Bu kart senin mi?"
   Üye onaylar → kart hesabına bağlanır.
   Bir üyenin yalnızca bir kartı olabilir.

5. KULLANIM
   Üye kartı/QR'ı insanlara gösterir.
   Karşı taraf dijital profili görür.
   İsterse "Tanışalım" formu doldurur → lead oluşur.

6. TAKİP
   Üye kendi istatistiklerini görür.
   Firma tüm ekibin performansını görür.
   Admin platform genelini görür.
```

### Aktivasyon neden önemli?

Kart fabrikadan çıkınca boştur. Bir üyeye bağlanmadan çalışmaz.

- İlk okutma → "Bu kartı aktive et" ekranı
- Üye giriş yapar → onaylar
- Artık her okutmada o üyenin profili açılır

Bu sayede çalıntı/karışık kart sorunu da engellenir: kart bir kez birine bağlanır, başkasına geçmez.

---

## Dijital kart sayfası ne gösterir?

Bir ziyaretçi kartı okutunca şunları görür:

- Üyenin adı, fotoğrafı, unvanı
- Telefon, WhatsApp, LinkedIn, Instagram (üye açtıysa)
- Kısa biyografi
- Firmanın belirlediği kurumsal içerikler (galeri, video, hakkımızda vb.)
- Üyenin eklediği kişisel modüller (linkler, metinler, galeriler)
- "Tanışalım" butonu → iletişim formu

Üye panelinden hangi alanların görüneceğini açıp kapatabilir. Profil güncellenince kart sayfası da anında güncellenir — yeni kart basmaya gerek yok.

---

## Firma ne yapar, üye ne yapar?

### Firma yapar:
- Kurumsal görünümü belirler (logo, renk, şablon)
- Kart sayfasına firma içerikleri ekler (galeri, video, SSS, form vb.)
- Üyelerini listeler, takip eder
- Hangi üyenin kaç görüntülenme ve lead aldığını görür
- Form modülünden gelen başvuruları yönetir

### Üye yapar:
- Kendi kişisel bilgilerini girer (ad, telefon, sosyal medya, fotoğraf)
- Kartına ek modüller ekler (link, metin, galeri)
- Fiziksel kartını aktive eder
- QR kodunu paylaşır
- Kendi lead'lerini ve istatistiklerini görür

**Kısaca:** Firma "marka ve çerçeve"yi kurar, üye "kendi içeriğini" doldurur.

---

## Lead mantığı

"Lead" = kartı gören birinin bıraktığı iletişim bilgisi.

```
Ziyaretçi kartı görür
    → "Tanışalım" formunu doldurur (ad, telefon, e-posta)
    → Bu bilgi üyeye kaydedilir
    → Firma da ekibin toplam lead'lerini görür
```

Lead'in nereden geldiği de kaydedilir:
- **NFC** — fiziksel kart okutuldu
- **QR** — QR kod tarandı
- **LINK** — doğrudan link paylaşıldı

Bu sayede üye "kartım mı iş yapıyor, QR mı?" diye anlayabilir.

---

## Paket ve abonelik mantığı

Firmalar platforma abone olur. Üç paket vardır:

| Paket | Kim için |
|-------|----------|
| Başlangıç | Küçük ekipler |
| Profesyonel | Orta ölçekli firmalar |
| Kurumsal | Büyük organizasyonlar |

Paket; kaç üye ekleyebileceğini, kaç şablon kullanabileceğini ve hangi özelliklere erişeceğini belirler.

Firma durumları:
- **Deneme** — yeni kayıt, test süreci
- **Aktif** — düzenli kullanım
- **Askıda** — geçici durdurulmuş
- **İptal** — ayrılmış

Admin tüm firmaların durumunu ve aylık geliri (MRR) görür.

---

## Sipariş mantığı

İki yoldan sipariş gelir:

### 1. Admin üzerinden
Platform operatörü firma adına sipariş girer. Kart üretimi, kargo, teslimat takibi buradan yapılır.

### 2. Site üzerinden
Ziyaretçi landing sayfasındaki ürünleri görür, sepete ekler, online ödeme yapar. Sipariş otomatik oluşur.

Sipariş durumları: Hazırlanıyor → Üretimde → Kargoda → Teslim

---

## Başvuru (demo talep) mantığı

Landing sayfasında "Demo Talep Et" formu vardır.

```
Potansiyel müşteri formu doldurur
    → Admin paneline düşer
    → Admin arayıp görüşür
    → Olumluysa firmaya dönüştürülür
```

Başvuru durumları: Yeni → İletişimde → Dönüşüm (müşteri oldu) / Kayıp

---

## Modül sistemi — basit anlatım

Kart sayfası lego gibi parçalardan oluşur.

### Firma parçaları (her üyenin kartında görünür)
Firma admini ekler:
- Hakkımızda metni
- Firma galerisi
- Tanıtım videosu
- İletişim formu
- SSS
- Özel HTML içerik

### Üye parçaları (sadece o üyenin kartında)
Üye kendi ekler:
- Kişisel galeri
- Metin bloğu
- Video linki
- Dış link (ör. kişisel site)

Admin, üyelerin kullanabileceği modül tiplerini katalog olarak tanımlar. Üye katalogdan seçip kendi kartına ekler.

---

## Günlük kullanım senaryoları

### Senaryo 1: Yeni üye işe başladı
1. Firma üyeyi sisteme ekler (veya üye kendisi kayıt olur)
2. Üye profilini doldurur
3. Firmadan fiziksel kart alır
4. Kartı telefona okutur, aktive eder
5. Artık sahada kartını dağıtabilir

### Senaryo 2: Networking etkinliği
1. Üye etkinliğe gider
2. NFC kartını veya QR kodunu gösterir
3. Karşı taraf dijital profili görür
4. İlgilenen kişi formu doldurur
5. Ertesi gün üye panelinde yeni lead'i görür

### Senaryo 3: Firma yöneticisi haftalık kontrol
1. Firma paneline girer
2. Bu hafta kaç görüntülenme olduğuna bakar
3. En çok lead toplayan üyeleri görür
4. Düşük performanslı üyelere destek planlar

### Senaryo 4: Platform operatörü yeni müşteri
1. Landing'den demo talebi gelir
2. Admin arayıp görüşür
3. Firmayı sisteme ekler, paket atar
4. Kart batch'i üretir, firmaya tahsis eder
5. Firma kartları üyelerine dağıtır

---

## Para nasıl kazanılır?

```
Gelir kaynakları:
├── Firma abonelikleri (aylık paket ücreti)
├── NFC kart satışları (adet bazlı)
└── Kurumsal özelleştirmeler (ileride)

Admin panelinde:
- Toplam MRR (aylık tekrarlayan gelir)
- Paket bazlı dağılım
- Aylık büyüme grafiği
görülür.
```

---

## Kim neyi görür? (özet tablo)

| Bilgi | Üye | Firma | Admin |
|-------|-----|-------|-------|
| Kendi profili | ✅ | — | — |
| Kendi lead'leri | ✅ | — | — |
| Kendi istatistikleri | ✅ | — | — |
| Tüm üyeler | — | ✅ (kendi firması) | ✅ (tümü) |
| Ekip lead'leri | — | ✅ | ✅ |
| Kart üretimi | — | — | ✅ |
| Siparişler | — | — | ✅ |
| Gelir raporu | — | — | ✅ |
| Demo başvuruları | — | — | ✅ |
| Site ayarları | — | — | ✅ |

---

## Uygulamanın değer zinciri

```
Admin kart üretir, firmaya tahsis eder
        ↓
Firma üyelere dağıtır, markayı şekillendirir
        ↓
Üye sahada kartı kullanır, profilini günceller
        ↓
Ziyaretçi dijital sayfayı görür, lead bırakır
        ↓
Üye ve firma sonuçları takip eder
        ↓
Admin platform büyümesini ve geliri izler
```

Her halka bir sonrakine değer katar. Platform olmadan bu zincir dağınık kalır: kartlar takip edilemez, lead'ler kaybolur, marka tutarsız olur.

---

## Kısaca mantık

1. **Fiziksel kart** = kapı (insanların eline verdiğin şey)
2. **Dijital profil** = içerik (kart açılınca görünen sayfa)
3. **Aktivasyon** = kartı bir üyeye kilitleme
4. **Lead** = ilgilenen kişinin bıraktığı iz
5. **Firma paneli** = ekibi ve markayı yönetme
6. **Admin paneli** = tüm platformu işletme
7. **Paket/abonelik** = firmaların platforma ödediği ücret
8. **Sipariş** = fiziksel kart satışı

Teknik altyapı bunların hepsini mümkün kılar; ama özünde QONTAC bir **"kart + dijital profil + ölçüm"** işidir.

---

*Son güncelleme: Haziran 2026*
