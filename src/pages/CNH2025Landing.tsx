import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { HeroSection2025 } from "@/components/cnh2025/HeroSection2025";
import { CNHGuide } from "@/components/cnh2025/CNHGuide";
import { InstructorCalculator } from "@/components/cnh2025/InstructorCalculator";
import { TrustBadges } from "@/components/cnh2025/TrustBadges";
import { Footer } from "@/components/layout/Footer";
import { trackPageView } from "@/lib/analytics";

export default function CNH2025Landing() {
  useEffect(() => {
    trackPageView('/cnh-2025', 'Nova CNH 2025 - Landing Page');
  }, []);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Nova CNH 2025 - Apenas 2 Horas Obrigatórias | Instrutores na Direção</title>
        <meta 
          name="description" 
          content="Tire sua CNH com a nova lei de 2025. Apenas 2 horas mínimas de aula prática. Economize até 70% vs autoescola. Encontre instrutores autônomos credenciados." 
        />
        <meta 
          name="keywords" 
          content="CNH 2025, nova lei CNH, instrutor autônomo, aula de direção, carteira de motorista, DETRAN, autoescola" 
        />
      </Helmet>

      {/* Hero Section */}
      <HeroSection2025 />

      {/* CNH Guide */}
      <CNHGuide />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Instructor Calculator */}
      <InstructorCalculator />

      {/* Footer */}
      <Footer />
    </div>
  );
}
