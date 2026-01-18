import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Eye,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useInstructorMetrics } from "@/hooks/useInstructorMetrics";

interface InstructorMetricsDashboardProps {
  instructorId: string;
  planType: string;
}

export function InstructorMetricsDashboard({ instructorId, planType }: InstructorMetricsDashboardProps) {
  const { data: metrics, isLoading } = useInstructorMetrics(instructorId);

  // Only show full dashboard for Destaque and Elite plans
  const hasPremiumAccess = planType === 'destaque' || planType === 'elite';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // If not premium, show limited metrics with upgrade prompt
  if (!hasPremiumAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Métricas do Dashboard
          </h2>
          <Badge variant="outline">Trial</Badge>
        </div>

        {/* Limited metrics for trial */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
            title="Aulas Realizadas"
            value={metrics.totalLessonsCompleted}
          />
          <MetricCard
            icon={<Calendar className="h-5 w-5 text-blue-500" />}
            title="Aulas Agendadas"
            value={metrics.totalLessonsScheduled}
          />
          <MetricCard
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            title="Pendentes"
            value={metrics.totalLessonsPending}
          />
          <MetricCard
            icon={<Users className="h-5 w-5 text-purple-500" />}
            title="Alunos Atendidos"
            value={metrics.uniqueStudents}
          />
        </div>

        {/* Upgrade prompt for full metrics */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Desbloqueie métricas avançadas
                </p>
                <p className="text-sm text-muted-foreground">
                  Receita, conversão, evolução por período e muito mais.
                </p>
              </div>
            </div>
            <Link to="/instrutor/planos">
              <Button className="gap-2">
                Fazer Upgrade
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full dashboard for premium users
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Dashboard de Métricas
        </h2>
        <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          {planType === 'elite' ? 'Elite' : 'Destaque'}
        </Badge>
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          title="Aulas Realizadas"
          value={metrics.totalLessonsCompleted}
          bgClass="from-green-500/10"
        />
        <MetricCard
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          title="Aulas Agendadas"
          value={metrics.totalLessonsScheduled}
          bgClass="from-blue-500/10"
        />
        <MetricCard
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          title="Pendentes"
          value={metrics.totalLessonsPending}
          bgClass="from-amber-500/10"
        />
        <MetricCard
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          title="Canceladas"
          value={metrics.totalLessonsCancelled}
          bgClass="from-red-500/10"
        />
      </div>

      {/* Revenue and conversion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-emerald-600">
              {formatCurrency(metrics.totalRevenue)}
            </p>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p>Aulas: {formatCurrency(metrics.revenueFromLessons)}</p>
              <p>Assinaturas: {formatCurrency(metrics.revenueFromSubscription)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Alunos Atendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-purple-600">
              {metrics.uniqueStudents}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Alunos únicos que agendaram aulas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-500" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-cyan-600">
              {metrics.conversionRate}%
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {metrics.profileViews} visualizações → {metrics.totalLessonsScheduled + metrics.totalLessonsCompleted + metrics.totalLessonsPending} aulas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos 7 dias</CardTitle>
            <CardDescription>Aulas e receita na semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{metrics.lessonsLast7Days} aulas</p>
                <p className="text-lg text-emerald-600 font-semibold">
                  {formatCurrency(metrics.revenueLast7Days)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos 30 dias</CardTitle>
            <CardDescription>Aulas e receita no mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{metrics.lessonsLast30Days} aulas</p>
                <p className="text-lg text-emerald-600 font-semibold">
                  {formatCurrency(metrics.revenueLast30Days)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  bgClass?: string;
}

function MetricCard({ icon, title, value, bgClass = "" }: MetricCardProps) {
  return (
    <Card className={`bg-gradient-to-br ${bgClass} to-transparent`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
