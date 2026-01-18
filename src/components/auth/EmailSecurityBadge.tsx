import { Shield, ShieldAlert, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { EmailValidationResult } from '@/hooks/useEmailValidation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EmailSecurityBadgeProps {
  isValidating: boolean;
  result: EmailValidationResult | null;
}

export function EmailSecurityBadge({ isValidating, result }: EmailSecurityBadgeProps) {
  if (isValidating) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Verificando segurança...</span>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const getStatusConfig = () => {
    switch (result.status) {
      case 'PERMITIDO':
        return {
          icon: ShieldCheck,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          label: 'Email verificado',
        };
      case 'DESAFIO':
        return {
          icon: ShieldAlert,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          label: 'Verificação adicional',
        };
      case 'BLOQUEADO':
        return {
          icon: ShieldX,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          label: 'Email bloqueado',
        };
      default:
        return {
          icon: Shield,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          label: 'Verificando...',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 text-xs ${config.color} cursor-help`}>
            <div className={`p-0.5 rounded ${config.bgColor}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span>{config.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">Score de risco: {result.score_risco}/100</div>
            <ul className="text-xs space-y-1">
              {result.motivos.map((motivo, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-muted-foreground">•</span>
                  <span>{motivo}</span>
                </li>
              ))}
            </ul>
            {result.status === 'BLOQUEADO' && (
              <p className="text-xs text-destructive font-medium mt-2">
                {result.acao_recomendada}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
