import { useState } from "react";
import { useStudentLessons } from "@/hooks/useLessons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock, User, X, Star } from "lucide-react";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CancelLessonModal } from "./CancelLessonModal";
import { ReviewModal } from "./ReviewModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Aguardando Confirmação", variant: "secondary" },
  confirmed: { label: "Confirmada", variant: "default" },
  completed: { label: "Concluída", variant: "outline" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

export function LessonHistory() {
  const { data: lessons, isLoading } = useStudentLessons();
  const [cancelLessonId, setCancelLessonId] = useState<string | null>(null);
  const [reviewLesson, setReviewLesson] = useState<{
    id: string;
    instructorId: string;
    instructorName: string;
  } | null>(null);

  // Get existing reviews to check which lessons have been reviewed
  const { data: reviews } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("reviews")
        .select("lesson_id")
        .eq("student_id", user.id);

      if (error) throw error;
      return data.map((r) => r.lesson_id);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lessons?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Você ainda não tem aulas agendadas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {lessons.map((lesson) => {
          const status = statusMap[lesson.status] || statusMap.pending;
          const scheduledDate = new Date(lesson.scheduled_at);
          const canCancel = ["pending", "confirmed"].includes(lesson.status) && !isPast(scheduledDate);
          const canReview = lesson.status === "completed" && !reviews?.includes(lesson.id);
          
          return (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {lesson.instructor?.name || "Instrutor"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {format(scheduledDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {format(scheduledDate, "HH:mm", { locale: ptBR })} - {lesson.duration_minutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span className="text-lg font-bold text-primary">
                      R$ {lesson.price.toFixed(2)}
                    </span>
                    
                    <div className="flex gap-2 mt-2">
                      {canCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setCancelLessonId(lesson.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                      {canReview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewLesson({
                            id: lesson.id,
                            instructorId: lesson.instructor_id,
                            instructorName: lesson.instructor?.name || "Instrutor",
                          })}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Avaliar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cancel Modal */}
      {cancelLessonId && (
        <CancelLessonModal
          lessonId={cancelLessonId}
          open={!!cancelLessonId}
          onOpenChange={(open) => !open && setCancelLessonId(null)}
        />
      )}

      {/* Review Modal */}
      {reviewLesson && (
        <ReviewModal
          lessonId={reviewLesson.id}
          instructorId={reviewLesson.instructorId}
          instructorName={reviewLesson.instructorName}
          open={!!reviewLesson}
          onOpenChange={(open) => !open && setReviewLesson(null)}
        />
      )}
    </>
  );
}
