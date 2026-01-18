import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationOptions {
  enabled: boolean;
  onNewMessage?: (message: {
    content: string;
    senderName: string;
    conversationId: string;
  }) => void;
}

export function useRealtimeNotifications(options: NotificationOptions) {
  const { toast } = useToast();
  const currentUserIdRef = useRef<string | null>(null);
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const notificationPermissionRef = useRef<NotificationPermission>("default");

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      notificationPermissionRef.current = "granted";
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      notificationPermissionRef.current = permission;
      return permission === "granted";
    }

    return false;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string, onClick?: () => void) => {
    if (notificationPermissionRef.current === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/logo.png",
        tag: `message-${Date.now()}`,
        requireInteraction: false,
      });

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }

      setTimeout(() => notification.close(), 5000);
    }
  }, []);

  // Show in-app toast notification
  const showToastNotification = useCallback((senderName: string, content: string, conversationId: string) => {
    const truncatedContent = content.length > 50 
      ? content.substring(0, 50) + "..." 
      : content;

    toast({
      title: `Nova mensagem de ${senderName}`,
      description: truncatedContent,
    });
  }, [toast]);

  useEffect(() => {
    if (!options.enabled) return;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserIdRef.current = user?.id || null;
      await requestPermission();
    };

    setup();

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const message = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
          };

          if (processedMessagesRef.current.has(message.id)) {
            return;
          }
          processedMessagesRef.current.add(message.id);

          if (processedMessagesRef.current.size > 100) {
            const arr = Array.from(processedMessagesRef.current);
            processedMessagesRef.current = new Set(arr.slice(-50));
          }

          if (message.sender_id === currentUserIdRef.current) {
            return;
          }

          const { data: conversation } = await supabase
            .from("conversations")
            .select("id, student_id, instructor_id")
            .eq("id", message.conversation_id)
            .maybeSingle();

          if (!conversation) return;

          const { data: instructor } = await supabase
            .from("instructors")
            .select("id, user_id")
            .eq("id", conversation.instructor_id)
            .maybeSingle();

          const isParticipant = 
            conversation.student_id === currentUserIdRef.current ||
            instructor?.user_id === currentUserIdRef.current;

          if (!isParticipant) return;

          let senderName = "Alguém";
          
          const { data: senderInstructor } = await supabase
            .from("instructors")
            .select("name")
            .eq("user_id", message.sender_id)
            .maybeSingle();

          if (senderInstructor) {
            senderName = senderInstructor.name;
          } else {
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("name")
              .eq("user_id", message.sender_id)
              .maybeSingle();

            if (senderProfile) {
              senderName = senderProfile.name;
            }
          }

          showToastNotification(senderName, message.content, message.conversation_id);
          
          showBrowserNotification(
            `Nova mensagem de ${senderName}`,
            message.content,
            () => {
              window.location.href = `/mensagens?conversation=${message.conversation_id}`;
            }
          );

          if (options.onNewMessage) {
            options.onNewMessage({
              content: message.content,
              senderName,
              conversationId: message.conversation_id,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.enabled, requestPermission, showToastNotification, showBrowserNotification, options.onNewMessage]);

  return {
    requestPermission,
  };
}
