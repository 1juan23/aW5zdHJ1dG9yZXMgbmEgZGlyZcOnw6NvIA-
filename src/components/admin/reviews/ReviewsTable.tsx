import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Star, Trash2, AlertOctagon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ReviewsTable() {
  const { toast } = useToast();

  const { data: reviews, refetch, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      // First get reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          *,
          lesson:lessons(scheduled_at)
        `)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      // Then get student profiles separately
      const studentIds = [...new Set(reviewsData?.map(r => r.student_id) || [])];
      
      let profilesMap: Record<string, { name: string | null; email: string | null }> = {};
      
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", studentIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = { name: p.name, email: p.email };
          return acc;
        }, {} as Record<string, { name: string | null; email: string | null }>);
      }

      // Merge the data
      return reviewsData?.map(review => ({
        ...review,
        student: profilesMap[review.student_id] || { name: null, email: null }
      })) || [];
    },
  });

  const handleDelete = async (reviewId: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    
    if (error) {
       toast({ title: "Erro", description: "Falha ao remover avaliação.", variant: "destructive" });
    } else {
       toast({ title: "Sucesso", description: "Avaliação removida." });
       refetch();
    }
  };

  if (isLoading) return <div>Carregando avaliações...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Moderação de Avaliações</h2>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nota</TableHead>
              <TableHead>Comentário</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews?.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{review.rating}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                </TableCell>
                <TableCell className="max-w-md truncate" title={review.comment || ""}>
                  {review.comment || <span className="italic text-muted-foreground">Sem comentário</span>}
                </TableCell>
                <TableCell>
                   <div className="font-medium">{review.student?.name || "Anônimo"}</div>
                   <div className="text-xs text-muted-foreground">{review.student?.email}</div>
                </TableCell>
                <TableCell>
                  {new Date(review.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover Avaliação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita. A avaliação será excluída permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(review.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
             {(!reviews || reviews.length === 0) && (
              <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma avaliação encontrada.
                  </TableCell>
              </TableRow>
             )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
