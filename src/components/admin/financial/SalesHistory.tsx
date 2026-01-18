import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Calendar, CreditCard, PauseCircle, PlayCircle, Crown } from "lucide-react";
import { PauseSubscriptionModal } from "../subscriptions/PauseSubscriptionModal";

interface SubscriptionWithInstructor {
  id: string;
  instructor_id: string;
  plan_type: string;
  is_active: boolean;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  paused_at: string | null;
  instructor: { name: string; email: string; city: string } | null;
}

export function SalesHistory() {
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubscriptionWithInstructor | null>(null);

  const { data: sales, isLoading, refetch } = useQuery({
    queryKey: ["admin-sales-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_subscriptions")
        .select(`
          *,
          instructor:instructors(name, email, city)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SubscriptionWithInstructor[];
    },
  });

  const paidPlans = sales?.filter(s => s.plan_type !== 'trial' && s.is_active && !s.paused_at) || [];
  const activeSubs = sales?.filter(s => s.is_active && !s.paused_at) || [];
  const pausedSubs = sales?.filter(s => s.paused_at) || [];

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'elite':
        return <Badge className="bg-amber-500 text-white">Elite</Badge>;
      case 'destaque':
        return <Badge className="bg-blue-500 text-white">Destaque</Badge>;
      case 'essencial':
        return <Badge className="bg-green-500 text-white">Essencial</Badge>;
      default:
        return <Badge variant="secondary">Trial</Badge>;
    }
  };

  const handlePauseClick = (sub: SubscriptionWithInstructor) => {
    setSelectedSub(sub);
    setPauseModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubs.length}</div>
            <p className="text-xs text-muted-foreground">Instrutores com plano ativo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Pagos</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidPlans.length}</div>
            <p className="text-xs text-muted-foreground">Instrutores com plano premium</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pausados</CardTitle>
            <PauseCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pausedSubs.length}</div>
            <p className="text-xs text-muted-foreground">Planos temporariamente pausados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle>Histórico de Assinaturas</CardTitle>
                <CardDescription>Registro de adesões e renovações de planos.</CardDescription>
            </div>
            <Button variant="outline" size="sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instrutor</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales?.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="font-medium">{sale.instructor?.name || "Instrutor Removido"}</div>
                      <div className="text-xs text-muted-foreground">{sale.instructor?.email}</div>
                    </TableCell>
                    <TableCell>
                      {getPlanBadge(sale.plan_type)}
                    </TableCell>
                    <TableCell>
                      {sale.paused_at ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                          <PauseCircle className="w-3 h-3" />
                          Pausado
                        </Badge>
                      ) : sale.is_active ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {sale.subscription_started_at ? new Date(sale.subscription_started_at).toLocaleDateString() : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {sale.subscription_ends_at ? new Date(sale.subscription_ends_at).toLocaleDateString() : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePauseClick(sale)}
                        className={sale.paused_at ? "text-green-600 hover:text-green-700" : "text-amber-600 hover:text-amber-700"}
                      >
                        {sale.paused_at ? (
                          <>
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Reativar
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-4 h-4 mr-1" />
                            Pausar
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {(!sales || sales.length === 0) && (
                <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma venda registrada.
                   </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PauseSubscriptionModal
        subscription={selectedSub}
        open={pauseModalOpen}
        onOpenChange={setPauseModalOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
