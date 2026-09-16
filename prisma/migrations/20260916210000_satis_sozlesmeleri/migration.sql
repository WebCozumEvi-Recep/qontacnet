-- Satın almada onaylatılan sözleşmeler.
-- Siparişe onay kaydı (zaman, IP, onaylanan sayfa sürümleri).
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sozlesmeKayit" JSONB;

-- Taslak sözleşme sayfaları: PASİF eklenir. Köşeli parantezli satıcı bilgileri
-- admin > Özel Sayfalar'dan doldurulup sayfa aktif edilince satın alma formunda görünür.
-- Aynı slug varsa dokunulmaz.
INSERT INTO "CustomPage" ("id", "slug", "baslik", "icerik", "aktif", "sira", "createdAt", "updatedAt") VALUES
('sozlesme-on-bilgilendirme', 'on-bilgilendirme-formu', 'Ön Bilgilendirme Formu', $html$
<h2>1. Satıcı Bilgileri</h2>
<p><strong>Unvan:</strong> [Şirket unvanı]<br><strong>Adres:</strong> [Şirket adresi]<br><strong>Telefon:</strong> [Telefon]<br><strong>E-posta:</strong> [E-posta]<br><strong>Vergi Dairesi / No:</strong> [Vergi dairesi / numarası]<br><strong>MERSİS No:</strong> [MERSİS numarası]</p>
<h2>2. Alıcı Bilgileri</h2>
<p><strong>Ad Soyad:</strong> {{ALICI_AD}}<br><strong>Telefon:</strong> {{ALICI_TELEFON}}<br><strong>E-posta:</strong> {{ALICI_EPOSTA}}<br><strong>Teslimat Adresi:</strong> {{ALICI_ADRES}}</p>
<h2>3. Sözleşme Konusu Ürün</h2>
<p><strong>Ürün:</strong> {{URUN}}<br><strong>Adet:</strong> {{ADET}}<br><strong>Toplam Bedel (KDV dahil):</strong> {{TUTAR}}<br><strong>Sipariş Tarihi:</strong> {{TARIH}}</p>
<p>Ürünün temel nitelikleri satış sayfasında yer aldığı gibidir. Ürün, NFC çipli fiziksel kart ve buna bağlı QONTAC dijital kartvizit hizmetinden oluşur.</p>
<h2>4. Ödeme ve Teslimat</h2>
<p>Ödeme, sipariş sırasında kredi/banka kartı ile 3D Secure doğrulamasıyla peşin alınır. Ürün, ödemenin onaylanmasından itibaren en geç 30 gün içinde Alıcı'nın bildirdiği teslimat adresine kargo ile gönderilir. Teslimat masrafı [Satıcıya / Alıcıya] aittir.</p>
<h2>5. Cayma Hakkı</h2>
<p>Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma bildirimi yukarıdaki iletişim bilgileri üzerinden yapılabilir.</p>
<p>Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca, <strong>Alıcı'nın istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan (kişiye özel basılan) ürünlerde cayma hakkı kullanılamaz.</strong> Kart üzerine Alıcı'ya ait ad, unvan veya tasarım basılmışsa bu istisna uygulanır.</p>
<p>Cayma hakkının kullanılması hâlinde bedel, cayma bildiriminin Satıcı'ya ulaştığı tarihten itibaren 14 gün içinde ödemenin yapıldığı araca iade edilir. Ayrıntılar İptal ve İade Koşulları sayfasında yer alır.</p>
<h2>6. Şikâyet ve İtiraz</h2>
<p>Alıcı, talep ve şikâyetlerini yukarıdaki iletişim bilgilerine iletebilir. Uyuşmazlıklarda, Ticaret Bakanlığınca her yıl belirlenen parasal sınırlar dâhilinde Alıcı'nın yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.</p>
$html$, false, 100, now(), now()),

