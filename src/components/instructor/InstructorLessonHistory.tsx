import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, User, Loader2, X, CheckCircle } from "lucide-react";
import { useInstructorLessons, LessonWithStudent, useUpdateLessonStatus } from "@/hooks/useLessons";
import { CancelLessonModal } from "@/components/student/CancelLessonModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  confirmed: { label: "Confirmada", variant: "default" },
  completed: { label: "Concluída", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

export function InstructorLessonHistory() {
  const { data: lessons, isLoading } = useInstructorLessons();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateLessonStatus();
  const [cancelLessonId, setCancelLessonId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!lessons || lessons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Aulas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma aula encontrada.</p>
            <p className="text-sm mt-1">Suas aulas agendadas aparecerão aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canCancelLesson = (lesson: LessonWithStudent) => {
    const now = new Date();
    const scheduledAt = new Date(lesson.scheduled_at);
    return (
      (lesson.status === "pending" || lesson.status === "confirmed") &&
      scheduledAt > now
    );
  };

  const canCompleteLesson = (lesson: LessonWithStudent) => {
    return lesson.status === "confirmed";
  };

  const handleComplete = (lessonId: string) => {
    updateStatus({ lessonId, status: "completed" });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Aulas
          </CardTitle>
          <p className="text-sm text-muted-foreground">Veja todas as suas aulas agendadas</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lessons.map((lesson) => {
              const status = statusMap[lesson.status] || statusMap.pending;
              const scheduledDate = new Date(lesson.scheduled_at);
              
              return (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={lesson.student?.avatar_url || undefined} />
                      <AvatarFallback>
                        {lesson.student?.name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{lesson.student?.name || "Aluno"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(scheduledDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(scheduledDate, "HH:mm", { locale: ptBR })} - {lesson.duration_minutes} min
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span className="font-semibold text-foreground">
                      R$ {lesson.price?.toFixed(2).replace(".", ",")}
                    </span>
                    
                    <div className="flex gap-2">
                      {canCompleteLesson(lesson) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          disabled={isUpdating}
                          onClick={() => handleComplete(lesson.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Concluir
                        </Button>
                      )}

                      {canCancelLesson(lesson) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={isUpdating}
                          onClick={() => setCancelLessonId(lesson.id)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {cancelLessonId && (
        <CancelLessonModal
          lessonId={cancelLessonId}
          open={!!cancelLessonId}
          onOpenChange={(open) => !open && setCancelLessonId(null)}
        />
      )}
    </>
  );
}
