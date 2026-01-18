import { Crown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface VIPBadgeProps {
  planType?: string | null;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VIPBadge({ planType, showText = true, size = "sm", className }: VIPBadgeProps) {
  if (planType !== "elite") return null;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 text-amber-950 font-bold rounded-full shadow-lg shadow-amber-400/30 animate-pulse",
      sizeClasses[size],
      className
    )}>
      <Crown className={cn(iconSizes[size], "fill-current")} />
      {showText && (
        <span className="whitespace-nowrap">
          Instrutor VIP
          {size !== "sm" && <span className="hidden sm:inline"> - Verificado 2025</span>}
        </span>
      )}
      <Shield className={cn(iconSizes[size], "fill-current")} />
    </div>
  );
}
