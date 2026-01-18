import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SystemSettings } from "@/types/admin-tables";

export function PlatformSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Settings State
  const [bookingFee, setBookingFee] = useState("5.00");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);

  // Fetch Settings on Mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('id', 1)
          .single();

        if (error) {
           console.warn("Could not fetch settings:", error);
        } else if (data) {
           const settings = data as unknown as SystemSettings;
           setBookingFee(settings.booking_fee?.toString() || "5.00");
           setMaintenanceMode(settings.maintenance_mode || false);
           setAllowRegistrations(settings.allow_registrations !== false);
        }
      } catch (err) {
        console.error("Settings fetch error:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
        const { error } = await supabase
          .from('system_settings')
          .update({
             booking_fee: parseFloat(bookingFee),
             maintenance_mode: maintenanceMode,
             allow_registrations: allowRegistrations,
             updated_at: new Date().toISOString()
          })
          .eq('id', 1);

        if (error) throw error;

        toast({
            title: "Configurações salvas",
            description: "As alterações foram aplicadas com sucesso.",
        });
    } catch (err) {
        console.error(err);
        toast({ title: "Erro", description: "Falha ao salvar configurações (verifique se rodou a migration).", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-8 text-center text-muted-foreground">Carregando configurações...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações da Plataforma</h2>
        <p className="text-muted-foreground">Gerencie taxas, acessos e variáveis do sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
          <CardDescription>Ajuste valores cobrados na plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="fee">Taxa de Agendamento (R$)</Label>
            <div className="flex items-center gap-2 max-w-xs">
                <span className="text-muted-foreground font-bold">R$</span>
                <Input 
                    id="fee" 
                    value={bookingFee} 
                    onChange={(e) => setBookingFee(e.target.value)} 
                    type="number" 
                    step="0.50"
                />
            </div>
            <p className="text-sm text-muted-foreground">Valor cobrado do aluno para reservar uma aula.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sistema & Acesso</CardTitle>
          <CardDescription>Controle a disponibilidade da plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Novos Cadastros</Label>
                <p className="text-sm text-muted-foreground">Permitir que novos instrutores e alunos se cadastrem.</p>
              </div>
              <Switch checked={allowRegistrations} onCheckedChange={setAllowRegistrations} />
           </div>
           
           <Separator />
           
           <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Modo Manutenção
                </Label>
                <p className="text-sm text-muted-foreground">Bloqueia o acesso a todos os usuários (exceto Admin).</p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
           </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
            {loading ? "Salvando..." : (
                <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                </>
            )}
        </Button>
      </div>
    </div>
  );
}
