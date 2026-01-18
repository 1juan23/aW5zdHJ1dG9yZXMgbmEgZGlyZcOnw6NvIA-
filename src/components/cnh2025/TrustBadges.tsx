import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Car, 
  Shield, 
  Star, 
  CreditCard, 
  Headphones,
  CheckCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrustBadge {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export function TrustBadges() {
  const badges: TrustBadge[] = [
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: "Instrutor Credenciado",
      description: "Todos os instrutores têm documentação validada e registro ativo no DETRAN",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <Car className="h-8 w-8" />,
      title: "Veículo Adaptado",
      description: "Veículos com duplo comando e em conformidade com a legislação de 2025",
      color: "text-green-600 dark:text-green-400"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Seguro Ativo",
      description: "Proteção completa para aluno e instrutor durante todas as aulas",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: <Star className="h-8 w-8" />,
      title: "Avaliações Verificadas",
      description: "Sistema de reviews autênticos de alunos reais aprovados",
      color: "text-yellow-600 dark:text-yellow-400"
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Pagamento Seguro",
      description: "Transações protegidas com criptografia de ponta a ponta",
      color: "text-indigo-600 dark:text-indigo-400"
    },
    {
      icon: <Headphones className="h-8 w-8" />,
      title: "Suporte 24/7",
      description: "Assistência sempre disponível via chat, email ou telefone",
      color: "text-pink-600 dark:text-pink-400"
    }
  ];

  return (
    <div className="py-16 md:py-24 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            100% Seguro e Confiável
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Segurança e Confiança Garantidas
          </h2>
          <p className="text-lg text-muted-foreground">
            Todos os instrutores são verificados e certificados conforme a nova legislação de 2025. 
            Sua segurança é nossa prioridade.
          </p>
        </div>

        {/* Badges Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {badges.map((badge, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 border-2 hover:border-primary">
                    <CardContent className="pt-6 text-center">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 group-hover:scale-110 transition-transform ${badge.color}`}>
                        {badge.icon}
                      </div>
                      <h3 className="font-bold text-lg mb-2">
                        {badge.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {badge.description}
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{badge.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {/* Bottom Info */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <p className="text-blue-900 dark:text-blue-100">
              <strong>📜 Compliance Total:</strong> Nossa plataforma está em total conformidade 
              com a Resolução CONTRAN nº 789/2020 e as atualizações de 2025. Todos os instrutores 
              possuem registro ativo e veículos devidamente adaptados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
