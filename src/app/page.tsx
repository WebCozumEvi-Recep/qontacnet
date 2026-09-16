import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProblemSolution from "@/components/ProblemSolution";
import HowItWorks from "@/components/HowItWorks";
import DigitalPage from "@/components/DigitalPage";
import ForFirms from "@/components/ForFirms";
import ForMembers from "@/components/ForMembers";
import Features from "@/components/Features";
import Panels from "@/components/Panels";
import UseCases from "@/components/UseCases";
import DemoForm from "@/components/DemoForm";
import FAQ from "@/components/FAQ";
import Products from "@/components/Products";
import Footer from "@/components/Footer";
import { getSiteSettings } from "@/lib/site-settings";
import { getSession } from "@/lib/session";
import { getI18n } from "@/lib/i18n/server";
import { tx } from "@/lib/i18n/auto";
import { DEMO_FORM_TEXT, FAQ_DATA, PRODUCTS_TEXT } from "@/lib/i18n/ui-text";

// Site ayarları (logo, doğrulama, kod enjeksiyonu) önbellekten okunur ve admin
// panelinden kaydedildiğinde anında tazelenir; sayfa TTFB'si DB'ye bağlı değildir.
// Sayfa yine de dinamik kalır: oturum çerezi okunarak Hesap bağlantısı belirlenir.

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  if (s?.googleSiteVerification) {
    return { verification: { google: s.googleSiteVerification } };
  }
  return {};
}

const PANEL_HREF: Record<string, string> = { admin: "/admin", firma: "/firma", uye: "/uye" };

export default async function Home({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  // Eski firma satış linkleri (?ref=<firmaId>) firmanın satış sayfasına taşındı.
  const { ref } = await searchParams;
  if (ref && /^[a-z0-9]{10,40}$/i.test(ref)) redirect(`/f/${ref}`);

  const [s, { locale, t }, session] = await Promise.all([getSiteSettings(), getI18n(), getSession()]);
  const accountHref = session ? PANEL_HREF[session.role] ?? "/auth/login" : "/auth/login";

  // Client bileşenlerinin metinleri server tarafında çevrilir
  const [demoText, productsText, faqTitle, faqList] = await Promise.all([
    tx(DEMO_FORM_TEXT, locale),
    tx(PRODUCTS_TEXT, locale),
    tx({ t: FAQ_DATA.title }, locale).then((r) => r.t),
    Promise.all(
      FAQ_DATA.faqs.map(async (f) => await tx({ q: f.q, a: f.a }, locale)),
    ),
  ]);

  return (
    <>
      {s?.headKod ? <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: s.headKod }} /> : null}
      <Header logoUrl={s?.logoUrl || ""} logoText={s?.logoText || "QONTAC"} nav={t.nav} locale={locale} loggedIn={!!session} accountHref={accountHref} />
      <main className="pt-20">
        <Hero t={t.hero} />
        <ProblemSolution />
        <HowItWorks />
        <DigitalPage />
        <ForFirms />
        <ForMembers />
        <Features />
        <Panels />
        <UseCases />
        <Products t={productsText} />
        <DemoForm t={demoText} />
        <FAQ title={faqTitle} faqs={faqList} />
      </main>
      <Footer />
      {s?.bodyKod ? <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: s.bodyKod }} /> : null}
    </>
  );
}
