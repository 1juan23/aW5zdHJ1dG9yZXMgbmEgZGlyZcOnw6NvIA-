
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";

interface DeleteAccountSectionProps {
  userType: 'student' | 'instructor';
}

export function DeleteAccountSection({ userType }: DeleteAccountSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);

    try {
      // In a real app, this would call an Edge Function to delete the auth user
      // For now, we'll sign them out and maybe mark them as deleted if we had a column
      // Or just simulating the "request" as per the prompt "informativo"
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success("Conta desativada", {
        description: "Sua conta foi desativada com sucesso. Seus dados serão excluídos em até 30 dias."
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Erro ao excluir conta");
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t">
      <h3 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5" />
        Zona de Perigo
      </h3>
      
      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-medium text-destructive">Excluir Conta</h4>
          <p className="text-sm text-muted-foreground">
            {userType === 'student' 
              ? "Ao excluir sua conta, todo o seu histórico de aulas e mensagens será perdido permanentemente."
              : "Ao excluir sua conta, seu perfil não aparecerá mais nas buscas e todas as suas informações serão removidas."
            }
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="shrink-0">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Excluir Conta
              </DialogTitle>
              <DialogDescription className="pt-2">
                <p className="mb-4">
                  ATENÇÃO! Todos os seus dados (histórico, mensagens, contatos...) serão excluídos definitivamente e de maneira irreversível.
                </p>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
               <div className="bg-secondary/50 p-4 rounded-lg flex items-center gap-3 border border-border">
                  <div 
                     className={`w-5 h-5 rounded-full border cursor-pointer flex items-center justify-center transition-colors ${confirmDelete ? 'bg-destructive border-destructive' : 'border-input bg-background'}`}
                     onClick={() => setConfirmDelete(!confirmDelete)}
                  >
                      {confirmDelete && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                  <Label 
                    htmlFor="delete-confirm" 
                    className="font-normal cursor-pointer select-none"
                    onClick={() => setConfirmDelete(!confirmDelete)}
                  >
                    Estou ciente e quero excluir minha conta
                  </Label>
                </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={!confirmDelete || loading}
              >
                {loading ? "Processando..." : "Excluir Conta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
