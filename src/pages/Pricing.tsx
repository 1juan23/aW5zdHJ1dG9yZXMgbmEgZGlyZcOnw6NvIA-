import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PricingPlan {
  id: string;
  plan_name: string;
  plan_slug: string;
  monthly_price: number;
  commission_rate: number;
  features: string[];
  display_order: number;
}

const defaultPlans: PricingPlan[] = [
  { id: '1', plan_name: 'Essencial', plan_slug: 'essential', monthly_price: 0, commission_rate: 0.10, features: ['Perfil na plataforma', 'Chat com alunos', 'Comissão de 10%'], display_order: 1 },
  { id: '2', plan_name: 'Pro', plan_slug: 'pro', monthly_price: 79.90, commission_rate: 0.05, features: ['Tudo do Essencial', 'Destaque nas buscas', 'Comissão de 5%', 'Suporte prioritário'], display_order: 2 },
];

export default function Pricing() {
  const [pricePerHour, setPricePerHour] = useState(80);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const plans = defaultPlans;
  const studentFee = 5.00;
  
  const essentialPlan = plans.find(p => p.plan_slug === 'essential');
  const proPlan = plans.find(p => p.plan_slug === 'pro');
  const earningsEssential = essentialPlan ? pricePerHour * (1 - essentialPlan.commission_rate) : 0;
  const earningsPro = proPlan ? pricePerHour * (1 - proPlan.commission_rate) : 0;

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        headers: sessionData?.session?.access_token 
          ? { Authorization: `Bearer ${sessionData.session.access_token}` }
          : {}
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Preços e Planos | Instrutores na Direção</title>
        <meta name="description" content="Conheça nosso modelo de negócio transparente." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-slate-950 text-white">
        <Header />
        
        <main className="flex-1">
          <section className="py-20 relative overflow-hidden">
            <div className="container mx-auto px-4 text-center">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">Transparência Total</Badge>
              <h1 className="text-4xl md:text-6xl font-black mb-6">
                O melhor valor para <span className="text-primary italic">quem aprende</span> e para <span className="text-accent italic">quem ensina.</span>
              </h1>
            </div>
          </section>

          <section className="py-16 bg-white/5">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto bg-slate-900 p-8 rounded-[2rem] border border-white/10">
                <h2 className="text-3xl font-bold mb-4">Para o Aluno</h2>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3"><CheckCircle className="text-green-500 h-5 w-5" />Sem taxa de matrícula</li>
                  <li className="flex items-center gap-3"><CheckCircle className="text-green-500 h-5 w-5" />Parcele no cartão</li>
                </ul>
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-2">Taxa de Serviço</p>
                  <div className="text-5xl font-black">R$ {studentFee.toFixed(2)}</div>
                  <p className="text-slate-500 text-xs mt-2">Por agendamento</p>
                  <Button 
                    onClick={handlePayment} 
                    disabled={isLoading}
                    className="mt-6 bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : 'Pagar Taxa de Serviço'}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black">Quanto você quer ganhar?</h2>
              </div>
              <div className="max-w-xl mx-auto bg-white/5 p-8 rounded-3xl border border-white/10">
                <div className="flex justify-between items-end mb-4">
                  <label className="text-sm font-bold text-slate-400">Preço da sua aula / hora</label>
                  <span className="text-3xl font-black text-primary">R$ {pricePerHour}</span>
                </div>
                <Slider value={[pricePerHour]} onValueChange={(val) => setPricePerHour(val[0])} min={40} max={200} step={5} className="py-4" />
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {essentialPlan && <div className="p-4 bg-slate-900 rounded-xl"><p className="text-xs text-slate-500">{essentialPlan.plan_name}</p><p className="text-2xl font-black">R$ {earningsEssential.toFixed(2)}</p></div>}
                  {proPlan && <div className="p-4 bg-primary/10 rounded-xl border border-primary/20"><p className="text-xs text-primary">{proPlan.plan_name} ✨</p><p className="text-2xl font-black text-primary">R$ {earningsPro.toFixed(2)}</p></div>}
                </div>
              </div>
            </div>
          </section>

          <section className="py-24 bg-white/5">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-black text-center mb-16">Planos para Instrutores</h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => {
                  const isPopular = plan.plan_slug === 'pro';
                  return (
                    <Card key={plan.id} className={`${isPopular ? 'bg-gradient-to-br from-slate-900 to-primary/20 border-primary/30' : 'bg-slate-900 border-white/10'} rounded-[2rem]`}>
                      {isPopular && <div className="text-center text-xs font-bold text-primary pt-4">MAIS POPULAR</div>}
                      <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-3xl font-black text-white">{plan.plan_name}</CardTitle>
                        <div className="mt-6">
                          {plan.monthly_price > 0 ? <span className="text-5xl font-black text-white">R$ {plan.monthly_price.toFixed(2).replace('.', ',')}</span> : <span className="text-5xl font-black text-white">Grátis</span>}
                          <span className="text-slate-500 ml-2">/mês</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8">
                        <ul className="space-y-4 mb-8">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-slate-300 text-sm">
                              <CheckCircle className="text-primary h-4 w-4" />{feature}
                            </li>
                          ))}
                        </ul>
                        <Button className={`w-full h-12 font-black rounded-xl ${isPopular ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
                          {isPopular ? 'Quero ser Pro' : 'Começar Grátis'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
