import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, X, FileText, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InstructorWithKYC {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  cnh_number?: string;
  cnh_category?: string;
  cnh_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
}

export function VerificationQueue() {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: pendingInstructors, refetch, isLoading } = useQuery({
    queryKey: ["admin-verification-queue"],
    queryFn: async () => {
      // Fetch instructors who are 'pending' or explicitly requested verification
      // For now, we assume 'pending' status implies a need for verification
      // and we filter for those who have a CNH uploaded (if we can check that field)
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as unknown as InstructorWithKYC[];
    },
  });

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? 'approved' : 'rejected'; // or 'suspended' based on enum
    // Note: 'rejected' might not be a valid enum in DB, usually 'suspended' or just delete.
    // Let's use 'suspended' for rejection or 'approved' for success.
    const statusToUpdate = action === 'approve' ? 'approved' : 'suspended';

    const { error } = await supabase
        .from("instructors")
        .update({ status: statusToUpdate })
        .eq("id", id);

    if (error) {
        toast({ title: "Erro", description: "Falha ao atualizar status.", variant: "destructive" });
    } else {
        toast({ title: "Sucesso", description: `Instrutor ${action === 'approve' ? 'Verificado' : 'Rejeitado'}.` });
        refetch();
    }
  };

  if (isLoading) return <div>Carregando fila de verificação...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold tracking-tight">Fila de Verificação (KYC)</h2>
         <p className="text-muted-foreground">Analise os documentos enviados pelos instrutores.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pendingInstructors?.map((instructor) => (
          <Card key={instructor.id} className="overflow-hidden">
            <CardHeader className="pb-3">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                     </div>
                     <div>
                        <CardTitle className="text-base">{instructor.name}</CardTitle>
                        <CardDescription className="text-xs">{instructor.email}</CardDescription>
                     </div>
                  </div>
                  <Badge variant="outline">Pendente</Badge>
               </div>
            </CardHeader>
            <CardContent className="pb-3 text-sm space-y-2">
                <div className="flex justify-between">
                   <span className="text-muted-foreground">CPF:</span>
                   <span>{instructor.cpf || "Não informado"}</span>
                </div>
                      <div className="flex justify-between">
                         <span className="text-muted-foreground">CNH:</span>
                         <span>{instructor.cnh_number || "Não informado"}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-muted-foreground">Categoria:</span>
                         <span>{instructor.cnh_category || "Não informado"}</span>
                      </div>
                   </CardContent>
                   <CardFooter className="bg-slate-50 dark:bg-slate-900/50 p-4 flex flex-col gap-3">
                      <Dialog>
                         <DialogTrigger asChild>
                            <Button variant="outline" className="w-full" disabled={!instructor.cnh_url}>
                               <FileText className="w-4 h-4 mr-2" />
                               Ver Documento (CNH)
                            </Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                            <DialogHeader>
                               <DialogTitle>Documento de {instructor.name}</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 bg-slate-100 dark:bg-slate-950 rounded-lg flex items-center justify-center overflow-hidden border">
                                  {instructor.cnh_url ? (
                                    <iframe 
                                        src={instructor.cnh_url} 
                                        className="w-full h-full object-contain" 
                                        title={`CNH de ${instructor.name}`}
                                    />
                                  ) : (
                                      <div className="text-center p-6">
                                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                        <p className="text-muted-foreground">
                                              Nenhum documento encontrado.
                                        </p>
                                      </div>
                                  )}
                            </div>
                            <div className="mt-4 flex gap-4 text-sm bg-muted/50 p-3 rounded-md">
                                <div><strong>CNH:</strong> {instructor.cnh_number || "N/A"}</div>
                                <div><strong>Categoria:</strong> {instructor.cnh_category || "N/A"}</div>
                                <div><strong>CPF:</strong> {instructor.cpf || "N/A"}</div>
                            </div>
                         </DialogContent>
                      </Dialog>

               <div className="flex gap-2 w-full">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleAction(instructor.id, 'approve')}>
                     <Check className="w-4 h-4 mr-2" />
                     Aprovar
                  </Button>
                  <Button variant="outline" className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleAction(instructor.id, 'reject')}>
                     <X className="w-4 h-4 mr-2" />
                     Rejeitar
                  </Button>
               </div>
            </CardFooter>
          </Card>
        ))}
        {(!pendingInstructors || pendingInstructors.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
                <p>Nenhuma verificação pendente.</p>
            </div>
        )}
      </div>
    </div>
  );
}
