import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScheduleManager } from "@/components/scheduling/ScheduleManager";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function InstructorSchedule() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/instrutor/login');
        return;
      }

      // Check if user is an instructor
      const { data: instructor } = await supabase
        .from('instructors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!instructor) {
        navigate('/instrutor/cadastro');
        return;
      }

      setIsLoading(false);
    }

    checkAuth();
  }, [navigate]);

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
        <title>Minha Agenda | Instrutores na Direção</title>
        <meta name="description" content="Gerencie sua disponibilidade e horários de aula" />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Minha Agenda</h1>
              <p className="text-muted-foreground">
                Configure sua disponibilidade e horários para aulas
              </p>
            </div>
            
            <ScheduleManager />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
