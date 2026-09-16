import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FirmaSatis } from "./FirmaSatis";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ odeme?: string; no?: string }> };

async function veriGetir(id: string) {
  const firma = await prisma.firma.findUnique({
    where: { id },
    select: { id: true, ad: true, logo: true, durum: true, urunId: true },
  });
  if (!firma || firma.durum !== "AKTIF" || !firma.urunId) return null;
  const urun = await prisma.product.findUnique({
    where: { id: firma.urunId },
    select: { id: true, ad: true, aciklama: true, fiyat: true, gorsel: true, aktif: true },
  });
  if (!urun || !urun.aktif || urun.fiyat <= 0) return null;
  return { firma, urun };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const veri = await veriGetir((await params).id);
  return {
    title: veri ? `${veri.firma.ad} — ${veri.urun.ad} | QONTAC` : "QONTAC",
    robots: { index: false },
  };
}

// Firma satış sayfası: firmanın paylaştığı linkle gelen kişi firmaya tanımlı ürünü
// satın alır; ödeme sonrası firmaya bağlı üye hesabı açılır.
export default async function FirmaSatisSayfasi({ params, searchParams }: Props) {
  const [veri, sp] = await Promise.all([params.then(p => veriGetir(p.id)), searchParams]);

  if (!veri) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">storefront</span>
          <h1 className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Satış sayfası kullanılamıyor</h1>
          <p className="text-sm text-on-surface-variant">Bu bağlantı geçersiz ya da şu an satışa kapalı.</p>
          <Link href="/" className="inline-block px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold">
            Ana Sayfaya Git
          </Link>
        </div>
      </div>
    );
  }

  const { firma, urun } = veri;
  return (
    <div className="min-h-screen bg-background px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center gap-4">
          {firma.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={firma.logo} alt={firma.ad} className="h-14 w-auto max-w-[160px] object-contain rounded-lg bg-white/5 p-1" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">corporate_fare</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-lg font-semibold text-on-surface truncate" style={{ fontFamily: "Sora, sans-serif" }}>{firma.ad}</p>
            <p className="text-xs text-on-surface-variant">QONTAC dijital kartvizit</p>
          </div>
        </header>

        <section className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row gap-5">
          {urun.gorsel && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urun.gorsel} alt={urun.ad} className="w-full sm:w-40 aspect-square object-cover rounded-xl" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{urun.ad}</h1>
            {urun.aciklama && <p className="text-sm text-on-surface-variant mt-2 whitespace-pre-line">{urun.aciklama}</p>}
            <p className="text-2xl font-bold text-primary mt-4" style={{ fontFamily: "Sora, sans-serif" }}>₺{urun.fiyat.toLocaleString("tr-TR")}</p>
          </div>
        </section>

        <FirmaSatis firmaId={firma.id} urun={{ id: urun.id, ad: urun.ad, fiyat: urun.fiyat }} odeme={sp.odeme} no={sp.no ?? ""} />

        <p className="text-center text-xs text-on-surface-variant">
          Ödemeniz tamamlandığında QONTAC üyelik hesabınız oluşturulur ve şifrenizi belirlemeniz istenir.
        </p>
      </div>
    </div>
  );
}
