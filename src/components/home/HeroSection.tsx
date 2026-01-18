import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Shield, Clock, CheckCircle, Users } from "lucide-react";
import { useState } from "react";

export function HeroSection() {
  const [searchCity, setSearchCity] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate(`/instrutores${searchCity ? `?cidade=${encodeURIComponent(searchCity)}` : ''}`);
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-950">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left animate-fade-in-up">
            <div className="flex flex-col gap-4 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold w-fit animate-pulse">
                <Shield className="h-3 w-3" />
                <span className="uppercase tracking-wider">✨ Nova Lei do Detran (2025): Escolha seu instrutor particular agora</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-foreground text-xs font-semibold w-fit">
                <Shield className="h-3 w-3 text-accent" />
                <span className="uppercase tracking-wider">Plataforma 100% Segura & Verificada</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              Sua liberdade no <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                trânsito começa aqui
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
              Encontre os melhores instrutores particulares para perder o medo de dirigir, 
              treinar para a prova ou aperfeiçoar sua direção. Simples, seguro e eficiente.
            </p>

            {/* Search Glassmorphism */}
            <div className="bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl max-w-xl group focus-within:border-primary/50 transition-all duration-300">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-primary" />
                  <input
                    type="text"
                    placeholder="Em qual cidade você está?"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-transparent border-0 focus:ring-0 focus:outline-none text-white placeholder:text-slate-500 text-lg"
                  />
                </div>
                <Button size="lg" className="h-14 px-8 rounded-xl font-bold text-lg bg-accent text-accent-foreground hover:bg-accent-highlight shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all border-0" onClick={handleSearch}>
                  <Search className="h-5 w-5 mr-2" />
                  Buscar Agora
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-6 mt-12">
               <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Instrutores credenciados</span>
               </div>
               <div className="flex items-center gap-2 text-slate-400">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">+5.000 alunos atendidos</span>
               </div>
               <div className="flex items-center gap-2 text-slate-400">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">Nota 4.9/5 estrelas</span>
               </div>
            </div>
          </div>

          {/* Right Content - Visual Glassmorphism Card */}
          <div className="hidden lg:block relative group text-center">
             {/* Main Visual Element */}
             <div className="relative z-10 w-full h-[550px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-float">
               <img 
                  src="/Gemini_Generated_Image_4wo5g44wo5g44wo5.png" 
                  alt="Instrutor e Aluno" 
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                
                {/* Floating Elements on Image */}
                <div className="absolute top-10 left-10 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl animate-bounce-slow">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                         <Shield className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div className="text-left">
                         <p className="text-xs text-white/60 font-medium">Credenciado Detran</p>
                         <p className="text-sm text-white font-bold">100% Legalizado</p>
                      </div>
                   </div>
                </div>

                <div className="absolute bottom-10 right-10 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl animate-bounce-slow" style={{ animationDelay: '1s' }}>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                         <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                         <p className="text-xs text-white/60 font-medium">Foco no Aluno</p>
                         <p className="text-sm text-white font-bold">Metodologia Exclusiva</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Decorative Background Circles */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl -z-0" />
             <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl -z-0" />
          </div>
        </div>
      </div>

      {/* Trust Scroll */}
      <div className="absolute bottom-0 w-full bg-white/5 border-t border-white/10 py-6 backdrop-blur-md">
         <div className="container mx-auto px-4 flex justify-around items-center opacity-40 grayscale">
            <span className="font-bold text-slate-300">SEGURANÇA</span>
            <span className="font-bold text-slate-300">CONFIANÇA</span>
            <span className="font-bold text-slate-300">LIBERDADE</span>
            <span className="font-bold text-slate-300">PRATICIDADE</span>
            <span className="font-extrabold text-[#0423ca]/60 hidden sm:block">Instrutores na Direção</span>
         </div>
      </div>
    </section>
  );
}
