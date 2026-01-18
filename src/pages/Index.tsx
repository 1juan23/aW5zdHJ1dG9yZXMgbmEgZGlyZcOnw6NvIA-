import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedInstructors } from "@/components/home/FeaturedInstructors";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { CTASection } from "@/components/home/CTASection";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Instrutores na Direção - Encontre o melhor instrutor de direção</title>
        <meta 
          name="description" 
          content="Plataforma que conecta você aos melhores instrutores de direção da sua região. Profissionais qualificados, avaliados e prontos para te ajudar a tirar sua CNH." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <FeaturedInstructors />
          <HowItWorks />
          <Testimonials />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
