import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Lock,
  XCircle,
  CheckCircle,
  RefreshCcw,
  Globe,
} from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval, eachHourOfInterval, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SecurityLog {
  id: string;
  event_type: string;
  email: string | null;
  ip_address: string | null;
  created_at: string;
}

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  success: boolean;
  attempted_at: string;
}

const COLORS = {
  success: '#22c55e',
  failure: '#ef4444',
  locked: '#f59e0b',
  rateLimit: '#f97316',
  other: '#6366f1',
};

export function SecurityAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      const startDate = subDays(new Date(), daysBack).toISOString();

      const [logsResult, attemptsResult] = await Promise.all([
        supabase
          .from('security_logs')
          .select('*')
          .gte('created_at', startDate)
          .order('created_at', { ascending: true }),
        supabase
          .from('login_attempts')
          .select('*')
          .gte('attempted_at', startDate)
          .order('attempted_at', { ascending: true }),
      ]);

      if (logsResult.data) setSecurityLogs(logsResult.data);
      if (attemptsResult.data) setLoginAttempts(attemptsResult.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // Calculate trend data
  const trendData = useMemo(() => {
    if (timeRange === '24h') {
      const hours = eachHourOfInterval({
        start: subHours(new Date(), 24),
        end: new Date(),
      });

      return hours.map(hour => {
        const hourStr = format(hour, 'HH:00');
        const nextHour = new Date(hour.getTime() + 60 * 60 * 1000);
        
        const failedInHour = loginAttempts.filter(a => {
          const attemptDate = new Date(a.attempted_at);
          return !a.success && attemptDate >= hour && attemptDate < nextHour;
        }).length;

        const successInHour = loginAttempts.filter(a => {
          const attemptDate = new Date(a.attempted_at);
          return a.success && attemptDate >= hour && attemptDate < nextHour;
        }).length;

        const blockedInHour = securityLogs.filter(l => {
          const logDate = new Date(l.created_at);
          return l.event_type === 'account_locked' && logDate >= hour && logDate < nextHour;
        }).length;

        return {
          name: hourStr,
          falhas: failedInHour,
          sucessos: successInHour,
          bloqueios: blockedInHour,
        };
      });
    }

    const days = eachDayOfInterval({
      start: subDays(new Date(), timeRange === '7d' ? 7 : 30),
      end: new Date(),
    });

    return days.map(day => {
      const dayStr = format(day, 'dd/MM');
      const nextDay = new Date(startOfDay(day).getTime() + 24 * 60 * 60 * 1000);
      
      const failedOnDay = loginAttempts.filter(a => {
        const attemptDate = new Date(a.attempted_at);
        return !a.success && attemptDate >= startOfDay(day) && attemptDate < nextDay;
      }).length;

      const successOnDay = loginAttempts.filter(a => {
        const attemptDate = new Date(a.attempted_at);
        return a.success && attemptDate >= startOfDay(day) && attemptDate < nextDay;
      }).length;

      const blockedOnDay = securityLogs.filter(l => {
        const logDate = new Date(l.created_at);
        return l.event_type === 'account_locked' && logDate >= startOfDay(day) && logDate < nextDay;
      }).length;

      return {
        name: dayStr,
        falhas: failedOnDay,
        sucessos: successOnDay,
        bloqueios: blockedOnDay,
      };
    });
  }, [loginAttempts, securityLogs, timeRange]);

  // Calculate event type distribution
  const eventDistribution = useMemo(() => {
    const counts = securityLogs.reduce((acc, log) => {
      acc[log.event_type] = (acc[log.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({
      name: name === 'login_success' ? 'Sucesso' :
            name === 'login_failed' ? 'Falha' :
            name === 'account_locked' ? 'Bloqueio' :
            name === 'rate_limit' ? 'Rate Limit' : name,
      value,
      color: name === 'login_success' ? COLORS.success :
             name === 'login_failed' ? COLORS.failure :
             name === 'account_locked' ? COLORS.locked :
             name === 'rate_limit' ? COLORS.rateLimit : COLORS.other,
    }));
  }, [securityLogs]);

  // Top attacked emails
  const topAttackedEmails = useMemo(() => {
    const counts = loginAttempts
      .filter(a => !a.success)
      .reduce((acc, a) => {
        acc[a.email] = (acc[a.email] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([email, count]) => ({ email, count }));
  }, [loginAttempts]);

  // Top attacker IPs
  const topAttackerIPs = useMemo(() => {
    const counts = loginAttempts
      .filter(a => !a.success && a.ip_address)
      .reduce((acc, a) => {
        acc[a.ip_address!] = (acc[a.ip_address!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));
  }, [loginAttempts]);

  // Stats
  const stats = useMemo(() => {
    const totalAttempts = loginAttempts.length;
    const failedAttempts = loginAttempts.filter(a => !a.success).length;
    const successRate = totalAttempts > 0 ? ((totalAttempts - failedAttempts) / totalAttempts * 100).toFixed(1) : '0';
    const blockedAccounts = securityLogs.filter(l => l.event_type === 'account_locked').length;
    const uniqueAttackerIPs = new Set(loginAttempts.filter(a => !a.success).map(a => a.ip_address).filter(Boolean)).size;

    // Compare with previous period
    const midPoint = timeRange === '24h' ? 12 : timeRange === '7d' ? 3.5 : 15;
    const recentFailed = loginAttempts.filter((a, i) => {
      const date = new Date(a.attempted_at);
      const midDate = subDays(new Date(), midPoint);
      return !a.success && date >= midDate;
    }).length;
    const olderFailed = failedAttempts - recentFailed;
    const trend = olderFailed > 0 ? ((recentFailed - olderFailed) / olderFailed * 100).toFixed(0) : '0';

    return {
      totalAttempts,
      failedAttempts,
      successRate,
      blockedAccounts,
      uniqueAttackerIPs,
      trend: parseInt(trend),
    };
  }, [loginAttempts, securityLogs, timeRange]);

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Analytics de Segurança
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Tendências e padrões de ataques ao longo do tempo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total Tentativas</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-blue-600">{stats.totalAttempts}</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Falhas</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{stats.failedAttempts}</p>
            <div className="flex items-center gap-1 mt-1">
              {stats.trend > 0 ? (
                <TrendingUp className="w-3 h-3 text-red-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-green-500" />
              )}
              <span className={cn(
                "text-xs font-medium",
                stats.trend > 0 ? "text-red-500" : "text-green-500"
              )}>
                {stats.trend > 0 ? '+' : ''}{stats.trend}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Taxa Sucesso</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-green-600">{stats.successRate}%</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Bloqueios</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-amber-600">{stats.blockedAccounts}</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">IPs Atacantes</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-purple-600">{stats.uniqueAttackerIPs}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Tendência de Ataques
          </CardTitle>
          <CardDescription>
            Comparação de tentativas de login falhas, sucessos e bloqueios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorFalhas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.failure} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.failure} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSucessos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--background))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="falhas"
                  name="Falhas"
                  stroke={COLORS.failure}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFalhas)"
                />
                <Area
                  type="monotone"
                  dataKey="sucessos"
                  name="Sucessos"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSucessos)"
                />
                <Line
                  type="monotone"
                  dataKey="bloqueios"
                  name="Bloqueios"
                  stroke={COLORS.locked}
                  strokeWidth={2}
                  dot={{ fill: COLORS.locked, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Event Distribution Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {eventDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {eventDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Attacked Emails */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Emails Mais Atacados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAttackedEmails.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum ataque registrado</p>
              ) : (
                topAttackedEmails.map((item, index) => (
                  <div key={item.email} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-mono truncate max-w-[150px]">{item.email}</span>
                    </div>
                    <Badge variant="destructive" className="text-xs">{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Attacker IPs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-500" />
              IPs Suspeitos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAttackerIPs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum IP registrado</p>
              ) : (
                topAttackerIPs.map((item, index) => (
                  <div key={item.ip} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-mono">{item.ip}</span>
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30 text-xs">
                      {item.count}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
