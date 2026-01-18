import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PauseCircle, PlayCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PauseSubscriptionModalProps {
  subscription: {
    id: string;
    instructor_id: string;
    instructor?: { name: string; email: string } | null;
    paused_at?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PauseSubscriptionModal({ subscription, open, onOpenChange, onSuccess }: PauseSubscriptionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const isPaused = !!subscription?.paused_at;

  const handleTogglePause = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (isPaused) {
        // Unpause - reativar o plano
        const { error } = await supabase
          .from('instructor_subscriptions')
          .update({
            paused_at: null,
            paused_by: null,
            is_active: true, // Reativar o plano
          })
          .eq('id', subscription.id);

        if (error) throw error;

        // Log admin action
        await supabase.from('admin_action_logs').insert({
          admin_user_id: user?.id || '',
          target_instructor_id: subscription.instructor_id,
          action: 'unpause_subscription',
          previous_status: 'paused',
          new_status: 'active',
          notes: 'Plano reativado pelo administrador',
        });

        toast({
          title: "Plano reativado",
          description: `O plano de ${subscription.instructor?.name || 'Instrutor'} foi reativado.`,
        });
      } else {
        // Pause - pausar o plano
        const { error } = await supabase
          .from('instructor_subscriptions')
          .update({
            paused_at: new Date().toISOString(),
            paused_by: user?.id,
            is_active: false, // Desativar o plano
          })
          .eq('id', subscription.id);

        if (error) throw error;

        // Log admin action
        await supabase.from('admin_action_logs').insert({
          admin_user_id: user?.id || '',
          target_instructor_id: subscription.instructor_id,
          action: 'pause_subscription',
          previous_status: 'active',
          new_status: 'paused',
          notes: reason || 'Plano pausado pelo administrador',
        });

        toast({
          title: "Plano pausado",
          description: `O plano de ${subscription.instructor?.name || 'Instrutor'} foi pausado.`,
        });
      }

      setReason("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Erro", 
        description: "Falha ao alterar status do plano.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPaused ? (
              <>
                <PlayCircle className="w-5 h-5 text-green-600" />
                Reativar Plano
              </>
            ) : (
              <>
                <PauseCircle className="w-5 h-5 text-amber-600" />
                Pausar Plano
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isPaused 
              ? "Reative o plano para que o instrutor volte a ter acesso aos recursos."
              : "Pausar o plano suspende temporariamente os benefícios do instrutor."
            }
          </DialogDescription>
        </DialogHeader>

        <Alert className={isPaused ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {isPaused ? (
              <>
                O plano de <strong>{subscription?.instructor?.name}</strong> está pausado desde{" "}
                {subscription?.paused_at ? new Date(subscription.paused_at).toLocaleDateString() : "data desconhecida"}.
              </>
            ) : (
              <>
                Você está prestes a pausar o plano de <strong>{subscription?.instructor?.name}</strong>.
              </>
            )}
          </AlertDescription>
        </Alert>

        {!isPaused && (
          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Textarea
              placeholder="Informe o motivo da pausa..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant={isPaused ? "default" : "destructive"}
            onClick={handleTogglePause} 
            disabled={loading}
            className={isPaused ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isPaused ? (
              <PlayCircle className="w-4 h-4 mr-2" />
            ) : (
              <PauseCircle className="w-4 h-4 mr-2" />
            )}
            {loading ? "Processando..." : isPaused ? "Reativar Plano" : "Pausar Plano"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
