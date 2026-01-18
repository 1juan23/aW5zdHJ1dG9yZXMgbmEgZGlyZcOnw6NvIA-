import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUnreadCount(0);
      return;
    }

    setCurrentUserId(user.id);

    // Check if user is an instructor
    const { data: instructorData } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Get conversations where user is involved (as student or instructor)
    let conversationsQuery = supabase
      .from('conversations')
      .select('id');
    
    if (instructorData) {
      // User is instructor - get conversations where they are instructor
      conversationsQuery = conversationsQuery.or(`instructor_id.eq.${instructorData.id},student_id.eq.${user.id}`);
    } else {
      // User is student - get conversations where they are student
      conversationsQuery = conversationsQuery.eq('student_id', user.id);
    }

    const { data: conversations } = await conversationsQuery;

    if (!conversations || conversations.length === 0) {
      setUnreadCount(0);
      return;
    }

    const conversationIds = conversations.map(c => c.id);

    // Count unread messages not sent by current user
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    setUnreadCount(count || 0);
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('unread_messages_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Refetch count on any message change
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnreadCount]);

  return unreadCount;
}
