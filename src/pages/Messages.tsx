import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageCircle } from "lucide-react";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { useConversations, type Conversation } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Helmet } from "react-helmet-async";

export default function Messages() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    searchParams.get("conversa")
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { data: conversations, isLoading } = useConversations();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/login");
        return;
      }
      setCurrentUserId(data.user.id);
    });
  }, [navigate]);

  const selectedConv = conversations?.find((c) => c.id === selectedConversation);

  const getOtherUser = (conv: Conversation) => {
    if (!currentUserId) return { name: "", avatar_url: null };
    
    // Check if current user is the student
    if (conv.student_id === currentUserId) {
      return conv.instructor || { name: "Instrutor", avatar_url: null };
    }
    // Current user is the instructor
    return conv.student || { name: "Aluno", avatar_url: null };
  };

  if (isLoading || !currentUserId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mensagens | Instrutores na Direção</title>
        <meta name="description" content="Suas conversas com instrutores e alunos" />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Mensagens</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
            {/* Conversations List */}
            <Card className="md:col-span-1 overflow-hidden">
              <ScrollArea className="h-full">
                {conversations && conversations.length > 0 ? (
                  <div className="divide-y">
                    {conversations.map((conv) => {
                      const otherUser = getOtherUser(conv);
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv.id)}
                          className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
                            selectedConversation === conv.id ? "bg-muted" : ""
                          }`}
                        >
                          <Avatar>
                            <AvatarImage src={otherUser.avatar_url || undefined} />
                            <AvatarFallback>
                              {otherUser.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="font-medium truncate">{otherUser.name}</p>
                              {conv.hasUnread && (
                                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(conv.last_message_at || conv.created_at), "d MMM", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma conversa ainda
                    </p>
                  </div>
                )}
              </ScrollArea>
            </Card>

            {/* Chat Window */}
            <Card className="md:col-span-2 overflow-hidden">
              {selectedConversation && selectedConv ? (
                <ChatWindow
                  conversationId={selectedConversation}
                  otherUser={getOtherUser(selectedConv)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Selecione uma conversa
                  </h3>
                  <p className="text-muted-foreground">
                    Escolha uma conversa na lista ao lado para começar a conversar
                  </p>
                </div>
              )}
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
