import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Mail, Lock, Eye, EyeOff, User, Phone, CheckCircle, ArrowRight, ArrowLeft, Loader2, Camera, IdCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { CityAutocomplete } from "@/components/ui/CityAutocomplete";
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { instructorRegistrationSchema, getFirstZodError } from "@/lib/validations";
import { z } from "zod";
import { useEmailValidation } from "@/hooks/useEmailValidation";
import { EmailSecurityBadge } from "@/components/auth/EmailSecurityBadge";
import { useCPFValidation, formatCPF } from "@/hooks/useCPFValidation";

const steps = [
  { id: 1, title: "Dados pessoais" },
  { id: 2, title: "Profissional" },
  { id: 3, title: "Finalizar" },
];

const categories = [
  "Iniciante",
  "Medo de dirigir",
  "Primeira habilitação",
  "Reciclagem",
  "Habilitados",
  "Baliza",
  "Estrada",
  "Defensiva",
];

const states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export default function InstructorRegister() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  
  // CPF validation
  const {
    validateCPF,
    isValidating: isValidatingCPF,
    isValid: isCPFValid,
    isDuplicate: isCPFDuplicate,
    clearValidation: clearCPFValidation,
  } = useCPFValidation();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    password: "",
    confirmPassword: "",
    city: "",
    state: "",
    neighborhoods: "",
    experience: "",
    specialties: [] as string[],
    bio: "",
    price: "",
    vehicleType: "car",
    hasTeachingLicense: false,
    terms: false,
  });

  const validateStep = (step: number): boolean => {
    setErrors({});
    
    try {
      if (step === 1) {
        // Check email security validation first
        if (emailValidationResult?.status === 'BLOQUEADO') {
          setErrors({ email: 'Este email foi bloqueado por motivos de segurança' });
          toast({
            title: "Email bloqueado",
            description: emailValidationResult.motivos.join('. '),
            variant: "destructive",
          });
          return false;
        }

        // Block high-risk emails (score > 50 or VirusTotal/AbuseIPDB detections)
        if (emailValidationResult && emailValidationResult.score_risco > 50) {
          setErrors({ email: 'Este email apresenta alto risco e não pode ser utilizado' });
          toast({
            title: "Email de alto risco",
            description: `Score de risco: ${emailValidationResult.score_risco}/100. ${emailValidationResult.motivos.join('. ')}`,
            variant: "destructive",
          });
          return false;
        }

        // Block if VirusTotal detected as malicious
        if (emailValidationResult?.reputacao?.virustotal && 
            emailValidationResult.reputacao.virustotal !== 'limpo' && 
            emailValidationResult.reputacao.virustotal !== 'sem_dados') {
          setErrors({ email: 'Este email foi detectado como malicioso pelo VirusTotal' });
          toast({
            title: "Email malicioso detectado",
            description: `VirusTotal: ${emailValidationResult.reputacao.virustotal}`,
            variant: "destructive",
          });
          return false;
        }

        // Validate step 1 fields
        const step1Schema = z.object({
          name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
          email: z.string().trim().min(1, 'Email é obrigatório').email('Email inválido').max(255, 'Email muito longo'),
          phone: z.string().trim().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(20, 'Telefone muito longo'),
          password: z.string()
            .min(8, 'Senha deve ter pelo menos 8 caracteres')
            .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
            .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
            .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
          confirmPassword: z.string().min(1, 'Confirme sua senha'),
          city: z.string().trim().min(2, 'Cidade deve ter pelo menos 2 caracteres').max(100, 'Nome da cidade muito longo'),
          state: z.string().min(2, 'Selecione um estado'),
        }).refine(data => data.password === data.confirmPassword, {
          message: 'As senhas não coincidem',
          path: ['confirmPassword'],
        });

        step1Schema.parse({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          city: formData.city,
          state: formData.state,
        });
      } else if (step === 3) {
        // Final validation with terms
        if (!formData.terms) {
          setErrors({ terms: 'Aceite os termos para continuar' });
          toast({
            title: "Erro de validação",
            description: "Aceite os termos para continuar",
            variant: "destructive",
          });
          return false;
        }
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
    
    if (currentStep < 3) {
      if (validateStep(currentStep)) {
        setCurrentStep(currentStep + 1);
      }
      return;
    }

    // Final step validation
    if (!validateStep(3)) {
      return;
    }
    setIsLoading(true);

    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: formData.name,
            phone: formData.phone,
            user_type: 'instructor',
          },
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Erro ao criar conta. Tente novamente.");
      }

      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Upload avatar if provided
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${authData.user.id}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      // 3. Create instructor profile
      const { error: instructorError } = await supabase
        .from('instructors')
        .insert({
          user_id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          cpf: formData.cpf.replace(/\D/g, ''),
          city: formData.city,
          state: formData.state,
          neighborhoods: formData.neighborhoods,
          experience: formData.experience,
          specialties: formData.specialties,
          bio: formData.bio,
          price: formData.price ? parseFloat(formData.price) : null,
          avatar_url: avatarUrl,
          vehicle_type: formData.vehicleType,
          has_teaching_license: formData.hasTeachingLicense,
        });

      if (instructorError) {
        console.error("Instructor profile error:", instructorError);
        throw instructorError;
      }

      // 4. Notify admin about new instructor registration
      try {
        await supabase.functions.invoke('notify-new-instructor', {
          body: {
            instructorId: authData.user.id,
            instructorName: formData.name,
            instructorEmail: formData.email,
            instructorCity: formData.city,
            instructorState: formData.state,
            hasTeachingLicense: formData.hasTeachingLicense,
            vehicleType: formData.vehicleType,
          },
        });
      } catch (notifyError) {
        console.error("Failed to notify admin:", notifyError);
        // Don't throw - registration was successful, notification is secondary
      }

      toast({
        title: "Cadastro realizado!",
        description: "Sua conta foi criada com sucesso. Aguarde a aprovação do seu perfil.",
      });

      navigate('/instrutor/login');
      
    } catch (error: any) {
      // Remove detailed log in production
      let errorMessage = "Ocorreu um erro ao criar sua conta. Tente novamente.";
      
      if (error.message?.includes("already registered")) {
        errorMessage = "Este email já está cadastrado. Faça login ou use outro email.";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Email inválido. Verifique o endereço informado.";
      } else if (error.message?.includes("row-level security") || error.code === "42501") {
        errorMessage = "Erro de permissão. Por favor, tente novamente em alguns instantes.";
      } else if (error.message?.includes("duplicate key")) {
        errorMessage = "Este email já está cadastrado como instrutor.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 2MB.",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Helmet>
        <title>Cadastro de Instrutor | Instrutores na Direção</title>
        <meta 
          name="description" 
          content="Cadastre-se como instrutor de direção e aumente sua visibilidade. Conquiste mais alunos através da nossa plataforma." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-12 px-4">
          <div className="container mx-auto max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
                <Car className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Cadastro de Instrutor
              </h1>
              <p className="text-muted-foreground mt-2">
                Preencha seus dados para criar seu perfil na plataforma
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-colors ${
                    currentStep >= step.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`ml-2 text-sm hidden sm:inline ${
                    currentStep >= step.id ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      currentStep > step.id ? "bg-primary" : "bg-secondary"
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                <CardDescription>
                  {currentStep === 1 && "Informações básicas para criar sua conta"}
                  {currentStep === 2 && "Conte-nos sobre sua experiência profissional"}
                  {currentStep === 3 && "Revise seus dados e finalize o cadastro"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Personal Data */}
                  {currentStep === 1 && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome completo</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="name"
                              placeholder="Seu nome"
                              className="pl-10"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <div className="relative">
                          <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            className={`pl-10 pr-10 ${isCPFDuplicate ? "border-destructive" : isCPFValid === true ? "border-emerald-500" : ""}`}
                            value={formData.cpf}
                            onChange={(e) => {
                              const formatted = formatCPF(e.target.value);
                              setFormData({ ...formData, cpf: formatted });
                              clearCPFValidation();
                            }}
                            onBlur={() => {
                              if (formData.cpf.replace(/\D/g, '').length === 11) {
                                validateCPF(formData.cpf);
                              }
                            }}
                            maxLength={14}
                            required
                          />
                          {isValidatingCPF && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {!isValidatingCPF && isCPFValid === true && !isCPFDuplicate && (
                            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                          )}
                          {isCPFDuplicate && (
                            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                          )}
                        </div>
                        {isCPFDuplicate && (
                          <p className="text-xs text-destructive">Este CPF já está cadastrado</p>
                        )}
                        {isCPFValid === false && (
                          <p className="text-xs text-destructive">CPF inválido</p>
                        )}
                      </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone / WhatsApp</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              placeholder="(11) 99999-9999"
                              className="pl-10"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            className={`pl-10 ${isEmailBlocked ? "border-destructive" : ""}`}
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
                            disabled={isValidatingEmail}
                          />
                        </div>
                        <EmailSecurityBadge isValidating={isValidatingEmail} result={emailValidationResult} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Senha</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-10 pr-10"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar senha</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="confirmPassword"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-10"
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-2 md:col-span-2">
                          <Label htmlFor="city">Cidade</Label>
                          <CityAutocomplete
                            value={formData.city}
                            state={formData.state}
                            onChange={(value) => setFormData({ ...formData, city: value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Estado</Label>
                          <Select 
                            value={formData.state} 
                            onValueChange={(value) => setFormData({ ...formData, state: value, city: '' })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 2: Professional Info */}
                  {currentStep === 2 && (
                    <>
                      {/* Avatar Upload */}
                      <div className="space-y-2">
                        <Label>Foto de perfil (opcional)</Label>
                        <div className="flex items-center gap-4">
                          <Avatar className="w-20 h-20">
                            <AvatarImage src={avatarPreview || undefined} />
                            <AvatarFallback className="bg-secondary text-2xl">
                              {formData.name ? formData.name.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              className="gap-2"
                            >
                              <Camera className="h-4 w-4" />
                              {avatarPreview ? "Alterar foto" : "Adicionar foto"}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG (máx. 2MB)</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience">Tempo de experiência</Label>
                        <Select 
                          value={formData.experience} 
                          onValueChange={(value) => setFormData({ ...formData, experience: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-2">1 a 2 anos</SelectItem>
                            <SelectItem value="3-5">3 a 5 anos</SelectItem>
                            <SelectItem value="5-10">5 a 10 anos</SelectItem>
                            <SelectItem value="10+">Mais de 10 anos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Especialidades (selecione uma ou mais)</Label>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => handleSpecialtyToggle(category)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                formData.specialties.includes(category)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="neighborhoods">Bairros que você atende</Label>
                        <Input
                          id="neighborhoods"
                          placeholder="Ex: Moema, Itaim Bibi, Vila Mariana"
                          value={formData.neighborhoods}
                          onChange={(e) => setFormData({ ...formData, neighborhoods: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Separe por vírgula</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">Valor da aula (R$)</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="80"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de veículo</Label>
                        <Select 
                          value={formData.vehicleType} 
                          onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="car">Apenas Carro</SelectItem>
                            <SelectItem value="motorcycle">Apenas Moto</SelectItem>
                            <SelectItem value="both">Carro e Moto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Possui registro de instrutor?</Label>
                        <Select 
                          value={formData.hasTeachingLicense ? "yes" : "no"} 
                          onValueChange={(value) => setFormData({ ...formData, hasTeachingLicense: value === "yes" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Sim, tenho registro</SelectItem>
                            <SelectItem value="no">Não tenho registro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Sobre você</Label>
                        <Textarea
                          id="bio"
                          placeholder="Conte um pouco sobre sua experiência, metodologia e diferenciais..."
                          rows={4}
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {/* Step 3: Review */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="bg-secondary/50 rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-foreground">Resumo do cadastro</h3>
                        
                        {/* Avatar Preview */}
                        <div className="flex justify-center">
                          <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                            <AvatarImage src={avatarPreview || undefined} />
                            <AvatarFallback className="bg-primary/10 text-2xl">
                              {formData.name ? formData.name.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Nome</p>
                            <p className="font-medium text-foreground">{formData.name || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium text-foreground">{formData.email || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Telefone</p>
                            <p className="font-medium text-foreground">{formData.phone || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Localização</p>
                            <p className="font-medium text-foreground">{formData.city}, {formData.state}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Experiência</p>
                            <p className="font-medium text-foreground">{formData.experience || "-"} anos</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valor/aula</p>
                            <p className="font-medium text-foreground">R$ {formData.price || "-"}</p>
                          </div>
                        </div>

                        {formData.specialties.length > 0 && (
                          <div>
                            <p className="text-muted-foreground text-sm mb-2">Especialidades</p>
                            <div className="flex flex-wrap gap-1">
                              {formData.specialties.map((s) => (
                                <span key={s} className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={formData.terms}
                          onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                          className="mt-1 rounded border-input"
                          required
                        />
                        <label htmlFor="terms" className="text-sm text-muted-foreground">
                          Li e concordo com os{" "}
                          <Link to="/termos" className="text-accent hover:underline">
                            Termos de Uso
                          </Link>{" "}
                          e{" "}
                          <Link to="/privacidade" className="text-accent hover:underline">
                            Política de Privacidade
                          </Link>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-4 pt-4">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="gap-2"
                        disabled={isLoading}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                      </Button>
                    )}
                    <Button type="submit" size="lg" className="flex-1 gap-2" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : currentStep === 3 ? (
                        <>
                          Finalizar cadastro
                          <CheckCircle className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Continuar
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {currentStep === 1 && (
                  <>
                    <hr className="my-6" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Já tem cadastro?{" "}
                        <Link to="/instrutor/login" className="text-accent hover:underline font-medium">
                          Faça login
                        </Link>
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
