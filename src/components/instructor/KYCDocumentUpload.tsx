import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FileUp, CheckCircle, Clock, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KYCDocumentUploadProps {
  instructorId: string;
  currentData?: {
    cpf?: string | null;
    cnh_number?: string | null;
    cnh_category?: string | null;
    cnh_url?: string | null;
  };
  status: 'pending' | 'approved' | 'suspended';
  onSuccess?: () => void;
}

export function KYCDocumentUpload({ instructorId, currentData, status, onSuccess }: KYCDocumentUploadProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cpf, setCpf] = useState(currentData?.cpf || "");
  const [cnhNumber, setCnhNumber] = useState(currentData?.cnh_number || "");
  const [cnhCategory, setCnhCategory] = useState(currentData?.cnh_category || "");
  const [cnhFile, setCnhFile] = useState<File | null>(null);

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const handleSubmit = async () => {
    if (!cpf || !cnhNumber || !cnhCategory) {
      toast({ 
        title: "Campos obrigatórios", 
        description: "Preencha CPF, número e categoria da CNH.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      let cnhUrl = currentData?.cnh_url;

      // Upload CNH file if provided
      if (cnhFile) {
        const fileExt = cnhFile.name.split('.').pop();
        const fileName = `${instructorId}/cnh.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars') // Using avatars bucket for now
          .upload(fileName, cnhFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        cnhUrl = urlData.publicUrl;
      }

      // Update instructor with KYC data
      const { error } = await supabase
        .from("instructors")
        .update({
          cpf: cpf.replace(/\D/g, ''),
          cnh_number: cnhNumber,
          cnh_category: cnhCategory,
          cnh_url: cnhUrl,
        })
        .eq("id", instructorId);

      if (error) throw error;

      toast({
        title: "Documentos enviados!",
        description: "Seus documentos foram enviados para verificação.",
      });

      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Erro", 
        description: "Falha ao enviar documentos.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const isVerified = status === 'approved';
  const hasDocuments = currentData?.cpf && currentData?.cnh_number;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Verificação de Identidade</CardTitle>
              <CardDescription>
                Envie seus documentos para validação
              </CardDescription>
            </div>
          </div>
          {isVerified ? (
            <Badge className="bg-green-500 text-white gap-1">
              <CheckCircle className="w-3 h-3" />
              Verificado
            </Badge>
          ) : hasDocuments ? (
            <Badge variant="secondary" className="gap-1">
              <Clock className="w-3 h-3" />
              Em Análise
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              Pendente
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isVerified ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              Perfil Verificado
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Seus documentos foram verificados com sucesso. Você está habilitado para receber alunos.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">
                Verificação Necessária
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                Para aparecer nas buscas e receber alunos, envie seus documentos para verificação.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  maxLength={14}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnh_number">Número da CNH *</Label>
                <Input
                  id="cnh_number"
                  placeholder="00000000000"
                  value={cnhNumber}
                  onChange={(e) => setCnhNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnh_category">Categoria da CNH *</Label>
                <Select value={cnhCategory} onValueChange={setCnhCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A (Moto)</SelectItem>
                    <SelectItem value="B">B (Carro)</SelectItem>
                    <SelectItem value="AB">AB (Moto + Carro)</SelectItem>
                    <SelectItem value="C">C (Caminhão)</SelectItem>
                    <SelectItem value="D">D (Ônibus)</SelectItem>
                    <SelectItem value="E">E (Veículo Articulado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnh_file">Foto da CNH</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cnh_file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setCnhFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
                {currentData?.cnh_url && !cnhFile && (
                  <p className="text-xs text-muted-foreground">
                    Documento já enviado. Envie novamente para substituir.
                  </p>
                )}
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileUp className="w-4 h-4" />
              )}
              {loading ? "Enviando..." : "Enviar Documentos para Verificação"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
