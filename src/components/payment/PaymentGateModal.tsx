import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Shield, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: () => void;
  instructorName: string;
  instructorId: string;
  actionType: "booking" | "whatsapp" | "message";
}

const SERVICE_FEE = 5.00;

export function PaymentGateModal({
  open,
  onOpenChange,
  onPaymentSuccess,
  instructorName,
  instructorId,
  actionType,
}: PaymentGateModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const actionLabels = {
    booking: "confirmar o agendamento",
    whatsapp: "ver o WhatsApp do instrutor",
    message: "enviar mensagem",
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para continuar",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body: { instructor_id: instructorId }
      });

      if (error) throw error;
      
      if (data?.url) {
        // Store callback info in sessionStorage for after payment
        sessionStorage.setItem('paymentCallback', JSON.stringify({
          action: actionType,
          instructorId,
          instructorName,
          timestamp: Date.now(),
        }));
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Erro no pagamento",
        description: error.message || "Não foi possível processar o pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Taxa de Serviço
          </DialogTitle>
          <DialogDescription className="text-center">
            Para {actionLabels[actionType]} com <strong>{instructorName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Price display */}
          <div className="text-center p-6 bg-primary/5 rounded-2xl border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Valor único</p>
            <div className="text-5xl font-black text-primary">
              R$ {SERVICE_FEE.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pagamento único por agendamento
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span>Acesso ao WhatsApp do instrutor</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span>Chat direto para combinar detalhes</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span>Confirmação do agendamento</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full h-12 text-lg font-semibold gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Pagar R$ {SERVICE_FEE.toFixed(2).replace('.', ',')}
              </>
            )}
          </Button>

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            Pagamento seguro via Stripe
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
