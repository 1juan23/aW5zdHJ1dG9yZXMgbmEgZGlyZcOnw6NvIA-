import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, X, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Lesson = Database["public"]["Tables"]["lessons"]["Row"] & { 
  profiles?: { name: string | null; phone: string | null } | null 
};

interface PendingLessonsListProps {
  pendingLessons: Lesson[];
  isActionLoading: string | null;
  onLessonAction: (lessonId: string, status: 'confirmed' | 'cancelled') => void;
}

export function PendingLessonsList({ 
  pendingLessons, 
  isActionLoading, 
  onLessonAction 
}: PendingLessonsListProps) {
  if (pendingLessons.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-foreground">Novas Solicitações</h2>
        <Badge variant="destructive" className="animate-pulse">NOVO</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingLessons.map((lesson) => (
          <Card key={lesson.id} className="border-primary/20 bg-primary/5 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">Aula Agendada</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(lesson.scheduled_at).toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-slate-900">
                   R$ {lesson.price?.toFixed(2)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground border-y border-primary/10 py-3">
                 <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {lesson.duration_minutes} min
                 </div>
              </div>
              <div className="flex gap-2">
                 <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                    size="sm"
                    disabled={isActionLoading === lesson.id}
                    onClick={() => onLessonAction(lesson.id, 'confirmed')}
                 >
                    {isActionLoading === lesson.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirmar
                      </>
                    )}
                 </Button>
                 <Button 
                    variant="outline" 
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50" 
                    size="sm"
                    disabled={isActionLoading === lesson.id}
                    onClick={() => onLessonAction(lesson.id, 'cancelled')}
                 >
                    <X className="h-4 w-4 mr-2" />
                    Recusar
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
