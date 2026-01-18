import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Users, GraduationCap, Car, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function BroadcastHistory() {
  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ["admin-broadcast-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcasts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const getTargetIcon = (target: string) => {
    switch (target) {
      case 'instructor':
        return <Car className="w-4 h-4" />;
      case 'student':
        return <GraduationCap className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case 'instructor':
        return 'Instrutores';
      case 'student':
        return 'Alunos';
      default:
        return 'Todos';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Histórico de Transmissões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Mensagem</TableHead>
              <TableHead>Público</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {broadcasts?.map((broadcast) => (
              <TableRow key={broadcast.id}>
                <TableCell className="font-medium">
                  {broadcast.title}
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="truncate text-muted-foreground">
                    {broadcast.message}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1">
                    {getTargetIcon(broadcast.target_role)}
                    {getTargetLabel(broadcast.target_role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(broadcast.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!broadcasts || broadcasts.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma transmissão enviada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
