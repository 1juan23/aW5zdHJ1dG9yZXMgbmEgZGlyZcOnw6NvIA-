import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  senderName?: string;
}

interface MessagePreviewProps {
  className?: string;
}

export function MessagePreview({ className }: MessagePreviewProps) {
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentMessages() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get conversations where user is a student
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('student_id', user.id);

      if (!conversations || conversations.length === 0) {
        setLoading(false);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      // Get recent messages from those conversations
      const { data: messages } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at')
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (messages) {
        setRecentMessages(messages.map(m => ({
          ...m,
          senderName: 'Instrutor'
        })));
      }
      setLoading(false);
    }

    fetchRecentMessages();
  }, []);

  if (loading || recentMessages.length === 0) {
    return null;
  }

  return (
    <Card className={cn("absolute top-full right-0 mt-2 w-80 shadow-lg z-50", className)}>
      <CardContent className="p-0">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Mensagens Recentes</h3>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {recentMessages.map((message) => (
            <div
              key={message.id}
              className="p-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-0"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {message.senderName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {message.senderName || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {message.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t">
          <Link 
            to="/mensagens" 
            className="text-sm text-primary hover:underline font-medium"
          >
            Ver todas as mensagens →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
