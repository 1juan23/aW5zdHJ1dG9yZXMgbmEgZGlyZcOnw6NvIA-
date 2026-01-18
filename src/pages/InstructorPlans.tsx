import { ArrowLeft, CheckCircle2, Sparkles, Shield, Rocket, Loader2, Star, TrendingUp } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanSuccessModal } from "@/components/plans/PlanSuccessModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { SubscriptionData } from "@/hooks/useInstructorSubscription";
import { PLANS } from "@/constants/plans";



export default function InstructorPlans() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        setLoading(false);
        return null;
      }

      const { data, error } = await supabase.functions.invoke('check-instructor-subscription', {
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (error) throw error;
      if (data?.subscription) {
        setSubscription(data.subscription);
        return data.subscription as SubscriptionData;
      }
      return null;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleCheckoutReturn = async () => {
      if (searchParams.get('success') === 'true') {
        setIsVerifying(true);
        // Removed generic toast to avoid cluttering UI behind the overlay
        
        setSearchParams({});
        
        let attempts = 0;
        const maxAttempts = 5; 
        
        const pollSubscription = async () => {
          attempts++;
          const sub = await checkSubscription();
          
          if (sub && sub.planType !== 'trial' && sub.planType !== 'expired') {
            setIsVerifying(false);
            setShowSuccessModal(true);
            toast({
              title: "Plano ativado!",
              description: `Seu plano ${sub.planType} já está ativo.`,
            });
            localStorage.removeItem('pending_plan');
            return;
          }

          if (attempts < maxAttempts) {
            setTimeout(pollSubscription, 1000); 
          } else {
             // FALLBACK: Construct optimistic subscription from localStorage
             const pendingPlan = localStorage.getItem('pending_plan');
             
             setIsVerifying(false);
             if (pendingPlan) {
               console.log('Using optimistic subscription for:', pendingPlan);
               const optimisticSub: SubscriptionData = {
                 planType: pendingPlan,
                 isActive: true,
                 // Mock dates for immediate display
                 subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                 daysRemaining: 30,
               };
               
               setSubscription(optimisticSub);
               setShowSuccessModal(true);
               
               localStorage.removeItem('pending_plan');
             } else {
               setShowSuccessModal(true);
             }
          }
        };

        pollSubscription(); // Start polling
      }

      if (searchParams.get('canceled') === 'true') {
        toast({
          title: "Checkout cancelado",
          description: "Você pode assinar a qualquer momento.",
          variant: "destructive",
        });
        setSearchParams({});
        localStorage.removeItem('pending_plan');
      }
    };
    handleCheckoutReturn();
  }, [searchParams, toast, setSearchParams, checkSubscription]);

  useEffect(() => {
    checkSubscription();
    
    // Set up realtime subscription for plan changes
    const channel = supabase
      .channel('instructor-subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instructor_subscriptions',
        },
        () => {
          // Refetch subscription on any change
          checkSubscription();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCheckout = async (planSlug: string) => {
    if (planSlug === 'trial') return;
    
    setCheckoutLoading(planSlug);
    try {
      // Save intent to localStorage for optimistic update on return
      localStorage.setItem('pending_plan', planSlug);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast({
          title: "Faça login primeiro",
          description: "Você precisa estar logado para assinar um plano.",
          variant: "destructive",
        });
        navigate('/instrutor/login');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-instructor-checkout', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body: { planType: planSlug }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao iniciar checkout",
        variant: "destructive",
      });
      // Clear intent on error
      localStorage.removeItem('pending_plan');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return;

      const { data, error } = await supabase.functions.invoke('instructor-portal', {
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao abrir portal",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const getCurrentPlanIndex = () => {
    if (!subscription) return -1;
    return PLANS.findIndex(p => p.slug === subscription.planType);
  };

  const isCurrentPlan = (slug: string) => subscription?.planType === slug;
  const canUpgrade = (planIndex: number) => {
    const currentIndex = getCurrentPlanIndex();
    return currentIndex >= 0 && planIndex > currentIndex;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex size-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold flex-1 text-center pr-10">Planos para Instrutores</h1>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        
        {/* Verification Overlay */}
        {isVerifying && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Confirmando Pagamento</h3>
                <p className="text-slate-400">Estamos validando sua assinatura. Isso leva apenas alguns segundos...</p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section - hide 3 month free badge if user has paid plan */}
        <div className="text-center space-y-6 py-12">
          {(!subscription || subscription.planType === 'trial') && (
            <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" /> 
              Oferta especial: 3 meses grátis para novos instrutores
            </Badge>
          )}
          
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            Invista na sua{' '}
            <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
              carreira
            </span>
          </h2>
          
          <p className="text-slate-400 max-w-lg mx-auto text-lg">
            Escolha o plano ideal para aumentar sua visibilidade e conquistar mais alunos.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="p-1.5 rounded-full bg-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              Cancele quando quiser
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="p-1.5 rounded-full bg-blue-500/20">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              Pagamento 100% seguro
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="p-1.5 rounded-full bg-amber-500/20">
                <Rocket className="w-4 h-4 text-amber-400" />
              </div>
              Resultados imediatos
            </div>
          </div>
        </div>

        {/* Current subscription status */}
        {!loading && subscription && (
          <div className="mb-10 p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-amber-500/10 border border-white/10 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-emerald-500/30 flex items-center justify-center">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Seu plano atual</p>
                  <p className="text-2xl font-bold capitalize">{subscription.planType}</p>
                  {subscription.planType === 'trial' && subscription.daysRemaining && (
                    <p className="text-sm text-amber-400 font-medium">
                      ⏱ {subscription.daysRemaining} dias restantes no trial
                    </p>
                  )}
                </div>
              </div>
              {subscription.isActive && subscription.planType !== 'trial' && (
                <Button 
                  variant="outline" 
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                >
                  {portalLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Gerenciar Assinatura
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
          </div>
        )}

        {/* Plans grid */}
        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, index) => {
              const Icon = plan.icon;
              const isCurrent = isCurrentPlan(plan.slug);
              const isUpgrade = canUpgrade(index);
              const isPlanDisabled = plan.slug === 'trial' || (isCurrent && subscription?.isActive);
              const isElite = plan.slug === 'elite';
              const isDestaque = plan.slug === 'destaque';
              
              return (
                <div 
                  key={plan.id} 
                  className={cn(
                    "relative rounded-3xl p-6 border-2 transition-all duration-500 flex flex-col",
                    "hover:scale-[1.02] hover:-translate-y-1",
                    plan.borderColor,
                    isDestaque && "bg-gradient-to-b from-emerald-500/10 via-slate-900/80 to-slate-900/80 shadow-xl shadow-emerald-500/20",
                    isElite && "bg-gradient-to-b from-amber-500/15 via-slate-900/80 to-slate-900/80 shadow-xl shadow-amber-500/30",
                    !isDestaque && !isElite && "bg-slate-900/60",
                    isCurrent && "ring-2 ring-offset-2 ring-offset-slate-950 ring-emerald-500"
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Popular badge */}
                  {isDestaque && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 px-4 py-1.5 font-bold">
                        <TrendingUp className="w-4 h-4 mr-1.5" /> Mais Popular
                      </Badge>
                    </div>
                  )}
                  
                  {/* Current plan badge */}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4 z-10">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold shadow-lg">
                        ✓ Seu Plano
                      </Badge>
                    </div>
                  )}

                  {/* Icon & Title */}
                  <div className="text-center mb-6">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300",
                      plan.iconBg,
                      isElite && "animate-pulse"
                    )}>
                      <Icon className={cn("w-8 h-8", plan.iconColor)} />
                    </div>
                    <h3 className={cn(
                      "text-2xl font-black mb-2",
                      isElite && "bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"
                    )}>
                      {plan.name}
                    </h3>
                    <p className="text-slate-500 text-sm">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    {plan.price === 0 ? (
                      <div>
                        <span className="text-4xl font-black text-white">Grátis</span>
                        <p className="text-sm text-slate-400 mt-1">{plan.period}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-lg text-slate-400">R$</span>
                          <span className={cn(
                            "text-4xl font-black",
                            isElite ? "bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent" : "text-white"
                          )}>
                            {plan.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <span className="text-slate-500 text-sm">{plan.period}</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className={cn(
                          "w-5 h-5 shrink-0 mt-0.5",
                          plan.checkColor || "text-slate-400"
                        )} />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleCheckout(plan.slug)}
                    disabled={isPlanDisabled || checkoutLoading === plan.slug}
                    size="lg"
                    className={cn(
                      "w-full font-bold text-base py-6 transition-all duration-300",
                      plan.slug === 'trial' && "bg-slate-700 hover:bg-slate-600 text-slate-300",
                      plan.slug === 'essencial' && "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30",
                      plan.slug === 'destaque' && "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30",
                      plan.slug === 'elite' && "bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 hover:from-amber-500 hover:via-yellow-600 hover:to-orange-600 text-slate-900 font-black shadow-lg shadow-amber-500/40",
                      isCurrent && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 shadow-none"
                    )}
                  >
                    {checkoutLoading === plan.slug ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isCurrent ? (
                      "Plano Atual"
                    ) : isUpgrade ? (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Upgrade para {plan.name}
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom trust section */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center gap-4 p-6 rounded-2xl bg-slate-900/50 border border-white/5">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="text-slate-300 font-medium">Pagamento seguro via Stripe</span>
            </div>
            <p className="text-slate-500 text-sm max-w-md">
              Seus dados estão protegidos com criptografia de ponta. Você pode cancelar sua assinatura a qualquer momento sem complicações.
            </p>
          </div>
        </div>
      </main>
      
      <PlanSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
        planName={subscription?.planType || "Novo Plano"}
        subscription={subscription}
      />
    </div>
  );
}
