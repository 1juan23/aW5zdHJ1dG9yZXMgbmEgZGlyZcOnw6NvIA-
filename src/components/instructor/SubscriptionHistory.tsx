import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, CreditCard, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoryRecord {
  id: string;
  plan_type: string;
  started_at: string;
  ended_at: string | null;
  amount_paid: number | null;
  status: string;
  created_at: string;
}

const PLAN_NAMES: Record<string, string> = {
  trial: "Trial",
  essencial: "Essencial",
  destaque: "Destaque",
  elite: "Elite",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  active: { label: "Ativo", variant: "default", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", variant: "destructive", icon: XCircle },
  expired: { label: "Expirado", variant: "secondary", icon: Clock },
};

export function SubscriptionHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: instructor } = await supabase
          .from("instructors")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!instructor) return;

        const { data, error } = await supabase
          .from("subscription_history")
          .select("*")
          .eq("instructor_id", instructor.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error("Error fetching subscription history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Assinaturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum histórico de assinatura encontrado.</p>
            <p className="text-sm mt-1">Seu histórico aparecerá aqui após sua primeira assinatura.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Assinaturas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((record) => {
            const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.expired;
            const StatusIcon = statusConfig.icon;
            
            return (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {PLAN_NAMES[record.plan_type] || record.plan_type}
                      </span>
                      <Badge variant={statusConfig.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.started_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {record.ended_at && (
                        <>
                          <span>→</span>
                          {format(new Date(record.ended_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {record.amount_paid && (
                  <div className="text-right">
                    <span className="font-semibold text-foreground">
                      R$ {record.amount_paid.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}