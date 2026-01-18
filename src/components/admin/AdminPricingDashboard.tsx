import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPlansManager } from "./AdminPlansManager";
import { AdminStudentPricing } from "./AdminStudentPricing";
import { DollarSign, Users } from "lucide-react";

export function AdminPricingDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Preços</h1>
        <p className="text-muted-foreground">
          Configure os planos de instrutores e taxas de alunos
        </p>
      </div>

      <Tabs defaultValue="instructor-plans" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="instructor-plans" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Planos de Instrutores
          </TabsTrigger>
          <TabsTrigger value="student-pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Taxas de Alunos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instructor-plans" className="space-y-4">
          <AdminPlansManager />
        </TabsContent>

        <TabsContent value="student-pricing" className="space-y-4">
          <AdminStudentPricing />
        </TabsContent>
      </Tabs>
    </div>
  );
}
