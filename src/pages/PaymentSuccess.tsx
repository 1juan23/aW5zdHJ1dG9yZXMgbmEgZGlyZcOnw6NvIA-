import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Sua assinatura foi ativada com sucesso!");
  const [subMessage, setSubMessage] = useState("Todos os benefícios do seu novo plano já estão disponíveis!");
  const confettiTriggered = useRef(false);

  // Fire confetti celebration
  useEffect(() => {
    if (confettiTriggered.current) return;
    confettiTriggered.current = true;

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#fbbf24'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#fbbf24'],
      });
    }, 250);

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#10b981', '#34d399', '#fbbf24', '#f59e0b'],
    });

    return () => clearInterval(interval);
  }, []);

  // Handle payment verification and access registration
  useEffect(() => {
    const processPayment = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const role = roleData?.role || 'student';
        setUserRole(role);

        const paymentType = searchParams.get('type');
        const instructorId = searchParams.get('instructor_id');


        // Handle student access payment
        if (paymentType === 'student_access' && instructorId) {
          console.log('Registering student access for instructor:', instructorId);
          
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.access_token) {
            const { data, error } = await supabase.functions.invoke('register-student-access', {
              headers: { Authorization: `Bearer ${session.session.access_token}` },
              body: { instructor_id: instructorId }
            });
            
            if (error) {
              console.error('Error registering access:', error);
            } else {
              console.log('Access registered:', data);
              setMessage("Pagamento Confirmado!");
              setSubMessage("Agora você pode entrar em contato com o instrutor e agendar suas aulas!");
            }
          }
        }
        
        // Handle Booking Fee payment
        if (paymentType === 'booking') {
            const pendingBookingStr = localStorage.getItem('pendingBooking');
            if (pendingBookingStr) {
                const pending = JSON.parse(pendingBookingStr);
                
                // Create the lesson
                const [hours, minutes] = pending.selectedTime.split(':').map(Number);
                const scheduledAt = new Date(pending.selectedDate);
                scheduledAt.setHours(hours, minutes, 0, 0);
                
                const { error } = await supabase
                    .from('lessons')
                    .insert({
                      student_id: user.id,
                      instructor_id: pending.instructor.id,
                      scheduled_at: scheduledAt.toISOString(),
                      duration_minutes: 60,
                      price: pending.priceAmount,
                      status: 'pending',
                    });

                if (error) {
                    console.error('Error creating lesson:', error);
                    setMessage("Erro ao agendar aula");
                    setSubMessage("O pagamento foi processado, mas houve um erro ao criar a aula. Entre em contato com o suporte.");
                } else {
                    localStorage.removeItem('pendingBooking');
                    setMessage("Aula Agendada com Sucesso!");
                    setSubMessage(`Solicitação enviada para ${pending.instructor.name}. Aguarde a confirmação.`);
                }
            }
        }

        // Handle instructor subscription payment
        if (role === 'instructor') {
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.access_token) {
            const { data } = await supabase.functions.invoke('check-instructor-subscription', {
              headers: { Authorization: `Bearer ${session.session.access_token}` }
            });
            
            console.log('Subscription verified after payment:', data);
            
            if (data?.subscription?.planType && data.subscription.planType !== 'trial') {
              const planNames: Record<string, string> = {
                'essencial': 'Essencial',
                'destaque': 'Destaque',
                'elite': 'Elite',
              };
              setMessage("Plano Ativado com Sucesso!");
              setSubMessage(`Seu plano ${planNames[data.subscription.planType] || data.subscription.planType} já está ativo com todos os benefícios!`);
            }
          }
        }
      } catch (error) {
        console.error('Error processing payment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

  const getDashboardLink = () => {
    const instructorId = searchParams.get('instructor_id');
    
    // If student just paid for instructor access, redirect to instructor profile
    if (instructorId && userRole === 'student') {
      return `/instrutor/${instructorId}?payment=success`;
    }
    
    if (userRole === 'instructor') return '/instrutor/dashboard';
    if (userRole === 'admin') return '/admin/dashboard';
    return '/aluno/dashboard';
  };

  const getDashboardLabel = () => {
    const instructorId = searchParams.get('instructor_id');
    
    if (instructorId && userRole === 'student') {
      return 'Agendar Aula com o Instrutor';
    }
    
    if (userRole === 'instructor') return 'Ir para o Dashboard';
    if (userRole === 'admin') return 'Ir para o Admin';
    return 'Ir para Minha Área';
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow effect background */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '120px',
        height: '120px',
        backgroundColor: '#22c55e',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px',
        boxShadow: '0 0 60px rgba(34, 197, 94, 0.5)',
        animation: 'pulse 2s infinite',
        position: 'relative',
        zIndex: 1,
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </div>
      
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        marginBottom: '16px', 
        color: '#ffffff', 
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {message}
      </h1>
      
      <p style={{ 
        fontSize: '1.125rem', 
        color: '#94a3b8', 
        marginBottom: '16px', 
        textAlign: 'center', 
        maxWidth: '400px',
        position: 'relative',
        zIndex: 1,
      }}>
        {subMessage}
      </p>

      <p style={{ 
        fontSize: '1rem', 
        color: '#22c55e', 
        marginBottom: '40px', 
        textAlign: 'center', 
        maxWidth: '400px',
        fontWeight: '600',
        position: 'relative',
        zIndex: 1,
      }}>
        ✓ Acesso liberado instantaneamente
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px', 
        width: '100%', 
        maxWidth: '300px',
        position: 'relative',
        zIndex: 1,
      }}>
        {!isLoading && userRole && (
          <Link 
            to={getDashboardLink()} 
            style={{ 
              display: 'block', 
              padding: '16px 24px', 
              background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)', 
              color: 'white', 
              textAlign: 'center', 
              borderRadius: '12px', 
              textDecoration: 'none', 
              fontWeight: '700',
              boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(34, 197, 94, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.4)';
            }}
          >
            {getDashboardLabel()}
          </Link>
        )}
        
        {userRole === 'instructor' && (
          <Link 
            to="/instrutor/planos" 
            style={{ 
              display: 'block', 
              padding: '14px 24px', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              color: '#ffffff', 
              textAlign: 'center', 
              borderRadius: '12px', 
              textDecoration: 'none', 
              fontWeight: '600', 
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }}
          >
            Ver Meu Plano
          </Link>
        )}
        
        <Link 
          to="/" 
          style={{ 
            display: 'block', 
            padding: '14px 24px', 
            backgroundColor: 'transparent', 
            color: '#94a3b8', 
            textAlign: 'center', 
            borderRadius: '12px', 
            textDecoration: 'none', 
            fontWeight: '600',
            transition: 'color 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          Voltar ao Início
        </Link>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
