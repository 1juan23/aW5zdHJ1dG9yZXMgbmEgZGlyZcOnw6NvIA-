import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  instructor_id: string;
  student_id: string;
  last_message_at: string;
  created_at: string;
  instructor_deleted_at?: string | null;
  student_deleted_at?: string | null;
  instructor?: {
    name: string;
    avatar_url: string | null;
  };
  student?: {
    name: string;
    avatar_url: string | null;
  };
  hasUnread?: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  edited_at?: string | null;
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Check if user is an instructor
      const { data: instructorData } = await supabase
        .from("instructors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const isInstructor = !!instructorData;

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          instructor:instructors_public!instructor_id (name, avatar_url, user_id)
        `)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      
      // Filter out deleted conversations
      const visibleConversations = (data || []).filter((conv) => {
          const c = conv as unknown as Conversation;
          if (c.instructor_id === user.id && c.instructor_deleted_at) return false;
          if (c.student_id === user.id && c.student_deleted_at) return false;
          return true;
      });
      
      // Fetch student profiles from profiles table (need real names)
      const conversationsWithStudents = await Promise.all(
        visibleConversations.map(async (conv) => {
            // Fetch student profile - try profiles_public first, then profiles
          const { data: studentProfile } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("user_id", conv.student_id)
            .maybeSingle();
          
          let profile = studentProfile;
          
          if (!profile) {
             const { data: publicProfile } = await supabase
              .from("profiles_public")
              .select("name, avatar_url")
              .eq("user_id", conv.student_id)
              .maybeSingle();
             profile = publicProfile;
          }
          
          return {
            ...conv,
            student: profile && profile.name 
              ? profile 
              : { name: "Aluno", avatar_url: null },
          };
        })
      );
      
      // Fetch unread status for each conversation
      const finalConversations = await Promise.all(
        conversationsWithStudents.map(async (conv) => {
           const { count: unreadCount } = await supabase
             .from("messages")
             .select("*", { count: "exact", head: true })
             .eq("conversation_id", conv.id)
             .eq("is_read", false)
             .neq("sender_id", user.id);
             
           return {
             ...conv,
             hasUnread: (unreadCount || 0) > 0,
             unreadCount: unreadCount || 0,
           };
        })
      );
      
      return finalConversations as Conversation[];
    },
  });
}

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          queryClient.setQueryData(
            ["messages", conversationId],
            (old: Message[] | undefined) => {
              if (!old) return [payload.new as Message];
              return [...old, payload.new as Message];
            }
          );
          // Invalidate conversations to update unread count
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Mark unread messages as read (messages not sent by current user)
      const unreadMessageIds = (data || [])
        .filter(msg => !msg.is_read && msg.sender_id !== user.id)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadMessageIds);
        
        // Invalidate conversations to update unread count
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
      
      return data as Message[];
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao enviar mensagem");
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instructorId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Check if conversation exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("instructor_id", instructorId)
        .eq("student_id", user.id)
        .maybeSingle();

      if (existing) return existing;

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          instructor_id: instructorId,
          student_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
