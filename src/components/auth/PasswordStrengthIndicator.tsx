import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements: Requirement[] = useMemo(() => [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "Letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "Letra minúscula", met: /[a-z]/.test(password) },
    { label: "Número", met: /[0-9]/.test(password) },
    { label: "Caractere especial (!@#$%)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = requirements.filter(r => r.met).length;
    if (metCount <= 2) return { level: "weak", label: "Fraca", color: "bg-destructive" };
    if (metCount <= 3) return { level: "medium", label: "Média", color: "bg-warning" };
    if (metCount <= 4) return { level: "good", label: "Boa", color: "bg-accent" };
    return { level: "strong", label: "Forte", color: "bg-green-500" };
  }, [requirements]);

  if (!password) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Força da senha:</span>
          <span className={cn(
            "font-medium",
            strength.level === "weak" && "text-destructive",
            strength.level === "medium" && "text-yellow-600",
            strength.level === "good" && "text-accent",
            strength.level === "strong" && "text-green-500"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300 rounded-full", strength.color)}
            style={{ 
              width: `${(requirements.filter(r => r.met).length / requirements.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-1.5">
        {requirements.map((req, i) => (
          <div 
            key={i} 
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              req.met ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3 opacity-50" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}