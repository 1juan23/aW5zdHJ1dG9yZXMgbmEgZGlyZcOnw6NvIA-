import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Public instructor data (excludes email and phone for security)
export interface InstructorPublic {
  id: string;
  user_id: string;
  name: string;
  city: string;
  state: string;
  neighborhoods: string | null;
  bio: string | null;
  experience: string | null;
  specialties: string[];
  price: number | null;
  rating: number | null;
  total_reviews: number | null;
  avatar_url: string | null;
  is_verified: boolean;
  status: "pending" | "approved" | "suspended";
  plan_type: string;
  plan_priority: number;
  created_at: string;
  updated_at: string;
}

// Full instructor data (includes contact info, only for authorized users)
export interface Instructor extends InstructorPublic {
  email: string;
  phone: string;
}

// Use public view for instructor listings (no email/phone exposed)
export function useInstructors() {
  return useQuery({
    queryKey: ["instructors-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors_public")
        .select("*")
        .eq("status", "approved")
        .order("plan_priority", { ascending: true })
        .order("rating", { ascending: false });

      if (error) throw error;
      
      // Filter out any null IDs and cast properly
      const validData = (data || []).filter((item): item is typeof item & { id: string } => 
        item.id !== null && item.id !== undefined
      );
      
      return validData as InstructorPublic[];
    },
  });
}

// Full instructor data for profile page (contact info only for conversation participants)
export function useInstructor(id: string) {
  return useQuery({
    queryKey: ["instructor", id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user has a conversation with this instructor
        const { data: conversation } = await supabase
          .from("conversations")
          .select("id, instructor_approved")
          .eq("instructor_id", id)
          .eq("student_id", user.id)
          .maybeSingle();
        
        // Check if user is the instructor themselves
        const { data: ownProfile } = await supabase
          .from("instructors")
          .select("id")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (ownProfile || (conversation && conversation.instructor_approved)) {
          // User is the instructor or has approved conversation - can see full data
          const { data, error } = await supabase
            .from("instructors")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (error) throw error;
          
          // Map instructor data to include defaults for public view fields
          if (data) {
            return {
              ...data,
              is_verified: data.status === 'approved',
              plan_type: 'trial',
              plan_priority: 999,
            } as Instructor;
          }
          return null;
        }
      }
      
      // Default: use public view (no contact info)
      const { data, error } = await supabase
        .from("instructors_public")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as InstructorPublic | null;
    },
    enabled: !!id,
  });
}

// Use public view for featured instructors
export function useFeaturedInstructors() {
  return useQuery({
    queryKey: ["featured-instructors-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors_public")
        .select("*")
        .eq("status", "approved")
        .order("plan_priority", { ascending: true })
        .order("rating", { ascending: false })
        .limit(4);

      if (error) throw error;
      
      // Filter out any null IDs and cast properly
      const validData = (data || []).filter((item): item is typeof item & { id: string } => 
        item.id !== null && item.id !== undefined
      );
      
      return validData as InstructorPublic[];
    },
  });
}
