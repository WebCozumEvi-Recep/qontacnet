import type { Metadata } from "next";
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
import Products from "@/components/Products";
import DemoForm from "@/components/DemoForm";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

// Site ayarları (logo, doğrulama, kod enjeksiyonu) her istekte DB'den okunur
export const dynamic = "force-dynamic";

async function getSiteSettings() {
  try {
    return await prisma.siteSettings.findUnique({ where: { id: "site" } });
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  if (s?.googleSiteVerification) {
    return { verification: { google: s.googleSiteVerification } };
  }
  return {};
}

export default async function Home() {
  const s = await getSiteSettings();

  return (
    <>
      {s?.headKod ? <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: s.headKod }} /> : null}
      <Header logoUrl={s?.logoUrl || ""} logoText={s?.logoText || "QONTAC"} />
      <main className="pt-20">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <DigitalPage />
        <ForFirms />
        <ForMembers />
        <Features />
        <Panels />
        <UseCases />
        <Products />
        <DemoForm />
        <FAQ />
      </main>
      <Footer />
      {s?.bodyKod ? <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: s.bodyKod }} /> : null}
    </>
  );
}
