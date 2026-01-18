import { Card, CardContent } from "@/components/ui/card";
import { Search, UserCheck, Calendar, Car } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Busque",
    description: "Encontre instrutores na sua cidade usando nossos filtros inteligentes.",
  },
  {
    icon: UserCheck,
    title: "Compare",
    description: "Analise perfis, avaliações, preços e escolha o instrutor ideal.",
  },
  {
    icon: Calendar,
    title: "Agende",
    description: "Entre em contato e agende suas aulas no horário que preferir.",
  },
  {
    icon: Car,
    title: "Aprenda",
    description: "Tenha aulas personalizadas e evolua com segurança.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Como Funciona
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Em poucos passos você encontra o instrutor perfeito e começa suas aulas.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector Line (hidden on last item and on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-border" />
              )}

              <Card variant="ghost" className="text-center relative z-10 bg-card">
                <CardContent className="pt-8 pb-6">
                  {/* Step Number */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
