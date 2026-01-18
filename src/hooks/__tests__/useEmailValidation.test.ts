/**
 * useEmailValidation Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmailValidation, EmailValidationResult } from '../useEmailValidation';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import { supabase } from '@/integrations/supabase/client';

describe('useEmailValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useEmailValidation());

    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationResult).toBe(null);
    expect(result.current.requiresChallenge).toBe(false);
    expect(result.current.isBlocked).toBe(false);
  });

  it('should return null for empty email', async () => {
    const { result } = renderHook(() => useEmailValidation());

    let validationResult: EmailValidationResult | null = null;
    await act(async () => {
      validationResult = await result.current.validateEmail('');
    });

    expect(validationResult).toBe(null);
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('should return null for email without @', async () => {
    const { result } = renderHook(() => useEmailValidation());

    let validationResult: EmailValidationResult | null = null;
    await act(async () => {
      validationResult = await result.current.validateEmail('notanemail');
    });

    expect(validationResult).toBe(null);
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('should call edge function for valid email format', async () => {
    const mockResult: EmailValidationResult = {
      email: 'test@example.com',
      status: 'PERMITIDO',
      score_risco: 0,
      motivos: ['Nenhum problema detectado'],
      dominio: 'example.com',
      mx_valido: true,
      idade_dominio_dias: 3650,
      reputacao: {
        virustotal: 'limpo',
        abuseipdb: 'baixo risco (0%)',
      },
      acao_recomendada: 'Prosseguir com autenticação normal',
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: mockResult,
      error: null,
    });

    const { result } = renderHook(() => useEmailValidation());

    let validationResult: EmailValidationResult | null = null;
    await act(async () => {
      validationResult = await result.current.validateEmail('test@example.com');
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('validate-email-security', {
      body: { email: 'test@example.com' },
    });
    expect(validationResult).toEqual(mockResult);
    expect(result.current.isBlocked).toBe(false);
    expect(result.current.requiresChallenge).toBe(false);
  });

  it('should identify blocked emails', async () => {
    const mockResult: EmailValidationResult = {
      email: 'test@malicious.xyz',
      status: 'BLOQUEADO',
      score_risco: 85,
      motivos: ['Email descartável detectado', 'TLD suspeito'],
      dominio: 'malicious.xyz',
      mx_valido: false,
      idade_dominio_dias: 5,
      reputacao: {
        virustotal: 'malicioso (3 detecções)',
        abuseipdb: 'alto risco (90%)',
      },
      acao_recomendada: 'Email bloqueado por segurança. Use outro email.',
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: mockResult,
      error: null,
    });

    const { result } = renderHook(() => useEmailValidation());

    await act(async () => {
      await result.current.validateEmail('test@malicious.xyz');
    });

    expect(result.current.isBlocked).toBe(true);
    expect(result.current.requiresChallenge).toBe(false);
  });

  it('should identify emails requiring challenge', async () => {
    const mockResult: EmailValidationResult = {
      email: 'test@suspicious.com',
      status: 'DESAFIO',
      score_risco: 45,
      motivos: ['Domínio muito recente (15 dias)'],
      dominio: 'suspicious.com',
      mx_valido: true,
      idade_dominio_dias: 15,
      reputacao: {
        virustotal: 'desconhecido',
        abuseipdb: 'risco moderado (30%)',
      },
      acao_recomendada: 'Verificação adicional necessária (CAPTCHA/MFA)',
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: mockResult,
      error: null,
    });

    const { result } = renderHook(() => useEmailValidation());

    await act(async () => {
      await result.current.validateEmail('test@suspicious.com');
    });

    expect(result.current.requiresChallenge).toBe(true);
    expect(result.current.isBlocked).toBe(false);
  });

  it('should clear validation state', async () => {
    const mockResult: EmailValidationResult = {
      email: 'test@example.com',
      status: 'PERMITIDO',
      score_risco: 0,
      motivos: ['Nenhum problema detectado'],
      dominio: 'example.com',
      mx_valido: true,
      idade_dominio_dias: 3650,
      reputacao: { virustotal: 'limpo', abuseipdb: 'baixo risco (0%)' },
      acao_recomendada: 'Prosseguir com autenticação normal',
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: mockResult,
      error: null,
    });

    const { result } = renderHook(() => useEmailValidation());

    await act(async () => {
      await result.current.validateEmail('test@example.com');
    });

    expect(result.current.validationResult).not.toBe(null);

    act(() => {
      result.current.clearValidation();
    });

    expect(result.current.validationResult).toBe(null);
  });

  it('should handle edge function errors gracefully', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: new Error('Network error'),
    });

    const { result } = renderHook(() => useEmailValidation());

    let validationResult: EmailValidationResult | null = null;
    await act(async () => {
      validationResult = await result.current.validateEmail('test@example.com');
    });

    // Should fail open
    expect(validationResult).toBe(null);
    expect(result.current.isBlocked).toBe(false);
  });
});
