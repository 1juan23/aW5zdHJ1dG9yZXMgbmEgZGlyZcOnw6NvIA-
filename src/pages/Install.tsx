import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Download, Share2, Plus, CheckCircle, Apple, Laptop } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      <Helmet>
        <title>Instalar App | Instrutores na Direção</title>
        <meta 
          name="description" 
          content="Instale o app Instrutores na Direção no seu celular para acesso rápido e offline." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-12 px-4">
          <div className="container mx-auto max-w-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
                <Smartphone className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Instale nosso App
              </h1>
              <p className="text-muted-foreground">
                Acesse de forma mais rápida, receba notificações e use offline
              </p>
            </div>

            {isStandalone ? (
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      App já instalado!
                    </h3>
                    <p className="text-muted-foreground">
                      Você está usando a versão instalada do aplicativo.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Install Button for supported browsers */}
                {deferredPrompt && (
                  <Card className="mb-8 border-primary">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Button size="lg" onClick={handleInstallClick} className="gap-2">
                          <Download className="h-5 w-5" />
                          Instalar Agora
                        </Button>
                        <p className="text-sm text-muted-foreground mt-3">
                          Clique para adicionar à tela inicial
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* iOS Instructions */}
                {isIOS && !deferredPrompt && (
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Apple className="h-5 w-5" />
                        Como instalar no iPhone/iPad
                      </CardTitle>
                      <CardDescription>
                        Siga os passos abaixo para adicionar à tela inicial
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Toque no botão Compartilhar</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            No Safari, toque em <Share2 className="h-4 w-4" /> na barra inferior
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Selecione "Adicionar à Tela de Início"</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Role para baixo e toque em <Plus className="h-4 w-4" /> Adicionar à Tela de Início
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                          3
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Confirme tocando em "Adicionar"</p>
                          <p className="text-sm text-muted-foreground">
                            O ícone do app aparecerá na sua tela inicial
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Android/Desktop Instructions */}
                {!isIOS && !deferredPrompt && (
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Laptop className="h-5 w-5" />
                        Como instalar
                      </CardTitle>
                      <CardDescription>
                        Instruções para Chrome, Edge e outros navegadores
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Abra o menu do navegador</p>
                          <p className="text-sm text-muted-foreground">
                            Clique nos três pontos (⋮) no canto superior direito
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Selecione "Instalar aplicativo"</p>
                          <p className="text-sm text-muted-foreground">
                            Ou "Adicionar à tela inicial" dependendo do navegador
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                          3
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Confirme a instalação</p>
                          <p className="text-sm text-muted-foreground">
                            O app será adicionado ao seu dispositivo
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Benefícios do App</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Download className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Acesso Offline</h4>
                      <p className="text-sm text-muted-foreground">
                        Use mesmo sem conexão com internet
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Tela Cheia</h4>
                      <p className="text-sm text-muted-foreground">
                        Experiência imersiva sem barras do navegador
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Acesso Rápido</h4>
                      <p className="text-sm text-muted-foreground">
                        Ícone direto na tela inicial
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Share2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Sempre Atualizado</h4>
                      <p className="text-sm text-muted-foreground">
                        Atualizações automáticas em segundo plano
                      </p>
                    </div>
                  </div>
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
