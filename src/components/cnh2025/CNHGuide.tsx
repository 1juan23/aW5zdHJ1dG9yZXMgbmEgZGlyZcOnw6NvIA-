import { Timeline } from "@/components/ui/Timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, Car, CheckCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function CNHGuide() {
  const steps = [
    {
      title: "① Inscrição no DETRAN",
      description: "Primeiro passo: faça sua inscrição para começar o processo",
      icon: <FileText className="h-6 w-6" />,
      details: [
        "Inscrição online ou presencial no DETRAN",
        "Documentos: RG, CPF, comprovante de residência",
        "Taxa de inscrição (varia por estado)",
        "Exame médico e psicotécnico"
      ]
    },
    {
      title: "② Prova Teórica",
      description: "Estude por conta própria e faça a prova no DETRAN",
      icon: <BookOpen className="h-6 w-6" />,
      details: [
        "Estudo autônomo com materiais gratuitos",
        "Simulados online disponíveis",
        "40 questões, mínimo 70% de acertos",
        "Legislação de trânsito e direção defensiva"
      ]
    },
    {
      title: "③ Aulas Práticas - NOVO! 🎉",
      description: "Com a nova lei de 2025, você precisa de apenas 2 horas mínimas!",
      icon: <Car className="h-6 w-6" />,
      highlight: true,
      details: [
        "Apenas 2 horas mínimas obrigatórias (antes eram 20h+)",
        "Escolha seu instrutor ideal na plataforma",
        "Agende nos horários que funcionam para você",
        "💰 Economize até 70% vs autoescola tradicional"
      ]
    },
    {
      title: "④ Exame Prático",
      description: "Última etapa: agende e faça o exame prático no DETRAN",
      icon: <CheckCircle className="h-6 w-6" />,
      details: [
        "Agende o exame após completar as 2 horas",
        "Exame realizado em veículo do DETRAN",
        "Avaliação de direção em vias públicas",
        "Aprovação: receba sua CNH em até 30 dias"
      ]
    }
  ];

  return (
    <div className="py-16 md:py-24 bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700">
            <Sparkles className="h-3 w-3 mr-1" />
            Nova Legislação 2025
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Guia Completo da Nova CNH
          </h2>
          <p className="text-lg text-muted-foreground">
            Entenda o passo a passo para tirar sua CNH com a nova legislação. 
            <span className="font-semibold text-green-600 dark:text-green-400"> Mais liberdade, menos custos!</span>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Timeline */}
          <div className="md:col-span-2">
            <Timeline steps={steps} />
          </div>

          {/* Sidebar - Destaque */}
          <div className="space-y-6">
            {/* Economia Card */}
            <Card className="border-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-slate-900">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Economia Garantida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Autoescola Tradicional:</p>
                  <p className="text-2xl font-bold line-through text-red-600 dark:text-red-400">
                    R$ 2.500 - R$ 4.000
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Com Nossa Plataforma:</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    R$ 160 - R$ 300
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (2 horas × R$ 80-150/hora)
                  </p>
                </div>
                <div className="pt-4 border-t border-green-200 dark:border-green-800">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    💰 Você economiza até R$ 3.700!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CTA Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pronto para começar?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Encontre o instrutor ideal e agende suas 2 horas obrigatórias agora mesmo.
                </p>
                <Link to="/instrutores">
                  <Button className="w-full" size="lg">
                    Encontrar Instrutor
                  </Button>
                </Link>
                <Link to="/faq">
                  <Button variant="outline" className="w-full">
                    Dúvidas Frequentes
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>💡 Dica:</strong> Mesmo com apenas 2 horas obrigatórias, 
                  recomendamos fazer mais aulas se você nunca dirigiu. 
                  Segurança em primeiro lugar!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 md:p-12">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Aproveite a Nova Lei de 2025
          </h3>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Tire sua CNH com liberdade, economia e segurança. 
            Conectamos você aos melhores instrutores autônomos credenciados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/instrutores">
              <Button size="lg" className="w-full sm:w-auto">
                Encontrar Instrutor Agora
              </Button>
            </Link>
            <Link to="/como-funciona">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Como Funciona
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
