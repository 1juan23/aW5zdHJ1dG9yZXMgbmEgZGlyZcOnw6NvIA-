import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    User, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut,
  Phone,
  Clock,
  AlertCircle,
  Loader2,
  XCircle,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditProfileModal } from "@/components/instructor/EditProfileModal";
import { ProfileViewsCard } from "@/components/instructor/ProfileViewsCard";
import { useInstructorSubscription, SubscriptionData } from "@/hooks/useInstructorSubscription";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { PremiumPlanBanner } from "@/components/dashboard/PremiumPlanBanner";
import { SubscriptionHistory } from "@/components/instructor/SubscriptionHistory";
import { InstructorLessonHistory } from "@/components/instructor/InstructorLessonHistory";
import { PendingLessonsList } from "@/components/instructor/PendingLessonsList";
import { InstructorMetricsDashboard } from "@/components/instructor/InstructorMetricsDashboard";
import type { Database } from "@/integrations/supabase/types";

type Instructor = Database["public"]["Tables"]["instructors"]["Row"];
type Lesson = Database["public"]["Tables"]["lessons"]["Row"] & { 
  profiles?: { name: string | null; phone: string | null } | null 
};

export default function InstructorDashboard() {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingLessons, setPendingLessons] = useState<Lesson[]>([]);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Hook para gerenciar assinatura e recursos do plano
  const { 
    subscription, 
    features, 
    isLoading: subLoading,
    canAccessAnalytics,
    isPremium,
    isExpired,
    // Add a way to manually update if needed, or rely on the hook's internal check
  } = useInstructorSubscription();

  // Optimistic update from navigation state
  const [localSubscription, setLocalSubscription] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    if (location.state?.refreshedSubscription) {
      setLocalSubscription(location.state.refreshedSubscription);
    }
  }, [location.state]);

  // Use local subscription if available (from direct navigation after purchase), otherwise use hook data
  const currentSubscription = localSubscription || subscription;
  const currentPlanType = currentSubscription?.planType || 'trial';
  const isPlanTrial = currentPlanType === 'trial';

  const loadInstructorData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/instrutor/login');
        return;
      }

      // Fetch unread messages count
      const { count: unread } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id);
        
      setUnreadCount(unread || 0);

      const { data: instructorData, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (instructorData && instructorData.status === 'suspended') {
        const { data: logs } = await supabase
          .from('admin_action_logs')
          .select('notes')
          .eq('target_instructor_id', instructorData.id)
          .in('action', ['suspend', 'reject'])
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (logs && logs.length > 0) {
          setSuspensionReason(logs[0].notes);
        }
      }

      if (!instructorData) {
        toast({
          title: "Perfil não encontrado",
          description: "Complete seu cadastro de instrutor.",
          variant: "destructive",
        });
        navigate('/instrutor/cadastro');
        return;
      }

      setInstructor(instructorData);

      // Fetch pending lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('instructor_id', instructorData.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setPendingLessons(lessons || []);

    } catch (error) {
      console.error('Error loading instructor data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus dados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/instrutor/login');
      }
    });

    loadInstructorData();

    // Subscribe to new lessons
    const lessonSubscription = supabase
      .channel('public:lessons')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'lessons' 
      }, () => {
        loadInstructorData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(lessonSubscription);
    };
  }, [navigate, loadInstructorData]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/instrutor/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleLessonAction = async (lessonId: string, status: 'confirmed' | 'cancelled') => {
    setIsActionLoading(lessonId);
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ status })
        .eq('id', lessonId);
      
      if (error) throw error;

      toast({
        title: status === 'confirmed' ? "Aula confirmada!" : "Aula recusada",
        description: status === 'confirmed' ? "Prepare-se para encontrar o aluno." : "O aluno será notificado.",
      });

      setPendingLessons(prev => prev.filter(l => l.id !== lessonId));
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard do Instrutor | Instrutores na Direção</title>
        <meta 
          name="description" 
          content="Gerencie seu perfil de instrutor, agenda, contatos e estatísticas." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">
                    Olá, {instructor?.name?.split(' ')[0]}! 👋
                  </h1>
                  {currentSubscription && <PlanBadge planType={currentSubscription.planType} size="md" />}
                </div>
                <p className="text-muted-foreground">
                  Gerencie seu perfil e acompanhe seu desempenho
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/instrutor/planos">
                  <Button variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    {isPremium ? 'Gerenciar Plano' : 'Fazer Upgrade'}
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>

            {/* Premium Banner */}
            {currentPlanType !== 'trial' && currentPlanType !== 'expired' && (
              <PremiumPlanBanner planType={currentPlanType} />
            )}

            {/* Subscription Alert - Apenas para planos realmente expirados (não trial ativo) */}
            {isExpired && currentSubscription?.planType !== 'trial' && (
              <Card className="mb-6 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-amber-200">
                        Seu plano expirou
                      </p>
                      <p className="text-sm text-amber-300/80">
                        Renove sua assinatura para continuar aproveitando todos os recursos.
                      </p>
                    </div>
                  </div>
                  <Link to="/instrutor/planos">
                    <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600">
                      Renovar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {subscription?.planType === 'trial' && subscription.daysRemaining && (
              <Card className="mb-6 border-blue-500/50 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-medium text-blue-200">
                        {subscription.daysRemaining} dias restantes no período de teste
                      </p>
                      <p className="text-sm text-blue-300/80">
                        Faça upgrade para desbloquear todos os recursos premium.
                      </p>
                    </div>
                  </div>
                  <Link to="/instrutor/planos">
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600">
                      Ver Planos
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Status Alert */}
            {instructor?.status === 'pending' && (
              <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                <CardContent className="flex items-center gap-3 py-4">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Perfil em análise
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Seu perfil está sendo revisado pela nossa equipe. Você será notificado quando for aprovado.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {instructor?.status === 'suspended' && (
              <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
                <CardContent className="flex items-center gap-3 py-4">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      Perfil suspenso
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Seu perfil foi suspenso. Verifique seu email para mais informações sobre o motivo da suspensão.
                    </p>
                    {suspensionReason && (
                      <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/50 rounded-md border border-red-200 dark:border-red-800">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-200">Motivo:</p>
                        <p className="text-sm text-red-800 dark:text-red-300 mt-1">{suspensionReason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Lessons Section */}
            <PendingLessonsList 
              pendingLessons={pendingLessons}
              isActionLoading={isActionLoading}
              onLessonAction={handleLessonAction}
            />

            {/* Metrics Dashboard */}
            {instructor && (
              <div className="mb-8">
                <InstructorMetricsDashboard 
                  instructorId={instructor.id} 
                  planType={currentPlanType}
                />
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Meu Perfil</CardTitle>
                  <CardDescription>
                    Edite suas informações, fotos e descrição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowEditModal(true)}
                  >
                    Editar Perfil
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-2">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Minha Agenda</CardTitle>
                  <CardDescription>
                    Gerencie sua disponibilidade e aulas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/instrutor/agenda">
                    <Button variant="outline" className="w-full">
                      Ver Agenda
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-2">
                    <MessageSquare className="h-6 w-6 text-warning" />
                  </div>
                  <CardTitle>Mensagens</CardTitle>
                  <CardDescription>
                    {unreadCount > 0 ? `${unreadCount} mensagens não lidas` : 'Suas conversas com alunos'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/mensagens">
                    <Button variant="outline" className="w-full">
                      Ver Mensagens
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Profile Views Analytics Card */}
              {instructor && (
                <ProfileViewsCard 
                  instructorId={instructor.id} 
                  planType={currentPlanType}
                />
              )}

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-2">
                    <HelpCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <CardTitle>Suporte</CardTitle>
                  <CardDescription>
                    Abra um chamado para nossa equipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SupportTicketForm 
                    triggerButton={
                      <Button variant="outline" className="w-full gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Abrir Chamado
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            </div>

            {/* Lesson History Section */}
            <div className="mt-8">
              <InstructorLessonHistory />
            </div>

            {/* Subscription History Section */}
            <div className="mt-8">
              <SubscriptionHistory />
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {instructor && (
        <EditProfileModal 
          instructor={instructor}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={() => loadInstructorData()}
        />
      )}
    </>
  );
}
