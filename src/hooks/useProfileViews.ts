import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProfileViewStats {
  totalViews: number;
  last7Days: number;
  last30Days: number;
  todayViews: number;
}

export function useProfileViews(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["profile-views", instructorId],
    queryFn: async (): Promise<ProfileViewStats> => {
      if (!instructorId) throw new Error("No instructor ID");

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get total views
      const { count: totalViews } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId);

      // Get views in last 7 days
      const { count: views7Days } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .gte("viewed_at", last7Days);

      // Get views in last 30 days
      const { count: views30Days } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .gte("viewed_at", last30Days);

      // Get today's views
      const { count: viewsToday } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .gte("viewed_at", today);

      return {
        totalViews: totalViews || 0,
        last7Days: views7Days || 0,
        last30Days: views30Days || 0,
        todayViews: viewsToday || 0,
      };
    },
    enabled: !!instructorId,
  });
}

export async function logProfileView(instructorId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase
    .from("profile_views")
    .insert({
      instructor_id: instructorId,
      viewer_id: user?.id || null,
    });
}
