import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailValidationResult {
  email: string;
  status: 'PERMITIDO' | 'DESAFIO' | 'BLOQUEADO';
  score_risco: number;
  motivos: string[];
  dominio: string;
  mx_valido: boolean;
  idade_dominio_dias: number | null;
  reputacao: {
    virustotal: string;
    abuseipdb: string;
  };
  acao_recomendada: string;
}

interface UseEmailValidationReturn {
  validateEmail: (email: string) => Promise<EmailValidationResult | null>;
  isValidating: boolean;
  validationResult: EmailValidationResult | null;
  requiresChallenge: boolean;
  isBlocked: boolean;
  clearValidation: () => void;
}

export function useEmailValidation(): UseEmailValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<EmailValidationResult | null>(null);
  const { toast } = useToast();

  const validateEmail = useCallback(async (email: string): Promise<EmailValidationResult | null> => {
    if (!email || !email.includes('@')) {
      return null;
    }

    setIsValidating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-email-security', {
        body: { email: email.trim().toLowerCase() }
      });

      if (error) {
        console.error('Email validation error:', error);
        // Fail open - allow the email if validation service is down
        return null;
      }

      const result = data as EmailValidationResult;
      setValidationResult(result);

      if (result.status === 'BLOQUEADO') {
        toast({
          title: "Email bloqueado",
          description: result.motivos.join('. '),
          variant: "destructive",
        });
      } else if (result.status === 'DESAFIO') {
        toast({
          title: "Verificação adicional necessária",
          description: "Por segurança, uma verificação extra será solicitada.",
          variant: "default",
        });
      }

      return result;
    } catch (error) {
      console.error('Email validation failed:', error);
      // Fail open
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [toast]);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  return {
    validateEmail,
    isValidating,
    validationResult,
    requiresChallenge: validationResult?.status === 'DESAFIO',
    isBlocked: validationResult?.status === 'BLOQUEADO',
    clearValidation
  };
}
