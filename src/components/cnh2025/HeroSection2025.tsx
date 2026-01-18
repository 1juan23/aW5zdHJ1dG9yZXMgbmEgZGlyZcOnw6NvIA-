import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, TrendingDown, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTAClick } from "@/lib/analytics";

export function HeroSection2025() {
  return (
    <div className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
      
      {/* Animated Blobs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <Badge className="mb-6 bg-green-500/20 text-green-300 border-green-500/50 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Nova Legislação CNH 2025 - Apenas 2 Horas Obrigatórias
          </Badge>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            Tire sua CNH sem depender
            <br />
            <span className="bg-gradient-to-r from-primary via-yellow-400 to-accent bg-clip-text text-transparent">
              de autoescola
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            A liberdade da nova lei de 2025, com a segurança dos melhores instrutores autônomos credenciados.
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-semibold">Apenas 2h mínimas</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <TrendingDown className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-semibold">Economize 70%</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-semibold">Escolha instrutor</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <Clock className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <p className="text-sm font-semibold">Agende quando quiser</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/instrutores">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-slate-900 font-bold shadow-xl shadow-primary/50 hover:shadow-2xl hover:shadow-primary/60 transition-all hover:scale-105"
                onClick={() => trackCTAClick('Encontrar Instrutor', 'hero_section')}
              >
                Encontrar Instrutor
              </Button>
            </Link>
            <Link to="/instrutor/cadastro">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all hover:scale-105"
                onClick={() => trackCTAClick('Quero ser Instrutor Autônomo', 'hero_section')}
              >
                Quero ser Instrutor Autônomo
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Instrutores Verificados</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Suporte 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent" />
    </div>
  );
}
