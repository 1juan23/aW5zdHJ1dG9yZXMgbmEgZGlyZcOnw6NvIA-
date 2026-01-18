import { Badge } from "@/components/ui/badge";
import { Crown, Diamond, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanBadgeProps {
  planType: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const planConfig = {
  elite: {
    label: "Verificado",
    icon: Diamond,
    className: "bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0 shadow-lg shadow-amber-500/30",
  },
  destaque: {
    label: "Destaque",
    icon: Crown,
    className: "bg-gradient-to-r from-primary to-primary/80 text-white border-0 shadow-md shadow-primary/30",
  },
  essencial: {
    label: "Ativo",
    icon: Sparkles,
    className: "bg-accent/20 text-accent border-accent/30",
  },
  trial: {
    label: null,
    icon: null,
    className: "",
  },
  expired: {
    label: null,
    icon: null,
    className: "",
  },
};

export function PlanBadge({ planType, size = "sm", showIcon = true, className }: PlanBadgeProps) {
  const config = planConfig[planType as keyof typeof planConfig] || planConfig.trial;
  
  if (!config.label) return null;

  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <Badge className={cn(sizeClasses[size], config.className, className)}>
      {showIcon && Icon && <Icon className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />}
      {config.label}
    </Badge>
  );
}
