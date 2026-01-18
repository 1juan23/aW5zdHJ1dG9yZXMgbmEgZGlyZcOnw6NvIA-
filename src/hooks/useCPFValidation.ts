import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function validateCPFFormat(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check if it has 11 digits
  if (cleanCPF.length !== 11) return false;
  
  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) return false;
  
  return true;
}

export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length <= 3) return cleanCPF;
  if (cleanCPF.length <= 6) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3)}`;
  if (cleanCPF.length <= 9) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6)}`;
  return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9, 11)}`;
}

export function useCPFValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateCPF = async (cpf: string): Promise<{ valid: boolean; duplicate: boolean }> => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // First, validate format
    if (!validateCPFFormat(cleanCPF)) {
      setIsValid(false);
      setIsDuplicate(false);
      return { valid: false, duplicate: false };
    }

    setIsValidating(true);
    
    try {
      // Check for duplicates in database
      const { data, error } = await supabase
        .from('instructors')
        .select('id')
        .eq('cpf', cleanCPF)
        .maybeSingle();

      if (error) {
        console.error('Error checking CPF:', error);
        setIsValid(true);
        setIsDuplicate(false);
        return { valid: true, duplicate: false };
      }

      const duplicate = !!data;
      setIsValid(true);
      setIsDuplicate(duplicate);
      return { valid: true, duplicate };
    } catch (err) {
      console.error('CPF validation error:', err);
      setIsValid(true);
      setIsDuplicate(false);
      return { valid: true, duplicate: false };
    } finally {
      setIsValidating(false);
    }
  };

  const clearValidation = () => {
    setIsValid(null);
    setIsDuplicate(false);
  };

  return {
    validateCPF,
    isValidating,
    isValid,
    isDuplicate,
    clearValidation,
  };
}
