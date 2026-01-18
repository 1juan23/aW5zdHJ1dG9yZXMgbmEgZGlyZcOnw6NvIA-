import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Send, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BroadcastHistory } from "./BroadcastHistory";

export function BroadcastCenter() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");

  const handleSend = async () => {
    if (!title || !message) {
        toast({ title: "Campos obrigatórios", description: "Preencha título e mensagem.", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase
            .from("broadcasts")
            .insert({
                title,
                message,
                target_role: target,
                sent_by: user?.id || ''
            });

        if (error) throw error;

        toast({
            title: "Mensagem Enviada!",
            description: `A notificação foi enviada para ${target === 'all' ? 'todos os usuários' : target === 'instructor' ? 'instrutores' : 'alunos'}.`
        });

        // Reset
        setTitle("");
        setMessage("");
    } catch (err) {
        console.error(err);
        toast({ title: "Erro", description: "Falha ao enviar broadcast.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
         <div className="bg-primary/10 p-3 rounded-full text-primary">
            <Bell className="w-6 h-6" />
         </div>
         <div>
            <h2 className="text-2xl font-bold tracking-tight">Central de Notificações</h2>
            <p className="text-muted-foreground">Envie comunicados importantes para os usuários da plataforma.</p>
         </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
             <CardTitle>Nova Mensagem</CardTitle>
             <CardDescription>Isso aparecerá no painel dos usuários.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label>Público Alvo</Label>
                <RadioGroup defaultValue="all" value={target} onValueChange={setTarget} className="flex gap-4">
                   <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="r1" />
                      <Label htmlFor="r1">Todos</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                      <RadioGroupItem value="instructor" id="r2" />
                      <Label htmlFor="r2">Apenas Instrutores</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                      <RadioGroupItem value="student" id="r3" />
                      <Label htmlFor="r3">Apenas Alunos</Label>
                   </div>
                </RadioGroup>
             </div>

             <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Manutenção Programada" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
             </div>

             <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea 
                  id="message" 
                  placeholder="Digite o conteúdo da notificação..." 
                  className="min-h-[120px]" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
             </div>

             <div className="pt-2 flex justify-end">
                <Button onClick={handleSend} disabled={loading}>
                   <Send className="w-4 h-4 mr-2" />
                   {loading ? "Enviando..." : "Enviar Transmissão"}
                </Button>
             </div>
          </CardContent>
        </Card>

        <BroadcastHistory />
      </div>
    </div>
  );
}
