import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PricingPlan {
  id: string;
  plan_name: string;
  plan_slug: string;
  monthly_price: number;
  commission_rate: number;
  features: string[];
  yearly_discount: number;
  is_active: boolean;
  display_order: number;
}

// Hardcoded plans since pricing_plans table doesn't exist yet
const defaultPlans: PricingPlan[] = [
  {
    id: '1',
    plan_name: 'Essencial',
    plan_slug: 'essential',
    monthly_price: 0,
    commission_rate: 0.10,
    features: ['Perfil na plataforma', 'Chat com alunos', 'Comissão de 10%'],
    yearly_discount: 0,
    is_active: true,
    display_order: 1
  },
  {
    id: '2',
    plan_name: 'Pro',
    plan_slug: 'pro',
    monthly_price: 49.90,
    commission_rate: 0.05,
    features: ['Tudo do Essencial', 'Destaque nas buscas', 'Comissão de 5%', 'Suporte prioritário'],
    yearly_discount: 0.15,
    is_active: true,
    display_order: 2
  }
];

export function AdminPlansManager() {
  const [plans, setPlans] = useState<PricingPlan[]>(defaultPlans);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const { toast } = useToast();

  const savePlan = (plan: PricingPlan) => {
    setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
    toast({
      title: "Sucesso",
      description: "Plano atualizado (apenas localmente - tabela não existe)"
    });
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Planos</h2>
          <p className="text-muted-foreground">Configure os planos de assinatura para instrutores</p>
        </div>
      </div>

      <div className="grid gap-6">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <CardTitle>{plan.plan_name}</CardTitle>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPlan(plan)}
                >
                  Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Preço Mensal</p>
                  <p className="font-semibold">R$ {plan.monthly_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Taxa de Comissão</p>
                  <p className="font-semibold">{(plan.commission_rate * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Desconto Anual</p>
                  <p className="font-semibold">{(plan.yearly_discount * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Features</p>
                  <p className="font-semibold">{plan.features.length} itens</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Editar Plano: {editingPlan.plan_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Plano</Label>
                  <Input
                    value={editingPlan.plan_name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, plan_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={editingPlan.plan_slug} disabled />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Preço Mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingPlan.monthly_price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Comissão (%)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={(editingPlan.commission_rate * 100).toFixed(0)}
                    onChange={(e) => setEditingPlan({ ...editingPlan, commission_rate: parseFloat(e.target.value) / 100 })}
                  />
                </div>
                <div>
                  <Label>Desconto Anual (%)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={(editingPlan.yearly_discount * 100).toFixed(0)}
                    onChange={(e) => setEditingPlan({ ...editingPlan, yearly_discount: parseFloat(e.target.value) / 100 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingPlan.is_active}
                  onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_active: checked })}
                />
                <Label>Plano Ativo</Label>
              </div>

              <div>
                <Label>Features (uma por linha)</Label>
                <Textarea
                  rows={6}
                  value={editingPlan.features.join('\n')}
                  onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value.split('\n').filter(f => f.trim()) })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingPlan(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => savePlan(editingPlan)}>
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
