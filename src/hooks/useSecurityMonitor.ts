import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AttackPattern {
  type: 'burst_attempts' | 'multiple_ips' | 'distributed_attack';
  email?: string;
  ipCount?: number;
  attemptCount?: number;
  timeWindowMinutes: number;
}

export function useSecurityMonitor() {
  const notifiedPatterns = useRef<Set<string>>(new Set());

  const showSecurityAlert = useCallback((pattern: AttackPattern) => {
    const patternKey = `${pattern.type}-${pattern.email || 'global'}-${Date.now()}`;
    
    // Prevent duplicate notifications within 1 minute
    if (notifiedPatterns.current.has(patternKey)) return;
    notifiedPatterns.current.add(patternKey);
    
    // Clear old keys after 60 seconds
    setTimeout(() => notifiedPatterns.current.delete(patternKey), 60000);

    const messages = {
      burst_attempts: {
        title: '⚠️ Burst de Tentativas Detectado',
        description: `${pattern.attemptCount} tentativas de login para ${pattern.email} nos últimos ${pattern.timeWindowMinutes} minutos`,
      },
      multiple_ips: {
        title: '🔴 Múltiplos IPs Detectados',
        description: `${pattern.ipCount} IPs diferentes tentaram acessar ${pattern.email}`,
      },
      distributed_attack: {
        title: '🚨 Ataque Distribuído Detectado',
        description: `Padrão suspeito: ${pattern.attemptCount} tentativas de ${pattern.ipCount} IPs em ${pattern.timeWindowMinutes}min`,
      },
    };

    const { title, description } = messages[pattern.type];
    
    // Show persistent toast notification
    toast.error(title, {
      description,
      duration: 15000,
      action: {
        label: 'Ver Logs',
        onClick: () => {
          // Navigate to security tab
          window.dispatchEvent(new CustomEvent('navigate-to-security'));
        },
      },
    });

    // Also try browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: description,
        icon: '/logo.png',
        tag: patternKey,
      });
    }
  }, []);

  const analyzeRecentAttempts = useCallback(async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Get recent failed login attempts
      const { data: attempts, error } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('success', false)
        .gte('attempted_at', fiveMinutesAgo)
        .order('attempted_at', { ascending: false });

      if (error || !attempts?.length) return;

      // Group by email
      const byEmail = attempts.reduce((acc, attempt) => {
        const key = attempt.email;
        if (!acc[key]) acc[key] = [];
        acc[key].push(attempt);
        return acc;
      }, {} as Record<string, typeof attempts>);

      // Analyze patterns per email
      for (const [email, emailAttempts] of Object.entries(byEmail)) {
        // Burst detection: 5+ attempts in 5 minutes
        if (emailAttempts.length >= 5) {
          showSecurityAlert({
            type: 'burst_attempts',
            email,
            attemptCount: emailAttempts.length,
            timeWindowMinutes: 5,
          });
        }

        // Multiple IPs for same email
        const uniqueIps = new Set(emailAttempts.map(a => a.ip_address).filter(Boolean));
        if (uniqueIps.size >= 3) {
          showSecurityAlert({
            type: 'multiple_ips',
            email,
            ipCount: uniqueIps.size,
            timeWindowMinutes: 5,
          });
        }
      }

      // Global distributed attack detection
      const allUniqueIps = new Set(attempts.map(a => a.ip_address).filter(Boolean));
      if (attempts.length >= 10 && allUniqueIps.size >= 5) {
        showSecurityAlert({
          type: 'distributed_attack',
          attemptCount: attempts.length,
          ipCount: allUniqueIps.size,
          timeWindowMinutes: 5,
        });
      }
    } catch (error) {
      console.error('Error analyzing security patterns:', error);
    }
  }, [showSecurityAlert]);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initial analysis
    analyzeRecentAttempts();

    // Subscribe to real-time login attempts
    const channel = supabase
      .channel('admin-security-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'login_attempts',
        },
        (payload) => {
          if (payload.new && !payload.new.success) {
            // Re-analyze on each failed attempt
            analyzeRecentAttempts();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_logs',
        },
        (payload) => {
          if (payload.new) {
            const { event_type, email } = payload.new as { event_type: string; email?: string };
            
            if (event_type === 'account_locked') {
              toast.warning('🔒 Conta Bloqueada', {
                description: `${email || 'Uma conta'} foi bloqueada por tentativas excessivas`,
                duration: 10000,
              });
            }
          }
        }
      )
      .subscribe();

    // Periodic analysis every 30 seconds
    const interval = setInterval(analyzeRecentAttempts, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [analyzeRecentAttempts]);

  return { analyzeRecentAttempts };
}
