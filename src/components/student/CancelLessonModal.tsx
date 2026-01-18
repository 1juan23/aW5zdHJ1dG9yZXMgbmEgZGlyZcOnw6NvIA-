import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface CancelLessonModalProps {
  lessonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelLessonModal({ lessonId, open, onOpenChange }: CancelLessonModalProps) {
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: async () => {
      // Update lesson status to cancelled
      const { error } = await supabase
        .from("lessons")
        .update({ status: "cancelled" })
        .eq("id", lessonId);

      if (error) throw error;

      // Send cancellation email
      await supabase.functions.invoke("send-cancellation-email", {
        body: { lessonId, reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-lessons"] });
      toast.success("Aula cancelada com sucesso");
      onOpenChange(false);
      setReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cancelar aula");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancelar Aula
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja cancelar esta aula? O instrutor será notificado por email.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do cancelamento (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Explique o motivo do cancelamento..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              "Confirmar Cancelamento"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
