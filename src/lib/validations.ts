import { z } from 'zod';

// Brazilian states
const BRAZILIAN_STATES = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email é obrigatório')
  .email('Email inválido')
  .max(255, 'Email muito longo');

// Password validation with stronger requirements
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(72, 'Senha muito longa (máximo 72 caracteres)')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Senha deve conter pelo menos um caractere especial');

// Simple password for login (don't enforce complexity on login)
export const loginPasswordSchema = z
  .string()
  .min(1, 'Senha é obrigatória');

// Name validation
export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras');

// Brazilian phone validation (flexible format)
export const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(20, 'Telefone muito longo')
  .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone deve conter apenas números');

// City validation
export const citySchema = z
  .string()
  .trim()
  .min(2, 'Cidade deve ter pelo menos 2 caracteres')
  .max(100, 'Nome da cidade muito longo');

// State validation
export const stateSchema = z.enum(BRAZILIAN_STATES, {
  errorMap: () => ({ message: 'Selecione um estado válido' })
});

// Price validation
export const priceSchema = z
  .string()
  .optional()
  .refine(val => !val || /^\d+(\.\d{1,2})?$/.test(val), 'Preço inválido')
  .refine(val => !val || parseFloat(val) >= 0, 'Preço deve ser positivo');

// Bio validation
export const bioSchema = z
  .string()
  .trim()
  .max(1000, 'Bio muito longa (máximo 1000 caracteres)')
  .optional();

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

// Signup schema
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  confirmPassword: z.string().min(1, 'Confirme sua senha'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// Instructor registration schema
export const instructorRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirme sua senha'),
  city: citySchema,
  state: stateSchema,
  neighborhoods: z.string().max(500, 'Lista de bairros muito longa').optional(),
  experience: z.string().max(50, 'Experiência inválida').optional(),
  specialties: z.array(z.string()).optional(),
  bio: bioSchema,
  price: priceSchema,
  terms: z.boolean().refine(val => val === true, 'Aceite os termos para continuar'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// Instructor profile edit schema
export const instructorProfileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  city: citySchema,
  state: stateSchema,
  neighborhoods: z.string().max(500, 'Lista de bairros muito longa').optional(),
  experience: z.string().max(50, 'Experiência inválida').optional(),
  specialties: z.array(z.string()).optional(),
  bio: bioSchema,
  price: priceSchema,
});

// Password recovery schema
export const passwordRecoverySchema = z.object({
  email: emailSchema,
});

// Helper function to format Zod errors for toast display
export function formatZodErrors(error: z.ZodError): string {
  return error.errors.map(err => err.message).join('. ');
}

// Helper function to get first error message
export function getFirstZodError(error: z.ZodError): string {
  return error.errors[0]?.message || 'Erro de validação';
}

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type InstructorRegistrationFormData = z.infer<typeof instructorRegistrationSchema>;
export type InstructorProfileFormData = z.infer<typeof instructorProfileSchema>;
export type PasswordRecoveryFormData = z.infer<typeof passwordRecoverySchema>;
