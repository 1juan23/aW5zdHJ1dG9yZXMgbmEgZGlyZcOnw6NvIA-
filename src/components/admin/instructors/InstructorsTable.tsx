import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Check, X, XCircle, Search, History, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Database } from "@/integrations/supabase/types";

type Instructor = Database["public"]["Tables"]["instructors"]["Row"];

interface InstructorsTableProps {
  instructors: Instructor[];
  onOpenAction: (action: 'approve' | 'reject' | 'suspend', instructor: Instructor) => void;
  onViewDetails: (instructor: Instructor) => void;
  onRefresh: () => void;
}

export function InstructorsTable({ instructors, onOpenAction, onViewDetails, onRefresh }: InstructorsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Simple client-side search across multiple fields
  const filteredInstructors = instructors.filter(instructor => {
     const searchLower = searchTerm.toLowerCase();
     return (
       (instructor.name && instructor.name.toLowerCase().includes(searchLower)) ||
       (instructor.email && instructor.email.toLowerCase().includes(searchLower)) ||
       (instructor.city && instructor.city.toLowerCase().includes(searchLower))
     );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Gerenciar Instrutores</h2>
           <p className="text-muted-foreground">Visualize, aprove ou suspenda contas de instrutores.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <History className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button>
             <Filter className="w-4 h-4 mr-2" />
             Filtros
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
         <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, email ou cidade..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instrutor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstructors.map((instructor) => (
              <TableRow key={instructor.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                        {instructor.name ? instructor.name.charAt(0) : '?'}
                    </div>
                    <div>
                        <div className="font-medium">{instructor.name}</div>
                        <div className="text-xs text-muted-foreground">{instructor.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      instructor.status === 'approved' ? 'default' : 
                      instructor.status === 'suspended' ? 'destructive' : 'secondary'
                    } 
                    className={
                      instructor.status === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''
                    }
                  >
                    {instructor.status === 'approved' ? 'Aprovado' : 
                     instructor.status === 'suspended' ? 'Suspenso' : 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell>
                    {instructor.city ? `${instructor.city}, ${instructor.state}` : <span className="text-muted-foreground italic">Não informado</span>}
                </TableCell>
                <TableCell>{new Date(instructor.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onViewDetails(instructor)}>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  {instructor.status === 'pending' && (
                    <>
                      <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600 shadow-sm" onClick={() => onOpenAction('approve', instructor)}>
                          <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8 shadow-sm" onClick={() => onOpenAction('reject', instructor)}>
                          <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {instructor.status === 'approved' && (
                     <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => onOpenAction('suspend', instructor)}>
                          <XCircle className="w-4 h-4" />
                     </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredInstructors.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                     <Search className="w-8 h-8 opacity-20" />
                     <p>Nenhum instrutor encontrado.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
