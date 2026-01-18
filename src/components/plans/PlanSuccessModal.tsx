import { useEffect, useState } from "react";
import { SubscriptionData } from "@/hooks/useInstructorSubscription";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

interface PlanSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  subscription?: SubscriptionData | null;
}

export function PlanSuccessModal({
  isOpen,
  onClose,
  planName = "Novo Plano",
  subscription,
}: PlanSuccessModalProps) {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const random = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval: NodeJS.Timeout = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Delay content fade-in slightly for dramatic effect
      setTimeout(() => setShowContent(true), 300);

      return () => clearInterval(interval);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  const handleDashboardRedirect = () => {
    navigate("/instrutor/dashboard", { 
      state: { 
        refreshedSubscription: subscription 
      } 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 border-emerald-500/50 text-white backdrop-blur-xl shadow-2xl shadow-emerald-500/20">
        <DialogHeader className="space-y-6 flex flex-col items-center text-center pt-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-bounce-slow">
              <Check className="w-10 h-10 text-emerald-400" strokeWidth={3} />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
          </div>

          <div
            className={`space-y-2 transition-all duration-700 ${
              showContent
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Plano Ativado com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-base">
              Seu perfil agora tem acesso a todos os benefícios exclusivos do
              plano{" "}
              <span className="text-emerald-400 font-semibold">{planName}</span>
              .
            </DialogDescription>
          </div>
        </DialogHeader>

        <div
          className={`flex flex-col gap-3 py-6 px-4 transition-all duration-1000 delay-300 ${
            showContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <Button
            onClick={handleDashboardRedirect}
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/25 h-12 text-lg transform transition-all hover:scale-[1.02]"
          >
            Ir para meu Dashboard
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-500 hover:text-white hover:bg-white/10"
          >
            Continuar nesta página
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
