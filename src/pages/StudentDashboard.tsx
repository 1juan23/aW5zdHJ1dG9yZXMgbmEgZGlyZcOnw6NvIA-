import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Star, MessageSquare, MessageCircle, Loader2, CheckCircle, User, HelpCircle } from "lucide-react";
import { useStudentLessons, Lesson } from "@/hooks/useLessons";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useFavorites } from "@/hooks/useFavorites";
import { useQuery } from "@tanstack/react-query";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { MapPin, Heart } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const { data: lessons, isLoading } = useStudentLessons();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/login");
      }
    });
  }, [navigate]);

  const upcomingLessons = lessons?.filter(
    (l) => l.status === "pending" || l.status === "confirmed"
  ) || [];
  
  const completedLessons = lessons?.filter((l) => l.status === "completed") || [];
  const cancelledLessons = lessons?.filter((l) => l.status === "cancelled") || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "confirmed":
        return <Badge className="bg-accent text-accent-foreground">Confirmada</Badge>;
      case "completed":
        return <Badge variant="default">Concluída</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
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
        <title>Minhas Aulas | Instrutores na Direção</title>
        <meta name="description" content="Gerencie suas aulas agendadas" />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Minhas Aulas</h1>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <TabsList className="bg-slate-100/50 p-1 rounded-xl flex-wrap">
                <TabsTrigger value="upcoming">Próximas ({upcomingLessons.length})</TabsTrigger>
                <TabsTrigger value="completed">Concluídas ({completedLessons.length})</TabsTrigger>
                <TabsTrigger value="cancelled">Canceladas ({cancelledLessons.length})</TabsTrigger>
                <TabsTrigger value="messages" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Mensagens
                </TabsTrigger>
                <TabsTrigger value="favorites" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Favoritos
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <SupportTicketForm 
                  triggerButton={
                    <Button variant="outline" size="sm" className="gap-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all">
                      <HelpCircle className="h-4 w-4 text-red-500" />
                      Suporte
                    </Button>
                  }
                />
                <Link to="/aluno/perfil">
                  <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary transition-all">
                    <User className="h-4 w-4 text-primary" />
                    Meu Perfil
                  </Button>
                </Link>
              </div>
            </div>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingLessons.length > 0 ? (
                upcomingLessons.map((lesson) => (
                  <Card key={lesson.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={lesson.instructor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(lesson.instructor?.name || "I")}&size=64`}
                            alt={lesson.instructor?.name}
                            className="w-16 h-16 rounded-xl object-cover bg-muted"
                          />
                          <div>
                            <h3 className="font-semibold text-lg">
                              {lesson.instructor?.name}
                            </h3>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(lesson.scheduled_at), "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {format(new Date(lesson.scheduled_at), "HH:mm")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(lesson.status)}
                          <p className="font-bold text-lg">R$ {lesson.price?.toFixed(2)}</p>
                          <Link to="/mensagens">
                            <Button size="icon" variant="ghost" className="text-primary hover:text-primary-light">
                              <MessageCircle className="h-5 w-5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium text-lg mb-2">Nenhuma aula agendada</h3>
                    <p className="text-muted-foreground mb-4">
                      Encontre um instrutor e agende sua primeira aula
                    </p>
                    <Button onClick={() => navigate("/instrutores")}>
                      Buscar Instrutores
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedLessons.length > 0 ? (
                completedLessons.map((lesson) => (
                  <Card key={lesson.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={lesson.instructor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(lesson.instructor?.name || "I")}&size=64`}
                            alt={lesson.instructor?.name}
                            className="w-16 h-16 rounded-xl object-cover bg-muted"
                          />
                          <div>
                            <h3 className="font-semibold text-lg">
                              {lesson.instructor?.name}
                            </h3>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(lesson.scheduled_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="gap-2">
                                <Star className="h-4 w-4" />
                                Avaliar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Avaliar aula com {lesson.instructor?.name}</DialogTitle>
                              </DialogHeader>
                              <ReviewForm
                                lessonId={lesson.id}
                                instructorId={lesson.instructor_id}
                              />
                            </DialogContent>
                          </Dialog>
                          {getStatusBadge(lesson.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium text-lg mb-2">Nenhuma aula concluída</h3>
                    <p className="text-muted-foreground">
                      Suas aulas concluídas aparecerão aqui
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledLessons.length > 0 ? (
                cancelledLessons.map((lesson) => (
                  <Card key={lesson.id} className="opacity-75">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={lesson.instructor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(lesson.instructor?.name || "I")}&size=64`}
                            alt={lesson.instructor?.name}
                            className="w-16 h-16 rounded-xl object-cover bg-muted"
                          />
                          <div>
                            <h3 className="font-semibold text-lg">
                              {lesson.instructor?.name}
                            </h3>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(lesson.scheduled_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(lesson.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                      Nenhuma aula cancelada
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

          <TabsContent value="messages" className="space-y-4">
               <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium text-lg mb-2">Suas conversas</h3>
                    <p className="text-muted-foreground mb-6">
                      Acesse suas mensagens e combine os detalhes das suas aulas.
                    </p>
                    <Link to="/mensagens">
                      <Button className="gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Ir para Mensagens
                      </Button>
                    </Link>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4">
              <FavoriteInstructorsList />
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </>
  );
}

function FavoriteInstructorsList() {
  const navigate = useNavigate();
  const { data: favoriteIds } = useFavorites();
  
  const { data: favoriteInstructors, isLoading } = useQuery({
    queryKey: ['favorite-instructors', favoriteIds],
    queryFn: async () => {
      if (!favoriteIds || favoriteIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('instructors_public')
        .select('*')
        .in('id', favoriteIds);
        
      if (error) throw error;
      return data;
    },
    enabled: !!favoriteIds && favoriteIds.length > 0
  });

  if (isLoading) {
    return <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  if (!favoriteInstructors?.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium text-lg mb-2">Nenhum favorito ainda</h3>
           <p className="text-muted-foreground mb-6">
             Explore nossos instrutores e salve seus favoritos aqui.
           </p>
           <Button onClick={() => navigate("/instrutores")}>
             Encontrar Instrutores
           </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favoriteInstructors.map((instructor) => (
         <Link 
            to={`/instrutor/${instructor.id}`} 
            key={instructor.id}
          >
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  <img
                    src={instructor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name || "I")}&size=96`}
                    alt={instructor.name || "Instrutor"}
                    className="w-20 h-20 rounded-xl object-cover bg-muted group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <h3 className="font-semibold truncate">{instructor.name}</h3>
                       <FavoriteButton instructorId={instructor.id || ""} size="sm" className="h-8 w-8" />
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{instructor.city}, {instructor.state}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm mt-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{instructor.rating || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
         </Link>
      ))}
    </div>
  );
}
