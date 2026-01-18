import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Diamond, Zap, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PremiumPlanBannerProps {
  planType: string;
}

export function PremiumPlanBanner({ planType }: PremiumPlanBannerProps) {
  if (planType === 'trial' || planType === 'expired') return null;

  const config = {
    essencial: {
      title: "Plano Essencial Ativo",
      description: "Você tem acesso profissional ilimitado e selo de verificação.",
      icon: Zap,
      gradient: "from-blue-500/20 via-blue-900/40 to-slate-900",
      border: "border-blue-500/30",
      iconBg: "bg-blue-500",
      textColor: "text-blue-200",
      cta: "Gerenciar Plano"
    },
    destaque: {
      title: "Plano Destaque Ativo",
      description: "Seu perfil aparece no topo das buscas regionais.",
      icon: Crown,
      gradient: "from-emerald-500/20 via-emerald-900/40 to-slate-900",
      border: "border-emerald-500/30",
      iconBg: "bg-emerald-500",
      textColor: "text-emerald-200",
      cta: "Ver Analytics"
    },
    elite: {
      title: "Membro Elite",
      description: "Máxima visibilidade, suporte VIP e consultoria exclusiva.",
      icon: Diamond,
      gradient: "from-amber-500/20 via-orange-900/40 to-slate-900",
      border: "border-amber-500/30",
      iconBg: "bg-gradient-to-br from-amber-400 to-orange-600",
      textColor: "text-amber-200",
      cta: "Acessar Consultoria"
    }
  };

  const current = config[planType as keyof typeof config] || config.essencial;
  const Icon = current.icon;

  return (
    <Card className={cn(
      "mb-8 border overflow-hidden relative group",
      current.border
    )}>
      {/* Dynamic Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r opacity-100 transition-all duration-500",
        current.gradient
      )} />
      
      {/* Animated Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      <CardContent className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-300",
            current.iconBg
          )}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className={cn("text-xl font-bold text-white")}>
                {current.title}
              </h3>
              <div className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium border border-white/10 backdrop-blur-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Ativo
              </div>
            </div>
            <p className={cn("text-base", current.textColor)}>
              {current.description}
            </p>
          </div>
        </div>

        <Link to="/instrutor/planos">
          <Button 
            variant="secondary" 
            className="whitespace-nowrap bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-xl backdrop-blur-md"
          >
            {planType === 'trial' ? 'Fazer Upgrade' : 'Gerenciar Assinatura'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
