"use client";
import { useState } from "react";

export interface DnsKaydi {
  tip: "TXT" | "CNAME";
  ad: string;
  deger: string;
  aciklama: string;
}

/**
 * Üyenin kendi DNS paneline gireceği kayıtları uygulamalı olarak gösterir.
 *
 * Sağlayıcılar "ad" alanını iki farklı biçimde ister: kimi tam adresi
 * (www.firmam.com), kimi yalnızca ön eki (www). İkisini de gösteriyoruz ki
 * üye hangi panelde olursa olsun doğru değeri yapıştırabilsin.
 */
function onEk(tamAd: string, alanAdi: string): string {
  if (tamAd === alanAdi) return "@";
  return tamAd.endsWith(`.${alanAdi}`) ? tamAd.slice(0, -(alanAdi.length + 1)) : tamAd;
}

function KopyaSatiri({ etiket, deger }: { etiket: string; deger: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);

  function kopyala() {
    navigator.clipboard.writeText(deger);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-on-surface-variant w-16 shrink-0">{etiket}</span>
      <code className="flex-1 min-w-0 bg-surface-dim border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-on-surface break-all font-mono">
        {deger}
      </code>
      <button type="button" onClick={kopyala} title="Kopyala"
        className="shrink-0 p-1.5 rounded-lg border border-white/10 text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-base">{kopyalandi ? "check" : "content_copy"}</span>
      </button>
    </div>
  );
}

export function DnsTalimatlari({ alanAdi, kayitlar, not, kontrolEt, kontrolEdiliyor }: {
  alanAdi: string;
  kayitlar: DnsKaydi[];
  not?: string;
  kontrolEt?: () => void;
  kontrolEdiliyor?: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary">dns</span>
        <h3 className="text-base font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
          DNS kayıtlarınızı ekleyin
        </h3>
      </div>
      <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
        <strong className="text-on-surface">{alanAdi}</strong> adresini aldığınız firmanın
        (GoDaddy, Natro, İsimtescil, Turhost, Cloudflare vb.) yönetim paneline girin ve
        <strong className="text-on-surface"> DNS Yönetimi / DNS Kayıtları</strong> bölümünü açın.
        Aşağıdaki kayıtları sırayla ekleyin — değerleri kopyala düğmesiyle alıp olduğu gibi yapıştırın.
      </p>

      <ol className="space-y-4">
        {kayitlar.map((k, i) => (
          <li key={`${k.tip}-${k.ad}-${i}`} className="bg-surface-dim/50 border border-white/10 rounded-xl p-3.5">
            <div className="flex items-start gap-2 mb-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary-container text-on-primary-container text-[11px] font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">{k.aciklama}</p>
            </div>
            <div className="space-y-1.5">
              <KopyaSatiri etiket="Tür" deger={k.tip} />
              <KopyaSatiri etiket="Ad" deger={onEk(k.ad, alanAdi)} />
              {onEk(k.ad, alanAdi) !== k.ad && (
                <p className="text-[11px] text-on-surface-variant pl-[4.5rem]">
                  Paneliniz tam adres istiyorsa: <code className="font-mono">{k.ad}</code>
                </p>
              )}
              <KopyaSatiri etiket="Değer" deger={k.deger} />
              <KopyaSatiri etiket="TTL" deger="3600" />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 bg-surface-dim border border-white/10 rounded-xl p-3.5">
        <p className="text-xs font-medium text-on-surface mb-1.5">Örnek</p>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          Paneldeki tabloda <strong className="text-on-surface">&quot;Kayıt Ekle&quot;</strong> düğmesine basın,
          açılan formda <strong className="text-on-surface">Tür</strong> kutusundan yukarıdaki tipi
          (CNAME/TXT) seçin, <strong className="text-on-surface">Ad/Host/Name</strong> kutusuna
          yukarıdaki &quot;Ad&quot; değerini, <strong className="text-on-surface">Değer/İçerik/Points to</strong>
          kutusuna &quot;Değer&quot; satırını yapıştırın ve kaydedin. Cloudflare kullanıyorsanız CNAME
          kayıtlarında bulut simgesini <strong className="text-on-surface">gri (DNS only)</strong> yapın.
        </p>
      </div>

      <p className="text-[11px] text-on-surface-variant mt-3">
        Kayıtları girdikten sonra yayılması genellikle 5 dakika–2 saat sürer. Bu süre içinde
        adresiniz açılmazsa endişelenmeyin, kontrolü tekrar çalıştırabilirsiniz. Mevcut e-posta
        (MX) kayıtlarınıza dokunmayın — e-postanız etkilenmez.
      </p>

      {not && (
        <p className="text-xs text-on-surface-variant mt-3 flex items-start gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary">info</span>{not}
        </p>
      )}

      {kontrolEt && (
        <button type="button" onClick={kontrolEt} disabled={kontrolEdiliyor}
          className="mt-4 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60 inline-flex items-center gap-2">
          <span className={`material-symbols-outlined text-base ${kontrolEdiliyor ? "animate-spin" : ""}`}>
            {kontrolEdiliyor ? "progress_activity" : "task_alt"}
          </span>
          {kontrolEdiliyor ? "Kontrol ediliyor..." : "Kayıtları girdim, kontrol et"}
        </button>
      )}
    </div>
  );
}
