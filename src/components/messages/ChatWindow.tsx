import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { useMessages, useSendMessage, Message } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  conversationId: string;
  otherUser: {
    name: string;
    avatar_url: string | null;
  };
}

export function ChatWindow({ conversationId, otherUser }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Profanity Filter
    const badWords = ['porra', 'caralho', 'merda', 'bosta', 'puta', 'viado', 'corno', 'buceta', 'cu', 'foder', 'carai', 'foda'];
    const lowerMessage = message.toLowerCase();
    const hasProfanity = badWords.some(word => lowerMessage.includes(word));

    if (hasProfanity) {
      toast.error("Mensagem bloqueada", {
        description: "Sua mensagem contém palavras inadequadas e não foi enviada.",
      });
      return;
    }

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: message.trim(),
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro", { description: "Não foi possível enviar a mensagem." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser.avatar_url || undefined} />
            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUser.name}</h3>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
        {messages?.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          
          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[70%]",
                isOwn ? "ml-auto items-end" : "items-start"
              )}
            > 
              <div
                className={cn(
                  "p-3 rounded-2xl",
                  isOwn
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-white dark:bg-slate-800 border rounded-tl-none"
                )}
              >
                <p>{msg.content}</p>
              </div>
              <span className="text-[10px] text-gray-500 mt-1">
                {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t p-4 space-y-2 bg-white dark:bg-slate-800">
        <form onSubmit={handleSend} className="flex gap-2">
           <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!message.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground">
          Linguagem ofensiva não é permitida.
        </p>
      </div>
    </div>
  );
}
