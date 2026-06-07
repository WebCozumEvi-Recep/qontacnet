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
import Pricing from "@/components/Pricing";
import DemoForm from "@/components/DemoForm";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
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
        <Pricing />
        <DemoForm />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
