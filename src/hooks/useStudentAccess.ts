import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StudentAccessData {
  hasAccess: boolean;
  paidAt?: string;
  expiresAt?: string;
}

export function useStudentAccess(instructorId: string | null) {
  const [access, setAccess] = useState<StudentAccessData>({ hasAccess: false });
  const [isLoading, setIsLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    if (!instructorId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAccess({ hasAccess: false });
        setIsLoading(false);
        return;
      }

      // Check if user has paid for this instructor
      const { data, error } = await supabase
        .from('student_instructor_access')
        .select('*')
        .eq('student_id', user.id)
        .eq('instructor_id', instructorId)
        .maybeSingle();

      if (error) {
        console.error('Error checking access:', error);
        setAccess({ hasAccess: false });
      } else if (data) {
        // Check if access has expired
        const now = new Date();
        const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
        const hasAccess = !expiresAt || now < expiresAt;

        setAccess({
          hasAccess,
          paidAt: data.paid_at,
          expiresAt: data.expires_at || undefined,
        });
      } else {
        setAccess({ hasAccess: false });
      }
    } catch (err) {
      console.error('Error checking student access:', err);
      setAccess({ hasAccess: false });
    } finally {
      setIsLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase
      .channel(`student-access-${instructorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_instructor_access',
        },
        () => {
          checkAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, checkAccess]);

  return {
    ...access,
    isLoading,
    refetch: checkAccess,
  };
}
