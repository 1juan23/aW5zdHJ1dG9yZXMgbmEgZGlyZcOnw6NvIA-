import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Review {
  id: string;
  lesson_id: string;
  instructor_id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  created_at: string;
  student_name?: string;
  student_avatar?: string;
}

export function useInstructorReviews(instructorId: string) {
  return useQuery({
    queryKey: ["reviews", instructorId],
    queryFn: async () => {
      // First fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      
      if (!reviewsData || reviewsData.length === 0) return [];

      // Get unique student IDs
      const studentIds = [...new Set(reviewsData.map(r => r.student_id))];
      
      // Fetch profiles separately
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", studentIds);
      
      // Create a map for quick lookup
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      // Combine data
      return reviewsData.map(review => ({
        ...review,
        student_name: profilesMap.get(review.student_id)?.name || "Aluno",
        student_avatar: profilesMap.get(review.student_id)?.avatar_url || null,
      }));
    },
    enabled: !!instructorId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      instructorId,
      rating,
      comment,
      photos,
    }: {
      lessonId: string;
      instructorId: string;
      rating: number;
      comment: string;
      photos: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          lesson_id: lessonId,
          instructor_id: instructorId,
          student_id: user.id,
          rating,
          comment,
          photos,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.instructorId] });
      queryClient.invalidateQueries({ queryKey: ["instructor", variables.instructorId] });
      queryClient.invalidateQueries({ queryKey: ["student-lessons"] });
      toast.success("Avaliação enviada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao enviar avaliação");
    },
  });
}

export async function uploadReviewPhoto(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from("review-photos")
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("review-photos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
