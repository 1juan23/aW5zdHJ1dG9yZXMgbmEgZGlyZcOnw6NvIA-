import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstructorMetrics {
  totalLessonsCompleted: number;
  totalLessonsScheduled: number;
  totalLessonsPending: number;
  totalLessonsCancelled: number;
  uniqueStudents: number;
  revenueFromLessons: number;
  revenueFromSubscription: number;
  totalRevenue: number;
  conversionRate: number; // profile views to lessons scheduled
  profileViews: number;
  lessonsLast7Days: number;
  lessonsLast30Days: number;
  revenueLast7Days: number;
  revenueLast30Days: number;
}

export function useInstructorMetrics(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-metrics", instructorId],
    queryFn: async (): Promise<InstructorMetrics> => {
      if (!instructorId) throw new Error("No instructor ID");

      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all lessons for this instructor
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, status, price, student_id, scheduled_at")
        .eq("instructor_id", instructorId);

      const allLessons = lessons || [];

      // Calculate lesson statistics
      const completedLessons = allLessons.filter(l => l.status === 'completed');
      const scheduledLessons = allLessons.filter(l => l.status === 'confirmed');
      const pendingLessons = allLessons.filter(l => l.status === 'pending');
      const cancelledLessons = allLessons.filter(l => l.status === 'cancelled');

      // Calculate unique students
      const uniqueStudentIds = new Set(allLessons.map(l => l.student_id));

      // Calculate revenue from completed and confirmed lessons
      const revenueFromLessons = [...completedLessons, ...scheduledLessons]
        .reduce((sum, l) => sum + (l.price || 0), 0);

      // Calculate revenue from subscriptions (from subscription_history)
      const { data: subscriptions } = await supabase
        .from("subscription_history")
        .select("amount_paid")
        .eq("instructor_id", instructorId)
        .eq("status", "active");

      const revenueFromSubscription = (subscriptions || [])
        .reduce((sum, s) => sum + (s.amount_paid || 0), 0);

      // Get profile views count
      const { count: profileViews } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId);

      // Calculate conversion rate: lessons scheduled / profile views
      const totalViews = profileViews || 0;
      const totalScheduled = scheduledLessons.length + completedLessons.length + pendingLessons.length;
      const conversionRate = totalViews > 0 
        ? Math.round((totalScheduled / totalViews) * 100 * 10) / 10 
        : 0;

      // Lessons and revenue last 7 days
      const lessonsLast7Days = allLessons.filter(l => 
        new Date(l.scheduled_at) >= new Date(last7Days) && 
        (l.status === 'completed' || l.status === 'confirmed')
      ).length;

      const revenueLast7Days = allLessons
        .filter(l => 
          new Date(l.scheduled_at) >= new Date(last7Days) && 
          (l.status === 'completed' || l.status === 'confirmed')
        )
        .reduce((sum, l) => sum + (l.price || 0), 0);

      // Lessons and revenue last 30 days
      const lessonsLast30Days = allLessons.filter(l => 
        new Date(l.scheduled_at) >= new Date(last30Days) && 
        (l.status === 'completed' || l.status === 'confirmed')
      ).length;

      const revenueLast30Days = allLessons
        .filter(l => 
          new Date(l.scheduled_at) >= new Date(last30Days) && 
          (l.status === 'completed' || l.status === 'confirmed')
        )
        .reduce((sum, l) => sum + (l.price || 0), 0);

      return {
        totalLessonsCompleted: completedLessons.length,
        totalLessonsScheduled: scheduledLessons.length,
        totalLessonsPending: pendingLessons.length,
        totalLessonsCancelled: cancelledLessons.length,
        uniqueStudents: uniqueStudentIds.size,
        revenueFromLessons,
        revenueFromSubscription,
        totalRevenue: revenueFromLessons + revenueFromSubscription,
        conversionRate,
        profileViews: totalViews,
        lessonsLast7Days,
        lessonsLast30Days,
        revenueLast7Days,
        revenueLast30Days,
      };
    },
    enabled: !!instructorId,
    refetchInterval: 60000, // Refetch every minute
  });
}
