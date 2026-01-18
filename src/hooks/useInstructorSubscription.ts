import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionData {
  planType: string;
  isActive: boolean;
  trialEndsAt?: string;
  daysRemaining?: number;
  subscriptionEnd?: string;
  stripeSubscriptionId?: string;
}

export interface PlanFeatures {
  hasUnlimitedLessons: boolean;
  hasAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasVerifiedBadge: boolean;
  hasHighlightBadge: boolean;
  hasActiveBadge: boolean;
  searchRanking: number; // Lower is better (1-100)
  maxLessonsPerMonth: number;
  supportLevel: 'email' | 'email_chat' | 'priority' | 'vip_24h';
}

const PLAN_FEATURES: Record<string, PlanFeatures> = {
  trial: {
    hasUnlimitedLessons: false,
    hasAnalytics: false,
    hasPrioritySupport: false,
    hasVerifiedBadge: false,
    hasHighlightBadge: false,
    hasActiveBadge: false,
    searchRanking: 100,
    maxLessonsPerMonth: 10,
    supportLevel: 'email',
  },
  expired: {
    hasUnlimitedLessons: false,
    hasAnalytics: false,
    hasPrioritySupport: false,
    hasVerifiedBadge: false,
    hasHighlightBadge: false,
    hasActiveBadge: false,
    searchRanking: 100,
    maxLessonsPerMonth: 0,
    supportLevel: 'email',
  },
  essencial: {
    hasUnlimitedLessons: true,
    hasAnalytics: false,
    hasPrioritySupport: false,
    hasVerifiedBadge: false,
    hasHighlightBadge: false,
    hasActiveBadge: true,
    searchRanking: 50,
    maxLessonsPerMonth: -1, // Unlimited
    supportLevel: 'email_chat',
  },
  destaque: {
    hasUnlimitedLessons: true,
    hasAnalytics: true,
    hasPrioritySupport: true,
    hasVerifiedBadge: false,
    hasHighlightBadge: true,
    hasActiveBadge: true,
    searchRanking: 10,
    maxLessonsPerMonth: -1,
    supportLevel: 'priority',
  },
  elite: {
    hasUnlimitedLessons: true,
    hasAnalytics: true,
    hasPrioritySupport: true,
    hasVerifiedBadge: true,
    hasHighlightBadge: true,
    hasActiveBadge: true,
    searchRanking: 5,
    maxLessonsPerMonth: -1,
    supportLevel: 'vip_24h',
  },
};

export function useInstructorSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [features, setFeatures] = useState<PlanFeatures>(PLAN_FEATURES.trial);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    try {
      setError(null);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        setIsLoading(false);
        return null;
      }

      const { data, error: fnError } = await supabase.functions.invoke('check-instructor-subscription', {
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (fnError) throw fnError;

      if (data?.subscription) {
        const sub = data.subscription as SubscriptionData;
        setSubscription(sub);
        
        // Set features based on plan and active status
        const planFeatures = sub.isActive 
          ? PLAN_FEATURES[sub.planType] || PLAN_FEATURES.trial
          : PLAN_FEATURES.expired;
        
        setFeatures(planFeatures);
        return sub;
      }
      
      return null;
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err instanceof Error ? err.message : 'Erro ao verificar assinatura');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check subscription on mount
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh subscription every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkSubscription();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkSubscription]);

  // Refresh on auth state change
  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => authSub.unsubscribe();
  }, [checkSubscription]);

  // Subscribe to realtime changes on instructor_subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('instructor-subscription-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instructor_subscriptions',
        },
        () => {
          console.log('Subscription updated in DB, refreshing...');
          checkSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkSubscription]);

  const isPlanActive = useCallback((planType: string) => {
    if (!subscription?.isActive) return false;
    return subscription.planType === planType;
  }, [subscription]);

  const hasFeature = useCallback((feature: keyof PlanFeatures) => {
    if (!subscription?.isActive) return false;
    return features[feature];
  }, [subscription, features]);

  const canAccessAnalytics = subscription?.isActive && features.hasAnalytics;
  const canAccessUnlimitedLessons = subscription?.isActive && features.hasUnlimitedLessons;
  const isPremium = subscription?.isActive && ['essencial', 'destaque', 'elite'].includes(subscription.planType);
  // Expirado apenas quando planType é 'expired' E não é trial ativo
  const isExpired = subscription?.planType === 'expired';

  return {
    subscription,
    features,
    isLoading,
    error,
    checkSubscription,
    isPlanActive,
    hasFeature,
    canAccessAnalytics,
    canAccessUnlimitedLessons,
    isPremium,
    isExpired,
  };
}

export { PLAN_FEATURES };
