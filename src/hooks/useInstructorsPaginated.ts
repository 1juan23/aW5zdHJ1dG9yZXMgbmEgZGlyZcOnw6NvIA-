import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InstructorPublic } from "./useInstructors";

const PAGE_SIZE = 12;

interface InstructorWithVehicle extends InstructorPublic {
  vehicle_type?: string;
  has_teaching_license?: boolean;
}

export function useInstructorsPaginated() {
  return useInfiniteQuery({
    queryKey: ["instructors-paginated"],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("instructors_public")
        .select("*", { count: 'exact' })
        .eq("status", "approved")
        .order("plan_priority", { ascending: true })
        .order("rating", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Filter out any null IDs and cast properly
      const validData = (data || []).filter((item): item is typeof item & { id: string } => 
        item.id !== null && item.id !== undefined
      );

      return {
        instructors: validData as InstructorWithVehicle[],
        nextPage: validData.length === PAGE_SIZE ? pageParam + 1 : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
