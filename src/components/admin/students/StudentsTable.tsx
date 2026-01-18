import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Mail, Calendar, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { DeleteStudentModal } from "./DeleteStudentModal";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface StudentsTableProps {
  students: Profile[];
  onRefresh?: () => void;
}

export function StudentsTable({ students, onRefresh }: StudentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);

  const filteredStudents = students.filter(student => 
    (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-bold tracking-tight">Gerenciar Alunos</h2>
            <p className="text-muted-foreground pt-1">Total: {filteredStudents.length}</p>
         </div>
         <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Buscar alunos..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
         </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><User className="w-4 h-4" /></div>
                    <span className="font-medium">{student.name || "Sem Nome"}</span>
                  </div>
                </TableCell>
                <TableCell><div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3 h-3" />{student.email || "-"}</div></TableCell>
                <TableCell><Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge></TableCell>
                <TableCell><div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-3 h-3" />{new Date(student.created_at).toLocaleDateString()}</div></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2 text-red-600" onClick={() => { setSelectedStudent(student); setDeleteModalOpen(true); }}>
                        <Trash2 className="w-4 h-4" />Excluir Aluno
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredStudents.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum aluno encontrado.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <DeleteStudentModal student={selectedStudent} open={deleteModalOpen} onOpenChange={setDeleteModalOpen} onSuccess={onRefresh} />
    </div>
  );
}