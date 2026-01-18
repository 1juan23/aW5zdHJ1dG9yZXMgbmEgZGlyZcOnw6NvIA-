import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState } from "@/components/ui/LoadingState";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar } from "lucide-react";

interface ConversionMetrics {
  totalProfiles: number;
  totalInstructors: number;
  approvedInstructors: number;
  activeInstructors: number;
  conversionRate: number;
}

interface RevenueByPlan {
  planName: string;
  revenue: number;
  subscribers: number;
}

interface LessonTimeline {
  date: string;
  count: number;
}

const COLORS = ['#FFC107', '#0423ca', '#10b981', '#f59e0b', '#8b5cf6'];

export function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null);
  const [revenueByPlan, setRevenueByPlan] = useState<RevenueByPlan[]>([]);
  const [lessonsTimeline, setLessonsTimeline] = useState<LessonTimeline[]>([]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Fetch conversion metrics
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id');

        const { data: instructors } = await supabase
          .from('instructors')
          .select('status');

        const totalProfiles = profiles?.length || 0;
        const totalInstructors = instructors?.length || 0;
        const approvedInstructors = instructors?.filter(i => i.status === 'approved').length || 0;
        const activeInstructors = instructors?.filter(i => i.status === 'approved').length || 0;
        const conversionRate = totalProfiles > 0 ? (approvedInstructors / totalProfiles) * 100 : 0;

        setConversionMetrics({
          totalProfiles,
          totalInstructors,
          approvedInstructors,
          activeInstructors,
          conversionRate
        });

        // Fetch revenue by plan (mock data for now since pricing_plans table doesn't exist)
        setRevenueByPlan([
          { planName: 'Plano Iniciante', revenue: 2495, subscribers: 50 },
          { planName: 'Plano Elite', revenue: 5391, subscribers: 90 }
        ]);

        // Fetch lessons timeline
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: lessons } = await supabase
          .from('lessons')
          .select('created_at, status')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at');

        // Group by day
        const lessonsByDay: { [key: string]: number } = {};
        lessons?.forEach(lesson => {
          const date = new Date(lesson.created_at).toLocaleDateString('pt-BR');
          lessonsByDay[date] = (lessonsByDay[date] || 0) + 1;
        });

        const timeline = Object.entries(lessonsByDay).map(([date, count]) => ({
          date,
          count
        }));

        setLessonsTimeline(timeline);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState variant="spinner" size="lg" text="Carregando analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionMetrics?.totalProfiles || 0}</div>
            <p className="text-xs text-muted-foreground">Todos os perfis cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instrutores Aprovados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionMetrics?.approvedInstructors || 0}</div>
            <p className="text-xs text-muted-foreground">
              {conversionMetrics?.conversionRate.toFixed(1)}% taxa de conversão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {revenueByPlan.reduce((sum, plan) => sum + plan.revenue, 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Mensal recorrente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas (30d)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lessonsTimeline.reduce((sum, day) => sum + day.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Plano</CardTitle>
            <CardDescription>Distribuição de receita entre planos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByPlan}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ planName, revenue }) => `${planName}: R$ ${revenue}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {revenueByPlan.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscribers by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Assinantes por Plano</CardTitle>
            <CardDescription>Número de instrutores em cada plano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByPlan}>
                <XAxis dataKey="planName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="subscribers" fill="#FFC107" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lessons Timeline */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Aulas ao Longo do Tempo</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={lessonsTimeline}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFC107" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FFC107" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#FFC107" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
