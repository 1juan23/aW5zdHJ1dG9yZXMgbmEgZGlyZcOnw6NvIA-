import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  MessageSquare,
  LogIn,
  Car
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { MessagePreview } from "@/components/messages/MessagePreview";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const unreadCount = useUnreadMessages();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isAuthenticated) {
        setUserRole(null);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setUserRole(roleData?.role || 'student');
      }
    };
    
    fetchUserRole();
  }, [isAuthenticated]);

  // Keyboard shortcut: Ctrl+M to open messages
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        navigate('/mensagens');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta.",
    });
    navigate('/');
  };

  const getDashboardLink = () => {
    if (userRole === 'instructor') return '/instrutor/dashboard';
    if (userRole === 'admin') return '/admin/dashboard';
    return '/aluno/perfil';
  };

  const getProfileLink = () => {
    if (userRole === 'instructor') return '/instrutor/dashboard';
    if (userRole === 'admin') return '/admin/dashboard';
    return '/aluno/perfil';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-md transition-all duration-300 dark:bg-slate-900/80 dark:border-slate-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center transition-all duration-500 transform group-hover:scale-110">
             <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/20 transition-all" />
             <img src="/logo.png" alt="ID Logo" width="64" height="64" decoding="async" className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,193,7,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(255,193,7,0.5)] transition-transform duration-500 group-hover:rotate-[15deg]" />
          </div>
          <div className="flex items-center gap-2 md:gap-3 group-hover:scale-[1.02] transition-transform duration-300">
            <span className="font-extrabold text-xl md:text-2xl lg:text-3xl leading-none bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-[#0423ca] tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] filter brightness-110">
              Instrutores na Direção
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:translate-y-[-1px] transform">
            Início
          </Link>
          <Link to="/instrutores" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:translate-y-[-1px] transform">
            Encontrar Instrutor
          </Link>
          <Link to="/como-funciona" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:translate-y-[-1px] transform">
            Como Funciona
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* User Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Minha Conta
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {userRole === 'student' ? 'Meu Perfil' : 'Dashboard'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/mensagens')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Mensagens
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5">
                        {unreadCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/instrutor/login">
                <Button variant="outline" size="sm" className="gap-2 transition-all hover:bg-primary hover:text-white">
                  <Car className="h-4 w-4" />
                  Área do Instrutor
                </Button>
              </Link>
              <Link to="/login">
                <Button size="sm" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
                  <LogIn className="h-4 w-4" />
                  Entrada Aluno
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-card animate-fade-in">
          <nav className="container mx-auto flex flex-col p-4 gap-2">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Início</Button>
            </Link>
            <Link to="/instrutores" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Encontrar Instrutor</Button>
            </Link>
            <Link to="/como-funciona" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Como Funciona</Button>
            </Link>
            <hr className="my-2" />
            
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {userRole === 'student' ? 'Meu Perfil' : 'Dashboard'}
                  </Button>
                </Link>
                <Link to="/mensagens" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Mensagens
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2 text-destructive" 
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link to="/instrutor/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full gap-2 transition-all hover:bg-primary hover:text-white">
                    <Car className="h-4 w-4" />
                    Área do Instrutor
                  </Button>
                </Link>
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
                    <LogIn className="h-4 w-4" />
                    Entrada Aluno
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
