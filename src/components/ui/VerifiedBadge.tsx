import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  isVerified?: boolean;
  showText?: boolean;
  className?: string;
}

export function VerifiedBadge({ isVerified, showText = true, className }: VerifiedBadgeProps) {
  if (!isVerified) return null;
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full text-xs font-medium",
      className
    )}>
      <Shield className="h-3 w-3 fill-current" />
      {showText && <span>Verificado</span>}
    </div>
  );
}
