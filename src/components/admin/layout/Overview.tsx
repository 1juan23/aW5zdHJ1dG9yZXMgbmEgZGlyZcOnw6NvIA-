import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, ArrowUpRight, ArrowDownRight, DollarSign, Activity, FileCheck, AlertTriangle } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface OverviewProps {
  stats: {
    totalInstructors: number;
    activeStudents: number;
    totalLessons: number;
    totalRevenue: number;
  };
  chartData: any[]; // Using any for simplicity in rapid prop passing, verify type later
}

export function Overview({ stats, chartData }: OverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(stats.totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-green-500 font-bold flex items-center mr-1">
                 <ArrowUpRight className="w-3 h-3" /> +20.1%
              </span> 
              desde o último mês
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instrutores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInstructors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2 novos esta semana
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Agendadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLessons}</div>
            <p className="text-xs text-muted-foreground mt-1">
               Total histórico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStudents}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-green-500 font-bold flex items-center mr-1">
                 <ArrowUpRight className="w-3 h-3" /> +12%
              </span>
              novos alunos (7d)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral de Receita</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="aulas" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ações Recentes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Você tem 3 tarefas pendentes.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {/* Mock Items for Visual */}
               <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                     <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-medium">Revisar Documentos</p>
                     <p className="text-xs text-muted-foreground">Instrutor Carlos enviou CNH</p>
                  </div>
                  <div className="text-xs text-muted-foreground">2h atrás</div>
               </div>
               
               <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                     <FileCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-medium">Novo Cadastro</p>
                     <p className="text-xs text-muted-foreground">Maria Souza criou conta</p>
                  </div>
                  <div className="text-xs text-muted-foreground">5h atrás</div>
               </div>
               
               <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center mr-3">
                     <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-medium">Venda Realizada</p>
                     <p className="text-xs text-muted-foreground">Plano Elite (João)</p>
                  </div>
                  <div className="text-xs text-muted-foreground">1d atrás</div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
