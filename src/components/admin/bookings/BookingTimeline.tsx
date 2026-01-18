import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, CheckCircle, Clock, MessageSquare, CreditCard, Star, XCircle, Play, CircleDot } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TimelineStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp?: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  details?: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed': return <Badge className="bg-green-500 text-white">Concluído</Badge>;
    case 'confirmed': return <Badge className="bg-blue-500 text-white">Confirmado</Badge>;
    case 'pending': return <Badge className="bg-amber-500 text-white">Pendente</Badge>;
    case 'canceled':
    case 'cancelled': return <Badge className="bg-red-500 text-white">Cancelado</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

function TimelineItem({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  const bgColor = step.status === 'completed' ? 'bg-green-100 dark:bg-green-900' 
    : step.status === 'current' ? 'bg-blue-100 dark:bg-blue-900'
    : step.status === 'error' ? 'bg-red-100 dark:bg-red-900'
    : 'bg-slate-100 dark:bg-slate-800';
  
  const iconColor = step.status === 'completed' ? 'text-green-600 dark:text-green-400' 
    : step.status === 'current' ? 'text-blue-600 dark:text-blue-400'
    : step.status === 'error' ? 'text-red-600 dark:text-red-400'
    : 'text-slate-400';

  return (
    <div className="relative">
      <span className={`absolute -left-[41px] ${bgColor} p-1.5 rounded-full border-2 border-white dark:border-slate-950`}>
        <span className={iconColor}>{step.icon}</span>
      </span>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{step.title}</span>
          {step.status === 'pending' && <Badge variant="outline" className="text-xs">Aguardando</Badge>}
        </div>
        <span className="text-sm text-muted-foreground">{step.description}</span>
        {step.timestamp && (
          <span className="text-xs text-muted-foreground mt-1">
            {format(new Date(step.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        )}
        {step.details && (
          <div className="mt-2 text-sm italic text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">"{step.details}"</div>
        )}
      </div>
      {!isLast && <div className="h-8" />}
    </div>
  );
}

export function BookingTimeline() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: trackingData, isLoading } = useQuery({
    queryKey: ["admin-complete-tracking"],
    queryFn: async () => {
      const { data: accessData } = await supabase.from("student_instructor_access").select("*").order("paid_at", { ascending: false }).limit(100);
      const { data: lessonsData } = await supabase.from("lessons").select("*").order("created_at", { ascending: false }).limit(100);
      const { data: reviewsData } = await supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(100);
      const { data: instructorsData } = await supabase.from("instructors").select("id, name, avatar_url, user_id");
      const { data: profilesData } = await supabase.from("profiles").select("user_id, name, email");

      const instructorMap = new Map(instructorsData?.map(i => [i.id, i]) || []);
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const reviewMap = new Map(reviewsData?.map(r => [r.lesson_id, r]) || []);

      return (lessonsData || []).map(lesson => ({
        id: lesson.id,
        lesson,
        instructor: instructorMap.get(lesson.instructor_id),
        student: profileMap.get(lesson.student_id),
        review: reviewMap.get(lesson.id),
        payment: (accessData || []).find(a => a.student_id === lesson.student_id && a.instructor_id === lesson.instructor_id),
      }));
    },
  });

  const filteredData = trackingData?.filter(entry => {
    if (statusFilter !== "all" && entry.lesson.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!entry.student?.name?.toLowerCase().includes(search) && !entry.instructor?.name?.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Rastreamento Completo de Pedidos</h2>
        <p className="text-muted-foreground">Acompanhe todo o fluxo: Pagamento → Agendamento → Aceite → Aula Concluída → Avaliação</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredData?.map(entry => {
          const { lesson, instructor, student, review, payment } = entry;
          const steps: TimelineStep[] = [
            { icon: <CreditCard className="w-4 h-4" />, title: payment ? "Pagamento Realizado" : "Pagamento", description: payment ? `${student?.name || "Aluno"} pagou R$ 5,00` : "Pagamento não localizado", timestamp: payment?.paid_at, status: payment ? 'completed' : 'pending' },
            { icon: <Calendar className="w-4 h-4" />, title: "Aula Agendada", description: `Agendada para ${format(new Date(lesson.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, timestamp: lesson.created_at, status: 'completed' },
          ];
          
          if (lesson.status === 'pending') {
            steps.push({ icon: <Clock className="w-4 h-4" />, title: "Aguardando Confirmação", description: "Instrutor ainda não confirmou", status: 'current' });
          } else if (lesson.status === 'cancelled') {
            steps.push({ icon: <XCircle className="w-4 h-4" />, title: "Aula Cancelada", description: "Esta aula foi cancelada", timestamp: lesson.updated_at, status: 'error' });
          } else {
            steps.push({ icon: <CheckCircle className="w-4 h-4" />, title: "Instrutor Confirmou", description: "Aula aceita", status: 'completed' });
          }
          
          if (lesson.status === 'completed') {
            steps.push({ icon: <Play className="w-4 h-4" />, title: "Aula Concluída", description: "Marcada como concluída", timestamp: lesson.updated_at, status: 'completed' });
            steps.push(review 
              ? { icon: <Star className="w-4 h-4" />, title: `Avaliação (${review.rating}★)`, description: "Aluno avaliou", timestamp: review.created_at, status: 'completed', details: review.comment || undefined }
              : { icon: <MessageSquare className="w-4 h-4" />, title: "Aguardando Avaliação", description: "Aluno ainda não avaliou", status: 'current' }
            );
          } else if (lesson.status === 'confirmed') {
            steps.push({ icon: <Play className="w-4 h-4" />, title: "Aguardando Conclusão", description: "Aula confirmada", status: 'current' });
          }

          return (
            <Card key={lesson.id}>
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarImage src={instructor?.avatar_url} /><AvatarFallback>{instructor?.name?.charAt(0) || "I"}</AvatarFallback></Avatar>
                    <div>
                      <Badge variant="outline" className="font-mono text-xs">#{lesson.id.slice(0, 8)}</Badge>
                      <span className="text-xs text-muted-foreground block">{student?.name || "Aluno"} → {instructor?.name || "Instrutor"}</span>
                    </div>
                  </div>
                  {getStatusBadge(lesson.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-8 pb-2">
                  {steps.map((step, idx) => <TimelineItem key={idx} step={step} isLast={idx === steps.length - 1} />)}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!filteredData || filteredData.length === 0) && (
          <Card className="py-12"><div className="text-center text-muted-foreground"><CircleDot className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Nenhum pedido encontrado.</p></div></Card>
        )}
      </div>
    </div>
  );
}