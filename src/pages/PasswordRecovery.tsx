import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { passwordRecoverySchema, getFirstZodError } from "@/lib/validations";
import { z } from "zod";
import { useEmailValidation } from "@/hooks/useEmailValidation";
import { EmailSecurityBadge } from "@/components/auth/EmailSecurityBadge";

export default function PasswordRecovery() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { 
    validateEmail: validateEmailSecurity, 
    isValidating: isValidatingEmail, 
    validationResult: emailValidationResult,
    isBlocked: isEmailBlocked,
    clearValidation: clearEmailValidation
  } = useEmailValidation();

  const validateForm = () => {
    setEmailError(null);
    
    try {
      passwordRecoverySchema.parse({ email });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = getFirstZodError(error);
        setEmailError(firstError);
        toast({
          title: "Erro de validação",
          description: firstError,
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

    // Email security validation
    const emailSecurityResult = await validateEmailSecurity(email);
    if (emailSecurityResult?.status === 'BLOQUEADO') {
      toast({
        title: "Email bloqueado",
        description: "Este email foi bloqueado por segurança.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) throw error;

      setIsEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email. Verifique o endereço informado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Helmet>
        <title>Recuperar Senha | Instrutores na Direção</title>
        <meta 
          name="description" 
          content="Recupere sua senha para acessar sua conta na plataforma Instrutores na Direção." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
                <Car className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Recuperar senha
              </h1>
              <p className="text-muted-foreground mt-2">
                {isEmailSent 
                  ? "Verifique seu email para continuar" 
                  : "Digite seu email para receber o link de recuperação"}
              </p>
            </div>

            <Card variant="elevated">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl text-center">
                  {isEmailSent ? "Email enviado!" : "Esqueceu sua senha?"}
                </CardTitle>
                <CardDescription className="text-center">
                  {isEmailSent 
                    ? "Clique no link enviado para seu email" 
                    : "Enviaremos um link para você redefinir sua senha"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEmailSent ? (
                  <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Enviamos um email para <strong className="text-foreground">{email}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Não recebeu? Verifique sua pasta de spam ou tente novamente.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsEmailSent(false)}
                    >
                      Tentar outro email
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          className={`pl-10 ${emailError || isEmailBlocked ? "border-destructive" : ""}`}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            clearEmailValidation();
                          }}
                          onBlur={() => {
                            if (email.includes('@')) {
                              validateEmailSecurity(email);
                            }
                          }}
                          required
                          disabled={isLoading || isValidatingEmail}
                        />
                      </div>
                      <EmailSecurityBadge isValidating={isValidatingEmail} result={emailValidationResult} />
                      {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar link de recuperação"
                      )}
                    </Button>
                  </form>
                )}

                <hr className="my-6" />

                <div className="text-center">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                      <ArrowLeft className="h-4 w-4" />
                      Voltar para o login
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