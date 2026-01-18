import { useState, useRef, useEffect } from "react";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, User, Save, ArrowLeft, MessageSquare, Calendar, Search, History } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { LessonHistory } from "@/components/student/LessonHistory";
import { DeleteAccountSection } from "@/components/profile/DeleteAccountSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentProfile() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/login");
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile.mutateAsync({ name, phone });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar.mutateAsync(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Meu Perfil | Instrutores na Direção</title>
        <meta name="description" content="Gerencie seu perfil de aluno" />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <Link to="/aluno/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o painel
          </Link>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="md:col-span-2">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </TabsTrigger>
                  <TabsTrigger value="lessons" className="gap-2">
                    <History className="h-4 w-4" />
                    Minhas Aulas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-2xl font-bold">Meu Perfil</CardTitle>
                      <CardDescription>Gerencie suas informações pessoais</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      {/* Avatar Section */}
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                          <Avatar className="h-28 w-28 border-4 border-background shadow-xl transition-transform group-hover:scale-105 duration-300">
                            <AvatarImage src={profile?.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                              <User className="h-12 w-12" />
                            </AvatarFallback>
                          </Avatar>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all transform hover:scale-110"
                          >
                            {uploadAvatar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                          </button>
                          <input 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            accept="image/*"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Clique na câmera para alterar sua foto</p>
                      </div>

                      {/* Form Section */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
                          <Input 
                            id="name" 
                            placeholder="Seu nome" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                          <Input 
                            id="email" 
                            value={profile?.email || ""} 
                            disabled 
                            className="h-11 bg-muted/50"
                          />
                          <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium">Telefone / WhatsApp</Label>
                          <Input 
                            id="phone" 
                            placeholder="(00) 00000-0000" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-11"
                          />
                        </div>

                        <Button 
                          onClick={handleSave} 
                          disabled={updateProfile.isPending}
                          className="w-full h-12 font-semibold gap-2"
                        >
                          {updateProfile.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                          Salvar Alterações
                        </Button>
                      </div>

                      <DeleteAccountSection userType="student" />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="lessons">
                  <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl font-bold">Histórico de Aulas</CardTitle>
                      <CardDescription>Veja todas as suas aulas agendadas</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <LessonHistory />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Mensagens</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Converse com seus instrutores
                  </p>
                  <Link to="/mensagens">
                    <Button variant="outline" className="w-full">
                      Ver Mensagens
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">Minhas Aulas</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Veja suas aulas agendadas
                  </p>
                  <Link to="/aluno/dashboard">
                    <Button variant="outline" className="w-full">
                      Ver Aulas
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-warning" />
                  </div>
                  <h3 className="font-semibold mb-2">Buscar Instrutores</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Encontre novos instrutores
                  </p>
                  <Link to="/instrutores">
                    <Button variant="outline" className="w-full">
                      Buscar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
