import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, signupSchema, getFirstZodError } from "@/lib/validations";
import { z } from "zod";
import { TwoFactorVerify } from "@/components/auth/TwoFactorVerify";
import { SocialLogin } from "@/components/auth/SocialLogin";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

import { useEmailValidation } from "@/hooks/useEmailValidation";
import { EmailSecurityBadge } from "@/components/auth/EmailSecurityBadge";


export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [needs2FA, setNeeds2FA] = useState(false);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Email security validation
  const { 
    validateEmail: validateEmailSecurity, 
    isValidating: isValidatingEmail, 
    validationResult: emailValidationResult,
    isBlocked: isEmailBlocked,
    requiresChallenge: emailRequiresChallenge,
    clearValidation: clearEmailValidation
  } = useEmailValidation();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });

  // Check if account is locked when email changes
  useEffect(() => {
    const checkAccountLock = async () => {
      if (!formData.email.includes('@') || !isLogin) return;
      
      const trimmedEmail = formData.email.trim().toLowerCase();
      const { data: isLocked } = await supabase.rpc('is_account_locked', {
        check_email: trimmedEmail
      });
      
      if (isLocked) {
        setIsAccountLocked(true);
        setLockTimeRemaining(15 * 60); // 15 minutes in seconds
      } else {
        setIsAccountLocked(false);
        setLockTimeRemaining(0);
      }
    };

    const debounceTimer = setTimeout(checkAccountLock, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.email, isLogin]);

  // Countdown timer for locked accounts
  useEffect(() => {
    if (!isAccountLocked || lockTimeRemaining <= 0) return;

    const interval = setInterval(() => {
      setLockTimeRemaining(prev => {
        if (prev <= 1) {
          setIsAccountLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAccountLocked, lockTimeRemaining]);

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  useEffect(() => {
    const handleAuthRedirect = async (session: any) => {
      if (session?.user) {
        // Fetch user role or metadata to determine redirect
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        const userType = session.user.user_metadata?.user_type;

        if (roleData?.role === 'instructor' || userType === 'instructor') {
          navigate('/instrutor/dashboard');
        } else if (roleData?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          // Students go to find instructors page instead of generic home
          navigate('/instrutores');
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthRedirect(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthRedirect(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    setErrors({});
    
    try {
      if (isLogin) {
        loginSchema.parse({ email: formData.email, password: formData.password });
      } else {
        signupSchema.parse(formData);
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Erro de validação",
          description: getFirstZodError(error),
          variant: "destructive",
        });
      }
      return false;
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Email security validation - MANDATORY before any authentication
    const emailSecurityResult = await validateEmailSecurity(formData.email);
    
    if (emailSecurityResult?.status === 'BLOQUEADO') {
      toast({
        title: "Email bloqueado",
        description: "Este email foi bloqueado por motivos de segurança. Use outro email.",
        variant: "destructive",
      });
      return;
    }

    // For registration, also block high-risk emails
    if (!isLogin && emailSecurityResult) {
      // Block high-risk emails (score > 50)
      if (emailSecurityResult.score_risco > 50) {
        toast({
          title: "Email de alto risco",
          description: `Score de risco: ${emailSecurityResult.score_risco}/100. Este email não pode ser usado para cadastro.`,
          variant: "destructive",
        });
        return;
      }

      // Block if VirusTotal detected as malicious
      if (emailSecurityResult.reputacao?.virustotal && 
          emailSecurityResult.reputacao.virustotal !== 'limpo' && 
          emailSecurityResult.reputacao.virustotal !== 'sem_dados') {
        toast({
          title: "Email malicioso detectado",
          description: `VirusTotal detectou este email como: ${emailSecurityResult.reputacao.virustotal}`,
          variant: "destructive",
        });
        return;
      }
    }

    
    setIsLoading(true);
    const trimmedEmail = formData.email.trim().toLowerCase();

    try {
      if (isLogin) {
        // Check if account is locked
        const { data: isLocked, error: lockError } = await supabase.rpc('is_account_locked', {
          check_email: trimmedEmail
        });

        if (lockError) {
          console.error('Error checking account lock:', lockError);
        }

        if (isLocked) {
          toast({
            title: "Conta bloqueada",
            description: "Sua conta está temporariamente bloqueada devido a múltiplas tentativas de login falhas. Tente novamente em 15 minutos.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Login attempt
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: formData.password,
        });

        if (error) {
          // Record failed login attempt
          await supabase.rpc('record_login_attempt', {
            attempt_email: trimmedEmail,
            attempt_ip: null,
            attempt_success: false
          });

          // Check if this failed attempt caused account lock
          const { data: nowLocked } = await supabase.rpc('is_account_locked', {
            check_email: trimmedEmail
          });

          if (nowLocked) {
            // Send email notification about account lock
            supabase.functions.invoke('send-account-locked-email', {
              body: {
                email: trimmedEmail,
                attemptCount: 5,
                lockDurationMinutes: 15
              }
            }).catch(e => console.error('Failed to send lock notification:', e));

            // Log security event
            await supabase.rpc('log_security_event', {
              p_event_type: 'account_locked',
              p_email: trimmedEmail,
              p_details: { reason: 'multiple_failed_attempts' }
            });
          }


          throw error;
        }

        // Record successful login
        await supabase.rpc('record_login_attempt', {
          attempt_email: trimmedEmail,
          attempt_ip: null,
          attempt_success: true
        });

        // Check if user has MFA enabled
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const hasVerifiedFactor = factors?.totp?.some(f => f.status === 'verified');
        
        if (hasVerifiedFactor) {
          setNeeds2FA(true);
          setIsLoading(false);
          return;
        }

        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta!",
        });
        
        // Check role and redirect appropriately
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        if (roleData?.role === 'instructor') {
          navigate('/instrutor/dashboard');
        } else if (roleData?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/instrutores');
        }
      } else {
        // Signup
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: formData.name.trim(),
              user_type: 'student',
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Conta criada!",
          description: "Sua conta foi criada com sucesso.",
        });
        
        // New students go to find instructors
        navigate('/instrutores');
      }
    } catch (error: any) {
      let errorMessage = "Ocorreu um erro. Tente novamente.";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.message?.includes("already registered")) {
        errorMessage = "Este email já está cadastrado.";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Email inválido.";
      } else if (error.message?.includes("Account locked")) {
        errorMessage = "Conta bloqueada temporariamente. Tente novamente em 15 minutos.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASuccess = async () => {
    toast({
      title: "Login realizado!",
      description: "Verificação 2FA concluída.",
    });
    
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();

    if (roleData?.role === 'instructor') {
      navigate('/instrutor/dashboard');
    } else if (roleData?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/instrutores');
    }
  };

  // If needs 2FA verification, show 2FA screen
  if (needs2FA) {
    return (
      <>
        <Helmet>
          <title>Verificação 2FA | Instrutores na Direção</title>
        </Helmet>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <TwoFactorVerify 
              onSuccess={handle2FASuccess}
              onCancel={() => {
                setNeeds2FA(false);
                supabase.auth.signOut();
              }}
            />
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isLogin ? "Entrar" : "Criar conta"} | Instrutores na Direção</title>
        <meta 
          name="description" 
          content="Faça login ou crie sua conta para encontrar os melhores instrutores de direção da sua região." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground mb-4 shadow-lg shadow-primary/20">
                <Car className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                {isLogin 
                  ? "Entre para continuar buscando instrutores" 
                  : "Cadastre-se para encontrar o instrutor ideal"}
              </p>
            </div>

            <Card variant="elevated" className="backdrop-blur-sm border-border/50 animate-fade-in-up">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Login Seguro</span>
                </div>
                <CardTitle className="text-xl text-center">
                  {isLogin ? "Entrar na conta" : "Criar nova conta"}
                </CardTitle>
                <CardDescription className="text-center">
                  {isLogin 
                    ? "Use seu email e senha para entrar" 
                    : "Preencha os dados abaixo para se cadastrar"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required={!isLogin}
                        disabled={isLoading}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        className={`pl-10 ${errors.email || isEmailBlocked ? "border-destructive" : ""}`}
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          clearEmailValidation();
                        }}
                        onBlur={() => {
                          if (formData.email.includes('@')) {
                            validateEmailSecurity(formData.email);
                          }
                        }}
                        required
                        disabled={isLoading || isValidatingEmail}
                      />
                    </div>
                    <EmailSecurityBadge isValidating={isValidatingEmail} result={emailValidationResult} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                      {!isLogin && formData.password && (
                        <PasswordStrengthIndicator password={formData.password} />
                      )}
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={`pl-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          required={!isLogin}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                    </div>
                  )}
                  {isLogin && (
                    <div className="flex items-center justify-end">
                      <Link 
                        to="/recuperar-senha" 
                        className="text-sm text-accent hover:underline"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full" 
                    disabled={isLoading || (isLogin && isAccountLocked) || isEmailBlocked}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : isAccountLocked && isLogin ? (
                      <>Conta bloqueada ({formatTimeRemaining(lockTimeRemaining)})</>
                    ) : (
                      isLogin ? "Entrar" : "Criar conta"
                    )}
                  </Button>
                  
                  {isAccountLocked && isLogin && (
                    <p className="text-xs text-center text-destructive mt-2">
                      Sua conta está bloqueada por múltiplas tentativas de login falhas. 
                      Aguarde {formatTimeRemaining(lockTimeRemaining)} para tentar novamente.
                    </p>
                  )}
                </form>

                {/* Social Login */}
                <div className="mt-6">
                  <SocialLogin mode={isLogin ? "login" : "signup"} disabled={isLoading} />
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="ml-1 text-accent hover:underline font-medium"
                      disabled={isLoading}
                    >
                      {isLogin ? "Cadastre-se" : "Entre aqui"}
                    </button>
                  </p>
                </div>

                <hr className="my-6" />

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    É instrutor de direção?
                  </p>
                  <Link to="/instrutor/login">
                    <Button variant="outline" className="w-full gap-2 hover:bg-primary hover:text-primary-foreground transition-all">
                      <Car className="h-4 w-4" />
                      Acessar área do instrutor
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Security badges */}
            <div className="mt-6 flex justify-center gap-6 text-xs text-muted-foreground animate-fade-in">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span>Dados criptografados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-green-500" />
                <span>Conexão segura</span>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}