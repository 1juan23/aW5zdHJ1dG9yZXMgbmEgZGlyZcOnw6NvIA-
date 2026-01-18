import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Award, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  { icon: Shield, text: "Instrutores verificados" },
  { icon: Award, text: "Profissionais qualificados" },
  { icon: Clock, text: "Horários flexíveis" },
];

export function CTASection() {
  return (
    <section className="py-20 gradient-hero relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-64 h-64 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-primary-foreground rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Milhares de alunos já encontraram seus instrutores ideais através da nossa plataforma.
            Faça parte dessa comunidade!
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {benefits.map((benefit) => (
              <div key={benefit.text} className="flex items-center gap-2 text-primary-foreground/80">
                <benefit.icon className="h-5 w-5 text-accent" />
                <span className="text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/instrutores">
              <Button size="xl" variant="accent" className="gap-2 w-full sm:w-auto">
                Encontrar um instrutor
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/instrutor/cadastro">
              <Button size="xl" variant="hero" className="gap-2 w-full sm:w-auto">
                Quero ser um instrutor parceiro
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
