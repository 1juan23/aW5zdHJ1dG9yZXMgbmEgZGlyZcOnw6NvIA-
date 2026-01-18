import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Lesson {
  id: string;
  instructor_id: string;
  student_id: string;
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  instructor?: {
    name: string;
    avatar_url: string | null;
  };
}

export interface AvailabilitySlot {
  id: string;
  instructor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export function useStudentLessons() {
  return useQuery({
    queryKey: ["student-lessons"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("lessons")
        .select(`
          *,
          instructor:instructors_public (name, avatar_url)
        `)
        .eq("student_id", user.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return data as Lesson[];
    },
  });
}

export interface LessonWithStudent extends Lesson {
  student?: {
    name: string;
    avatar_url: string | null;
  };
}

export function useInstructorLessons() {
  return useQuery({
    queryKey: ["instructor-lessons"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: instructor } = await supabase
        .from("instructors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!instructor) return [];

      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("instructor_id", instructor.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      
      // Fetch student profiles for each lesson
      const lessonsWithStudents = await Promise.all(
        (data || []).map(async (lesson) => {
          const { data: studentProfile } = await supabase
            .from("profiles_public")
            .select("name, avatar_url")
            .eq("user_id", lesson.student_id)
            .maybeSingle();
          
          return {
            ...lesson,
            student: studentProfile && studentProfile.name 
              ? studentProfile 
              : { name: "Aluno", avatar_url: null },
          };
        })
      );
      
      return lessonsWithStudents as LessonWithStudent[];
    },
  });
}

export function useInstructorAvailability(instructorId: string) {
  return useQuery({
    queryKey: ["availability", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true });

      if (error) throw error;
      return data as AvailabilitySlot[];
    },
    enabled: !!instructorId,
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      instructorId,
      scheduledAt,
      durationMinutes,
      price,
      notes,
    }: {
      instructorId: string;
      scheduledAt: Date;
      durationMinutes: number;
      price: number;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("lessons")
        .insert({
          instructor_id: instructorId,
          student_id: user.id,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: durationMinutes,
          price,
          status: 'pending',
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-lessons"] });
      toast.success("Aula agendada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao agendar aula");
    },
  });
}

export function useUpdateLessonStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      status,
    }: {
      lessonId: string;
      status: string;
    }) => {
      const { data, error } = await supabase
        .from("lessons")
        .update({ status })
        .eq("id", lessonId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-lessons"] });
      toast.success("Status da aula atualizado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });
}

export function useManageAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slots: Omit<AvailabilitySlot, "id" | "instructor_id">[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: instructor } = await supabase
        .from("instructors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!instructor) throw new Error("Perfil de instrutor não encontrado");

      // Delete old slots
      await supabase
        .from("availability_slots")
        .delete()
        .eq("instructor_id", instructor.id);

      // Insert new slots
      const { error } = await supabase
        .from("availability_slots")
        .insert(
          slots.map((slot) => ({
            ...slot,
            instructor_id: instructor.id,
          }))
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      toast.success("Disponibilidade atualizada!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar disponibilidade");
    },
  });
}
