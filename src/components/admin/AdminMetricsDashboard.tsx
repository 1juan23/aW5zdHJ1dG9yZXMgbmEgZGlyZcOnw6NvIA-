import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState } from "@/components/ui/LoadingState";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Users, Download, FileText } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionMetrics {
  totalTrialStarted: number;
  totalConverted: number;
  totalCanceled: number;
  conversionRate: number;
  churnRate: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  subscribers: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const PLAN_PRICES: Record<string, number> = {
  trial: 0,
  basico: 49.90,
  elite: 89.90,
  expired: 0,
};

export function AdminMetricsDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [currentMRR, setCurrentMRR] = useState(0);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // Fetch all subscriptions with history
        const { data: subscriptions } = await supabase
          .from('instructor_subscriptions')
          .select('*');

        const { data: subscriptionHistory } = await supabase
          .from('subscription_history')
          .select('*')
          .order('started_at', { ascending: true });

        // Calculate metrics
        const totalTrialStarted = subscriptions?.filter(s => 
          s.trial_started_at !== null
        ).length || 0;

        const totalConverted = subscriptions?.filter(s => 
          s.plan_type !== 'trial' && s.plan_type !== 'expired' && s.is_active
        ).length || 0;

        const totalCanceled = subscriptionHistory?.filter(h => 
          h.status === 'canceled' || h.status === 'expired'
        ).length || 0;

        const conversionRate = totalTrialStarted > 0 
          ? (totalConverted / totalTrialStarted) * 100 
          : 0;

        // Churn rate = canceled / (converted + canceled) * 100
        const totalPaidEver = totalConverted + totalCanceled;
        const churnRate = totalPaidEver > 0 
          ? (totalCanceled / totalPaidEver) * 100 
          : 0;

        setMetrics({
          totalTrialStarted,
          totalConverted,
          totalCanceled,
          conversionRate,
          churnRate,
        });

        // Calculate MRR
        const activePaidSubs = subscriptions?.filter(s => 
          s.is_active && s.plan_type !== 'trial' && s.plan_type !== 'expired' && !s.paused_at
        ) || [];

        const mrr = activePaidSubs.reduce((sum, sub) => {
          const price = PLAN_PRICES[sub.plan_type] || 0;
          return sum + price;
        }, 0);
        setCurrentMRR(mrr);

        // Calculate monthly revenue from history
        const revenueByMonth: Record<string, { revenue: number; subscribers: number }> = {};
        
        subscriptionHistory?.forEach(record => {
          if (record.status === 'active' || record.status === 'completed') {
            const date = new Date(record.started_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!revenueByMonth[monthKey]) {
              revenueByMonth[monthKey] = { revenue: 0, subscribers: 0 };
            }
            
            const price = record.amount_paid || PLAN_PRICES[record.plan_type] || 0;
            revenueByMonth[monthKey].revenue += price;
            revenueByMonth[monthKey].subscribers += 1;
          }
        });

        // Also add current active subscriptions to current month
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        if (!revenueByMonth[currentMonthKey]) {
          revenueByMonth[currentMonthKey] = { revenue: 0, subscribers: 0 };
        }
        revenueByMonth[currentMonthKey].revenue = mrr;
        revenueByMonth[currentMonthKey].subscribers = activePaidSubs.length;

        const monthlyData = Object.entries(revenueByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6) // Last 6 months
          .map(([month, data]) => ({
            month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            revenue: data.revenue,
            subscribers: data.subscribers,
          }));

        setMonthlyRevenue(monthlyData);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState variant="spinner" size="lg" text="Carregando métricas..." />
      </div>
    );
  }

  const exportToCSV = () => {
    const headers = ['Métrica', 'Valor'];
    const data = [
      ['MRR Atual', `R$ ${currentMRR.toFixed(2)}`],
      ['Taxa de Conversão', `${metrics?.conversionRate.toFixed(1)}%`],
      ['Churn Rate', `${metrics?.churnRate.toFixed(1)}%`],
      ['Total de Trials', metrics?.totalTrialStarted || 0],
      ['Convertidos', metrics?.totalConverted || 0],
      ['Cancelados', metrics?.totalCanceled || 0],
      ['Receita Anual Estimada', `R$ ${(currentMRR * 12).toFixed(2)}`],
      [''],
      ['Receita Mensal'],
      ['Mês', 'Receita', 'Assinantes'],
      ...monthlyRevenue.map(m => [m.month, `R$ ${m.revenue.toFixed(2)}`, m.subscribers]),
    ];

    const csvContent = [headers.join(','), ...data.map(row => 
      Array.isArray(row) ? row.join(',') : row
    )].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `metricas-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exportado com sucesso!');
  };

  const exportToPDF = () => {
    // Create a printable HTML content
    const printContent = `
      <html>
        <head>
          <title>Relatório de Métricas - ${new Date().toLocaleDateString('pt-BR')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .metric-card { background: #f9fafb; border-radius: 8px; padding: 20px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #10b981; }
            .metric-label { color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #f3f4f6; }
            .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <h1>📊 Relatório de Métricas</h1>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          
          <h2>Indicadores Principais</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">R$ ${currentMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="metric-label">MRR Atual</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${metrics?.conversionRate.toFixed(1)}%</div>
              <div class="metric-label">Taxa de Conversão (Trial → Pago)</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #ef4444;">${metrics?.churnRate.toFixed(1)}%</div>
              <div class="metric-label">Churn Rate</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #8b5cf6;">${metrics?.totalConverted || 0}</div>
              <div class="metric-label">Assinantes Ativos</div>
            </div>
          </div>

          <h2>Resumo Detalhado</h2>
          <table>
            <tr><th>Métrica</th><th>Valor</th></tr>
            <tr><td>Total de Trials Iniciados</td><td>${metrics?.totalTrialStarted || 0}</td></tr>
            <tr><td>Convertidos para Plano Pago</td><td>${metrics?.totalConverted || 0}</td></tr>
            <tr><td>Cancelamentos</td><td>${metrics?.totalCanceled || 0}</td></tr>
            <tr><td>Receita Anual Estimada</td><td>R$ ${(currentMRR * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
          </table>

          <h2>Receita Mensal</h2>
          <table>
            <tr><th>Mês</th><th>Receita</th><th>Assinantes</th></tr>
            ${monthlyRevenue.map(m => `<tr><td>${m.month}</td><td>R$ ${m.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td>${m.subscribers}</td></tr>`).join('')}
          </table>

          <div class="footer">
            <p>Instrutores na Direção - Relatório Confidencial</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
      toast.success('PDF gerado! Use Ctrl+P para salvar como PDF.');
    }
  };

  const conversionData = [
    { name: 'Convertidos', value: metrics?.totalConverted || 0 },
    { name: 'Cancelados', value: metrics?.totalCanceled || 0 },
    { name: 'Em Trial', value: Math.max(0, (metrics?.totalTrialStarted || 0) - (metrics?.totalConverted || 0) - (metrics?.totalCanceled || 0)) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Dashboard de Métricas</h2>
          <p className="text-muted-foreground">Visão geral de receita, conversão e churn</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {currentMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Receita mensal recorrente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalConverted}/{metrics?.totalTrialStarted} trial → pago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.churnRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalCanceled} cancelamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.totalConverted || 0}
            </div>
            <p className="text-xs text-muted-foreground">Planos pagos ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Evolução do MRR nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>Distribuição de trials e conversões</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {conversionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total de Trials</p>
              <p className="text-2xl font-bold">{metrics?.totalTrialStarted || 0}</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Convertidos</p>
              <p className="text-2xl font-bold text-green-600">{metrics?.totalConverted || 0}</p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Cancelados</p>
              <p className="text-2xl font-bold text-red-600">{metrics?.totalCanceled || 0}</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Receita Anual Est.</p>
              <p className="text-2xl font-bold text-blue-600">
                R$ {(currentMRR * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
