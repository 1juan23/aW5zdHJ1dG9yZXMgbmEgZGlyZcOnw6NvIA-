import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface DeleteStudentModalProps {
  student: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteStudentModal({ student, open, onOpenChange, onSuccess }: DeleteStudentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  const handleDelete = async () => {
    if (!student) return;
    
    if (confirmEmail !== student.email) {
      toast({ 
        title: "Email não corresponde", 
        description: "Digite o email exato do aluno para confirmar.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      // Delete related data first
      await supabase.from('student_instructor_access').delete().eq('student_id', student.user_id);
      await supabase.from('lessons').delete().eq('student_id', student.user_id);
      await supabase.from('reviews').delete().eq('student_id', student.user_id);
      await supabase.from('favorites').delete().eq('user_id', student.user_id);
      await supabase.from('messages').delete().eq('sender_id', student.user_id);
      await supabase.from('conversations').delete().eq('student_id', student.user_id);
      await supabase.from('support_tickets').delete().eq('user_id', student.user_id);
      
      // Delete profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: "Aluno removido",
        description: `${student.name} foi removido da plataforma.`,
      });

      setConfirmEmail("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Erro", 
        description: "Falha ao remover aluno. Pode haver dados vinculados.", 
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
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Excluir Aluno
          </DialogTitle>
          <DialogDescription>
            Esta ação é irreversível e removerá todos os dados do aluno.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você está prestes a excluir <strong>{student?.name}</strong>. 
            Isso removerá todas as aulas, avaliações e mensagens associadas.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Digite o email do aluno para confirmar:</Label>
            <Input
              placeholder={student?.email}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading || confirmEmail !== student?.email}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            {loading ? "Excluindo..." : "Excluir Aluno"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
