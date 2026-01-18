import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Instructor = Database["public"]["Tables"]["instructors"]["Row"];

interface SuspendModalProps {
  instructor: Instructor | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => Promise<void>;
}

export function SuspendModal({ instructor, open, onClose, onConfirm }: SuspendModalProps) {
  const [justification, setJustification] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!instructor) return null;

  const handleConfirm = async () => {
    if (!justification.trim()) return;
    setIsLoading(true);
    try {
      await onConfirm(justification);
      setJustification("");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Suspender Instrutor
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Você está prestes a suspender o instrutor <strong className="text-white">{instructor.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="justification" className="text-slate-200">
              Justificativa <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="justification"
              placeholder="Informe o motivo da suspensão. Esta mensagem será enviada por email ao instrutor..."
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              O instrutor receberá um email com esta justificativa para poder ajustar seu cadastro.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!justification.trim() || isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Confirmar Suspensão
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