('sozlesme-mesafeli-satis', 'mesafeli-satis-sozlesmesi', 'Mesafeli Satış Sözleşmesi', $html$
<h2>Madde 1 – Taraflar</h2>
<p><strong>SATICI:</strong> [Şirket unvanı] — [Şirket adresi] — Tel: [Telefon] — E-posta: [E-posta] — Vergi Dairesi/No: [Vergi dairesi / numarası] — MERSİS: [MERSİS numarası]</p>
<p><strong>ALICI:</strong> {{ALICI_AD}} — {{ALICI_ADRES}} — Tel: {{ALICI_TELEFON}} — E-posta: {{ALICI_EPOSTA}}</p>
<h2>Madde 2 – Konu</h2>
<p>İşbu sözleşmenin konusu, Alıcı'nın Satıcı'ya ait qontac.net internet sitesi üzerinden elektronik ortamda siparişini verdiği aşağıda nitelikleri ve satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.</p>
<h2>Madde 3 – Sözleşme Konusu Ürün</h2>
<p><strong>Ürün:</strong> {{URUN}}<br><strong>Adet:</strong> {{ADET}}<br><strong>Toplam Bedel (KDV dahil):</strong> {{TUTAR}}<br><strong>Ödeme Şekli:</strong> Kredi/banka kartı (3D Secure)<br><strong>Sipariş Tarihi:</strong> {{TARIH}}</p>
<h2>Madde 4 – Genel Hükümler</h2>
<p>4.1. Alıcı, ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimata ilişkin Ön Bilgilendirme Formu'nu okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder.</p>
<p>4.2. Ürün, yasal 30 günlük süreyi aşmamak kaydıyla Alıcı'nın bildirdiği adrese teslim edilir. Satıcı'nın ürünü süresinde teslim edememesi hâlinde Alıcı sözleşmeyi feshedebilir.</p>
<p>4.3. Teslim anında Alıcı'nın adreste bulunmaması hâlinde Satıcı edimini yerine getirmiş sayılır. Ürünün geç teslim edilmesinden ya da kargo firmasında beklemesinden doğan sorumluluk Alıcı'ya aittir.</p>
<p>4.4. Ürün ile birlikte sunulan QONTAC dijital kartvizit hizmeti, Alıcı adına oluşturulan üyelik hesabı üzerinden Üyelik Sözleşmesi hükümlerine göre sağlanır.</p>
<p>4.5. Kartın ödemesinin bankaca herhangi bir nedenle yapılmaması hâlinde Satıcı'nın ürünü teslim yükümlülüğü sona erer.</p>
<h2>Madde 5 – Cayma Hakkı</h2>
<p>5.1. Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde gerekçe göstermeksizin cayma hakkını kullanabilir. Bildirim Satıcı'nın yukarıdaki iletişim bilgilerine yazılı olarak yapılır.</p>
<p>5.2. Cayma hakkı kullanılan ürün, cayma bildiriminden itibaren 10 gün içinde Satıcı'ya iade edilir. Satıcı, bildirimin kendisine ulaşmasından itibaren 14 gün içinde bedeli ödemenin yapıldığı araca iade eder.</p>
<p>5.3. <strong>İstisna:</strong> Alıcı'nın istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan, üzerine Alıcı'ya ait bilgi veya tasarım basılan ürünlerde Yönetmelik'in 15. maddesi uyarınca cayma hakkı kullanılamaz.</p>
<h2>Madde 6 – Uyuşmazlıkların Çözümü</h2>
<p>İşbu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığınca ilan edilen parasal sınırlar dâhilinde Tüketici Hakem Heyetleri, bu sınırları aşan durumlarda Tüketici Mahkemeleri yetkilidir.</p>
<h2>Madde 7 – Yürürlük</h2>
<p>Alıcı, siparişi onaylayarak işbu sözleşmenin tüm koşullarını kabul etmiş sayılır. Sözleşme, siparişin onaylandığı {{TARIH}} tarihinde elektronik ortamda kurulmuştur ve Satıcı tarafından sipariş kaydıyla birlikte saklanır.</p>
$html$, false, 101, now(), now()),

