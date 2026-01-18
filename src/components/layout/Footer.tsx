import { Link } from "react-router-dom";
import { Car, Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";

export function Footer() {
  const { isAdmin } = useAdminRole();
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1 shadow-inner">
                <img src="/logo.png" alt="ID Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex items-center">
                <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-[#0423ca]">
                  Instrutores na Direção
                </span>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              A plataforma que conecta você aos melhores instrutores de direção da sua região.
              Segurança e confiança em primeiro lugar.
            </p>
          </div>

          {/* Links Rápidos */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Links Rápidos</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/instrutores" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Encontrar Instrutor
              </Link>
              <Link to="/como-funciona" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Como Funciona
              </Link>
              <Link to="/instrutor/cadastro" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Seja um Instrutor
              </Link>
              <Link to="/faq" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Perguntas Frequentes
              </Link>


            </nav>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Contato</h4>
            <div className="flex flex-col gap-3">
              <a href="mailto:contato@instrutoresnadirecao.com.br" className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Mail className="h-4 w-4" />
                contato@instrutoresnadirecao.com.br
              </a>
              <a href="tel:+5511999999999" className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Phone className="h-4 w-4" />
                (11) 99999-9999
              </a>
              <span className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <MapPin className="h-4 w-4" />
                São Paulo, SP
              </span>
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Redes Sociais</h4>
            <div className="flex gap-3">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 hover:bg-primary-foreground/20 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 hover:bg-primary-foreground/20 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 hover:bg-primary-foreground/20 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <hr className="my-8 border-primary-foreground/10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Instrutores na Direção. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link to="/termos" className="hover:text-primary-foreground transition-colors">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="hover:text-primary-foreground transition-colors">
              Política de Privacidade
            </Link>
            {isAdmin && (
              <Link to="/admin/dashboard" className="hover:text-primary-foreground transition-colors opacity-50 hover:opacity-100">
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
