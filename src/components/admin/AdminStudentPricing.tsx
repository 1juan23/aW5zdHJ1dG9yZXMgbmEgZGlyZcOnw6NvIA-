import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Save, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentPricing {
  id: string;
  config_key: string;
  booking_fee: number;
  description: string;
  is_active: boolean;
}

const defaultPricing: StudentPricing = {
  id: '1',
  config_key: 'default',
  booking_fee: 5.00,
  description: 'Taxa de serviço por agendamento',
  is_active: true
};

export function AdminStudentPricing() {
  const [pricing, setPricing] = useState<StudentPricing>(defaultPricing);
  const [editedFee, setEditedFee] = useState<number>(pricing.booking_fee);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const savePricing = () => {
    setSaving(true);
    setTimeout(() => {
      setPricing({ ...pricing, booking_fee: editedFee });
      toast({
        title: "Sucesso",
        description: "Taxa atualizada (apenas localmente - tabela não existe)"
      });
      setSaving(false);
    }, 500);
  };

  const hasChanges = editedFee !== pricing.booking_fee;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuração de Preços para Alunos</h2>
        <p className="text-muted-foreground">
          Configure a taxa de serviço cobrada dos alunos por agendamento
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Taxa Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Agendamento</p>
                <p className="text-3xl font-bold">
                  R$ {pricing.booking_fee.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="text-sm">{pricing.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={pricing.is_active ? "default" : "secondary"}>
                  {pricing.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Editar Taxa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="booking-fee">Nova Taxa de Agendamento (R$)</Label>
                <Input
                  id="booking-fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedFee}
                  onChange={(e) => setEditedFee(parseFloat(e.target.value) || 0)}
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Valor cobrado por agendamento de aula
                </p>
              </div>

              {hasChanges && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ⚠️ Mudança Pendente
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    De R$ {pricing.booking_fee.toFixed(2)} para R$ {editedFee.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={savePricing}
                  disabled={!hasChanges || saving}
                  className="flex-1"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
                {hasChanges && (
                  <Button
                    variant="outline"
                    onClick={() => setEditedFee(pricing.booking_fee)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <History className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Sobre as mudanças de preço
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Esta é uma configuração local. Para implementar isto em produção, a tabela student_pricing deve ser criada no banco de dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
