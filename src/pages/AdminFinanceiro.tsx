import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, ArrowUpRight, Wallet, History, Loader2, ShieldAlert } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LessonWithDetails {
  id: string;
  scheduled_at: string;
  price: number;
  status: string;
  created_at: string;
  student_name?: string;
  instructor_name?: string;
}

export default function AdminFinanceiro() {
  const { isAdmin, loading: loadingRole } = useAdminRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVolume: 0,
    platformRevenue: 0,
    instructorPayouts: 0,
    totalLessons: 0
  });
  const [recentLessons, setRecentLessons] = useState<LessonWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchFinancialData = useCallback(async () => {
    try {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (lessons) {
        const totalVolume = lessons.reduce((acc, l) => acc + (l.price || 0), 0);
        const platformFeePercentage = 0.15;
        const platformRevenue = totalVolume * platformFeePercentage;
        const instructorPayouts = totalVolume - platformRevenue;

        setStats({
          totalVolume,
          platformRevenue,
          instructorPayouts,
          totalLessons: lessons.length
        });
        
        setRecentLessons(lessons.map(l => ({
          id: l.id,
          scheduled_at: l.scheduled_at,
          price: l.price,
          status: l.status,
          created_at: l.created_at
        })));
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as informações financeiras.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!loadingRole && isAdmin) {
      fetchFinancialData();
    }
  }, [fetchFinancialData, loadingRole, isAdmin]);

  // Loading state
  if (loadingRole || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-6 space-y-4">
              <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar esta página. Esta área é restrita a administradores.
              </p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Voltar para Início
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestão Financeira</h1>
              <p className="text-muted-foreground">Acompanhe o volume de transações e receitas da plataforma.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
               <span className="text-sm font-medium text-primary">Taxa da Plataforma: 15%</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-primary to-primary-foreground text-white group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                 <Wallet className="h-12 w-12" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-80">Volume Total</CardTitle>
                <CardDescription className="text-2xl font-bold text-white">
                  R$ {stats.totalVolume.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs opacity-80">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Total transacionado</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white dark:bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receita Plataforma</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">
                  R$ {stats.platformRevenue.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  <span>Líquido (15%)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white dark:bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Repasse Instrutores</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">
                  R$ {stats.instructorPayouts.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-blue-500">
                  <Users className="h-3 w-3" />
                  <span>85% do volume</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white dark:bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Aulas</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">
                  {stats.totalLessons}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <History className="h-3 w-3" />
                  <span>Histórico completo</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions Table */}
          <Card className="shadow-xl border-none">
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>Lista detalhada das últimas aulas agendadas.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Comissão (15%)</TableHead>
                    <TableHead className="text-right">Repasse (85%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLessons.length > 0 ? (
                    recentLessons.map((lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell className="font-medium text-xs">
                           {format(new Date(lesson.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            lesson.status === 'completed' ? 'default' : 
                            lesson.status === 'pending' ? 'outline' : 
                            lesson.status === 'cancelled' ? 'destructive' : 'secondary'
                          } className={`text-[10px] uppercase ${lesson.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                            {lesson.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          R$ {lesson.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-green-600">
                          R$ {(lesson.price * 0.15).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          R$ {(lesson.price * 0.85).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                         Nenhuma transação encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
