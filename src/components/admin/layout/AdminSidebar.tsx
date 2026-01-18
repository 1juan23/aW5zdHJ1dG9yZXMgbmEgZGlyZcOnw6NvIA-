import { useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  MessageSquare, 
  DollarSign, 
  ShieldAlert, 
  Settings, 
  FileText,
  LogOut,
  CreditCard,
  Ticket,
  Radio,
  FileCheck,
  Clock,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: "Visão Geral", icon: LayoutDashboard, id: "overview" },
    { label: "Métricas", icon: BarChart3, id: "metrics" },
    { label: "Verificação", icon: FileCheck, id: "verification" },
    { label: "Rastreamento", icon: Clock, id: "bookings" },
    { label: "Instrutores", icon: Users, id: "instructors" },
    { label: "Alunos", icon: GraduationCap, id: "students" },
    { label: "Avaliações", icon: MessageSquare, id: "reviews" },
    { label: "Vendas e Planos", icon: DollarSign, id: "financial" },
    { label: "Transmissão", icon: Radio, id: "broadcast" },
    { label: "Segurança", icon: ShieldAlert, id: "security" },
    { label: "Suporte", icon: Ticket, id: "support" },
    { label: "Configurações", icon: Settings, id: "settings" },
  ];

  return (
    <div className="w-64 bg-card border-r h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-none">Admin</h2>
          <p className="text-xs text-muted-foreground">Painel de Controle</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground mb-3 px-2">PRINCIPAL</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              const event = new CustomEvent('admin-nav', { detail: item.id });
              window.dispatchEvent(event);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            )}
            id={`nav-${item.id}`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onLogout}>
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
