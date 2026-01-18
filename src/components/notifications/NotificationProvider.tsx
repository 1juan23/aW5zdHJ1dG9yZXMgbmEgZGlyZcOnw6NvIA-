import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { supabase } from "@/integrations/supabase/client";

interface NotificationContextType {
  requestPermission: () => Promise<boolean>;
  isEnabled: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider");
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { requestPermission } = useRealtimeNotifications({
    enabled: isAuthenticated,
  });

  return (
    <NotificationContext.Provider value={{ requestPermission, isEnabled: isAuthenticated }}>
      {children}
    </NotificationContext.Provider>
  );
}
