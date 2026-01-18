import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Mail, Lock, Eye, EyeOff, Shield, Loader2, ShieldCheck } from "lucide-react";
import { TwoFactorVerify } from "@/components/auth/TwoFactorVerify";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, getFirstZodError } from "@/lib/validations";
import { z } from "zod";
import { useEmailValidation } from "@/hooks/useEmailValidation";
import { EmailSecurityBadge } from "@/components/auth/EmailSecurityBadge";

export default function InstructorLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [needs2FA, setNeeds2FA] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Email security validation
  const { 
    validateEmail: validateEmailSecurity, 
    isValidating: isValidatingEmail, 
    validationResult: emailValidationResult,
    isBlocked: isEmailBlocked,
    clearValidation: clearEmailValidation
  } = useEmailValidation();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Check if user is an instructor
        setTimeout(() => {
          checkInstructorRole(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkInstructorRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkInstructorRole = async (userId: string) => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'instructor')
      .maybeSingle();

    if (roles) {
      navigate('/instrutor/dashboard');
    }
  };

  const validateForm = () => {
    setErrors({});
    
    try {
      loginSchema.parse(formData);
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
    
    setIsLoading(true);

    // Email security validation - MANDATORY before authentication
    const emailSecurityResult = await validateEmailSecurity(formData.email);
    
    if (emailSecurityResult?.status === 'BLOQUEADO') {
      toast({
        title: "Email bloqueado",
        description: "Este email foi bloqueado por motivos de segurança. Use outro email.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Erro ao fazer login.");
      }

      // Check if user has MFA enabled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasVerifiedFactor = factors?.totp?.some(f => f.status === 'verified');
      
      if (hasVerifiedFactor) {
        setNeeds2FA(true);
        setIsLoading(false);
        return;
      }

      // Check if user is an instructor
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'instructor')
        .maybeSingle();

      if (roleError) throw roleError;

      if (!roles) {
        await supabase.auth.signOut();
        toast({
          title: "Acesso negado",
          description: "Esta conta não é de instrutor. Use a área de alunos.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo à sua área de instrutor.",
      });
      
      navigate('/instrutor/dashboard');
    } catch (error: any) {
      let errorMessage = "Ocorreu um erro. Tente novamente.";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha incorretos.";
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
    navigate('/instrutor/dashboard');
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
        <title>Área do Instrutor | Instrutores na Direção</title>
        <meta 
          name="description" 
          content="Acesse sua área exclusiva de instrutor para gerenciar seu perfil, agenda e contatos." 
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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm mb-4 font-medium">
                <Shield className="h-4 w-4" />
                Área do Instrutor
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Bem-vindo, Instrutor!
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                Acesse sua área exclusiva para gerenciar seu perfil e agenda
              </p>
            </div>

            <Card variant="elevated" className="backdrop-blur-sm border-border/50 animate-fade-in-up">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Acesso Seguro</span>
                </div>
                <CardTitle className="text-xl text-center">Entrar</CardTitle>
                <CardDescription className="text-center">
                  Use suas credenciais de instrutor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="instrutor@email.com"
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
                  </div>

                  <div className="flex items-center justify-end">
                    <Link 
                      to="/recuperar-senha" 
                      className="text-sm text-accent hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
                <hr className="my-6" />

                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ainda não é instrutor cadastrado?
                  </p>
                  <Link to="/instrutor/cadastro">
                    <Button variant="accent" className="w-full">
                      Cadastrar como instrutor
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Aumente sua visibilidade e conquiste mais alunos
                  </p>
                </div>

                <hr className="my-6" />

                <div className="text-center">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      Sou aluno, quero entrar na área de alunos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}