import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, Clock } from "lucide-react";

interface BookingModalProps {
  instructor: {
    id: string;
    name: string;
    price: number | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedTime: string | null;
  onSuccess: () => void;
}

export function BookingModal({
  instructor,
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  onSuccess,
}: BookingModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!instructor || !selectedDate || !selectedTime) return null;

  const priceAmount = instructor.price || 0;

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para agendar uma aula.",
          variant: "destructive",
        });
        return;
      }

      // Save pending booking to localStorage
      const pendingBooking = {
        instructor,
        selectedDate: selectedDate.toISOString(),
        selectedTime,
        priceAmount
      };
      
      localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));

      // Create checkout session for booking fee
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          instructor_id: instructor.id,
          paymentType: 'booking' // New parameter to signal booking fee
        }
      });

      if (error) throw error;
      if (!data?.url) throw new Error("Erro ao criar pagamento");

      // Redirect to Stripe
      window.location.href = data.url;

    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Erro no agendamento",
        description: "Não foi possível iniciar o pagamento da taxa. Tente novamente.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Agendamento</DialogTitle>
          <DialogDescription>
             Revise os detalhes da sua aula prática.
          </DialogDescription>
        </DialogHeader>
        

          <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
             <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">Instrutor(a)</p>
                <p className="text-sm text-muted-foreground">{instructor.name}</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1 p-3 border rounded-lg">
                <div className="flex items-center gap-2 text-primary">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-semibold">Data</span>
                </div>
                <span className="text-sm">
                    {selectedDate.toLocaleDateString('pt-BR')}
                </span>
             </div>
             
             <div className="flex flex-col gap-1 p-3 border rounded-lg">
                <div className="flex items-center gap-2 text-primary">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-semibold">Horário</span>
                </div>
                <span className="text-sm">
                    {selectedTime}
                </span>
             </div>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-primary/5 border border-primary/10 rounded-lg mt-2">
             <div className="space-y-2">
               <div className="flex justify-between items-center text-muted-foreground text-sm">
                   <span>Valor da Aula</span>
                   <span>R$ {priceAmount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-muted-foreground text-sm">
                   <span>Taxa de Agendamento</span>
                   <span>R$ 5,00</span>
               </div>
               <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold text-lg text-primary">
                   <span>Total (Taxa)</span>
                   <span>R$ 5,00</span>
               </div>
               <p className="text-xs text-muted-foreground mt-1">
                 * O valor da aula (R$ {priceAmount.toFixed(2)}) será pago diretamente ao instrutor. 
                 Agora você pagará apenas a taxa de agendamento.
               </p>
             </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmBooking} disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sim, pagar taxa de R$ 5,00
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