('sozlesme-uyelik', 'uyelik-sozlesmesi', 'Üyelik Sözleşmesi', $html$
<h2>1. Taraflar</h2>
<p>İşbu sözleşme, [Şirket unvanı] ("QONTAC") ile qontac.net üzerinden üyelik hesabı oluşturan kişi ("Üye") arasında, Üye'nin elektronik ortamda onay vermesiyle kurulmuştur.</p>
<h2>2. Konu</h2>
<p>Sözleşmenin konusu, Üye'nin QONTAC dijital kartvizit platformundan (üye paneli, dijital kart sayfası, NFC/QR kart bağlantısı ve ilgili modüller) yararlanma koşullarının belirlenmesidir.</p>
<h2>3. Üyelik</h2>
<p>3.1. Üyelik, satın alma sonrasında Üye'nin şifresini belirlemesiyle veya kayıt formunun doldurulmasıyla başlar. Üye, verdiği bilgilerin doğru ve güncel olduğunu kabul eder.</p>
<p>3.2. Üye, bir firmanın satış bağlantısı üzerinden satın alma yaptıysa hesabı ilgili firmayla ilişkilendirilir; firma, Üye'nin panelde paylaştığı kartvizit bilgilerini ve kart kullanım istatistiklerini görüntüleyebilir.</p>
<p>3.3. Hesap güvenliğinden ve şifrenin gizliliğinden Üye sorumludur.</p>
<h2>4. Üye'nin Yükümlülükleri</h2>
<p>4.1. Üye, dijital kartında yayımladığı içeriklerin (ad, unvan, görsel, bağlantılar vb.) hukuka, genel ahlaka ve üçüncü kişilerin haklarına aykırı olmamasından sorumludur.</p>
<p>4.2. Üye, platformu yanıltıcı, zarar verici veya yetkisiz amaçlarla kullanamaz; aksi hâlde QONTAC hesabı askıya alma veya kapatma hakkına sahiptir.</p>
<h2>5. QONTAC'ın Hak ve Yükümlülükleri</h2>
<p>5.1. QONTAC, hizmetin kesintisiz sunulması için makul çabayı gösterir; bakım, güncelleme veya mücbir sebeplerle oluşan kesintilerden sorumlu tutulamaz.</p>
<p>5.2. QONTAC, hizmetin kapsamında ve bu sözleşmede değişiklik yapabilir; önemli değişiklikler Üye'ye bildirilir.</p>
<h2>6. Kişisel Veriler</h2>
<p>Üye'ye ait kişisel veriler KVKK Aydınlatma Metni ve Gizlilik Politikası kapsamında işlenir.</p>
<h2>7. Sözleşmenin Sona Ermesi</h2>
<p>Üye, dilediği zaman hesabının kapatılmasını talep edebilir. Sözleşmeye aykırılık hâlinde QONTAC sözleşmeyi tek taraflı feshedebilir.</p>
<h2>8. Uyuşmazlıklar</h2>
<p>İşbu sözleşmeden doğan uyuşmazlıklarda Türk hukuku uygulanır; tüketici işlemlerinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>
$html$, false, 102, now(), now()),

('sozlesme-iptal-iade', 'iptal-ve-iade-kosullari', 'İptal ve İade Koşulları', $html$
<h2>Sipariş İptali</h2>
<p>Ürün üretime veya kargoya verilmeden önce siparişinizi [E-posta] adresine ya da [Telefon] numarasına bildirerek iptal edebilirsiniz. İptal edilen siparişin bedeli 14 gün içinde ödemenin yapıldığı karta iade edilir.</p>
<h2>Cayma Hakkı ve İade</h2>
<p>Ürünü teslim aldığınız tarihten itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz. İade edilecek ürünün kullanılmamış ve yeniden satılabilir durumda olması gerekir.</p>
<p><strong>Kişiye özel basılan kartlar:</strong> Üzerine adınız, unvanınız veya size özel tasarım basılan kartlarda, Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca cayma hakkı kullanılamaz.</p>
<h2>Hatalı veya Arızalı Ürün</h2>
<p>Ürün size hatalı, hasarlı ya da çalışmayan NFC çipiyle ulaştıysa [E-posta] adresine fotoğrafla bildirin; ürün ücretsiz olarak değiştirilir veya bedeli iade edilir.</p>
<h2>İade Süreci</h2>
<p>İade talebiniz onaylandıktan sonra ürünü [İade adresi] adresine gönderebilirsiniz. Bedel, iadenin tarafımıza ulaşmasından itibaren en geç 14 gün içinde kartınıza iade edilir; bankanızın yansıtma süresi değişiklik gösterebilir.</p>
$html$, false, 103, now(), now())
ON CONFLICT ("slug") DO NOTHING;
