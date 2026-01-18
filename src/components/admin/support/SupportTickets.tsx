import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SupportTicket } from "@/types/admin-tables";

export function SupportTickets() {
  const { toast } = useToast();

  const { data: tickets, refetch, isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
         console.warn("Support tickets fetch error:", error);
         return [];
      }
      
      // Fetch profiles separately to get user names
      const userIds = [...new Set((data || []).map(t => t.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);
      
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      return (data || []).map(ticket => ({
        ...ticket,
        profile: profileMap.get(ticket.user_id) || null
      })) as SupportTicket[];
    },
  });

  const handleResolve = async (id: string) => {
    const { error } = await supabase
        .from("support_tickets")
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq("id", id);
    
    if (error) {
        toast({ title: "Erro", description: "Falha ao resolver chamado.", variant: "destructive" });
    } else {
        toast({ title: "Resolvido", description: "Chamado marcado como resolvido." });
        refetch();
    }
  };

  if (isLoading) return <div>Carregando chamados...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold tracking-tight">Suporte e Disputas</h2>
         <Button>Novo Chamado (Interno)</Button>
      </div>

      <div className="grid gap-4">
        {tickets?.map(ticket => (
          <Card key={ticket.id}>
            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-full ${ticket.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {ticket.status === 'resolved' ? <CheckCircle className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground">{ticket.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.profile?.name || "Usuário"}</span>
                        <span>•</span>
                        <span>{new Date(ticket.created_at).toLocaleString()}</span>
                    </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-3 self-end md:self-center">
                 <Badge variant={ticket.status === 'resolved' ? 'secondary' : 'destructive'} className={ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : ''}>
                    {ticket.status === 'resolved' ? 'Resolvido' : 'Em Aberto'}
                 </Badge>
                 {ticket.status !== 'resolved' && (
                    <Button variant="outline" size="sm" onClick={() => handleResolve(ticket.id)}>
                        Resolver
                    </Button>
                 )}
               </div>
            </CardContent>
          </Card>
        ))}
        
        {(!tickets || tickets.length === 0) && (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-muted-foreground">Nenhum chamado aberto.</p>
                <p className="text-xs text-muted-foreground mt-1">(Certifique-se de rodar a migration 'admin_features')</p>
            </div>
        )}
      </div>
    </div>
  );
}
