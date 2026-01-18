import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  AlertTriangle, 
  Search, 
  RefreshCcw, 
  Lock, 
  Unlock, 
  XCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SecurityLog {
  id: string;
  event_type: string;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
  created_at: string;
}

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  success: boolean;
  attempted_at: string;
}

export function SecurityLogsPanel() {
  const [activeTab, setActiveTab] = useState<'security' | 'login'>('security');
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch security logs
      const { data: logsData, error: logsError } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (logsError) throw logsError;
      setSecurityLogs(logsData || []);

      // Fetch login attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('login_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(200);

      if (attemptsError) throw attemptsError;
      setLoginAttempts(attemptsData || []);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'login_failed':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'account_locked':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'rate_limit':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return <CheckCircle className="w-4 h-4" />;
      case 'login_failed':
        return <XCircle className="w-4 h-4" />;
      case 'account_locked':
        return <Lock className="w-4 h-4" />;
      case 'rate_limit':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return 'Login Sucesso';
      case 'login_failed':
        return 'Login Falha';
      case 'account_locked':
        return 'Conta Bloqueada';
      case 'rate_limit':
        return 'Rate Limit';
      default:
        return eventType;
    }
  };

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(securityLogs.map(log => log.event_type)));

  // Filter and paginate security logs
  const filteredSecurityLogs = securityLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm);
    const matchesType = eventTypeFilter === 'all' || log.event_type === eventTypeFilter;
    return matchesSearch && matchesType;
  });

  const paginatedSecurityLogs = filteredSecurityLogs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Filter login attempts
  const filteredLoginAttempts = loginAttempts.filter(attempt => {
    return !searchTerm || 
      attempt.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.ip_address?.includes(searchTerm);
  });

  const paginatedLoginAttempts = filteredLoginAttempts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Stats
  const totalFailedLogins = loginAttempts.filter(a => !a.success).length;
  const totalBlockedAccounts = securityLogs.filter(l => l.event_type === 'account_locked').length;
  const totalRateLimits = securityLogs.filter(l => l.event_type === 'rate_limit').length;
  const last24hFailures = loginAttempts.filter(a => {
    const attemptDate = new Date(a.attempted_at);
    const now = new Date();
    return !a.success && (now.getTime() - attemptDate.getTime()) < 24 * 60 * 60 * 1000;
  }).length;

  const totalPages = Math.ceil(
    (activeTab === 'security' ? filteredSecurityLogs.length : filteredLoginAttempts.length) / itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{totalFailedLogins}</p>
                <p className="text-xs text-muted-foreground">Logins Falhos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Lock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{totalBlockedAccounts}</p>
                <p className="text-xs text-muted-foreground">Contas Bloqueadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{totalRateLimits}</p>
                <p className="text-xs text-muted-foreground">Rate Limits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{last24hFailures}</p>
                <p className="text-xs text-muted-foreground">Falhas (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Logs de Segurança
              </CardTitle>
              <CardDescription>
                Monitore tentativas de login e eventos de segurança
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Atualizar
            </Button>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === 'security' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setActiveTab('security'); setPage(1); }}
            >
              <Shield className="w-4 h-4 mr-2" />
              Eventos de Segurança
            </Button>
            <Button
              variant={activeTab === 'login' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setActiveTab('login'); setPage(1); }}
            >
              <Lock className="w-4 h-4 mr-2" />
              Tentativas de Login
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email ou IP..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            {activeTab === 'security' && (
              <Select value={eventTypeFilter} onValueChange={(v) => { setEventTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {eventTypes.map(type => (
                    <SelectItem key={type} value={type}>{getEventTypeLabel(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Security Logs Table */}
          {activeTab === 'security' && (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : paginatedSecurityLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSecurityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge className={cn("gap-1", getEventTypeColor(log.event_type))}>
                            {getEventTypeIcon(log.event_type)}
                            {getEventTypeLabel(log.event_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.email || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {log.ip_address || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Login Attempts Table */}
          {activeTab === 'login' && (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : paginatedLoginAttempts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhuma tentativa encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLoginAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          {attempt.success ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/30 gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Sucesso
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/30 gap-1">
                              <XCircle className="w-3 h-3" />
                              Falha
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {attempt.email}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {attempt.ip_address || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(attempt.attempted_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
