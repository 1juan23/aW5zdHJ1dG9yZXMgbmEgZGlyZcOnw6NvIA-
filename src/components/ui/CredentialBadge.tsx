import { Badge } from "@/components/ui/badge";
import { Award, Car, Bike } from "lucide-react";
import { cn } from "@/lib/utils";

interface CredentialBadgeProps {
  hasTeachingLicense?: boolean;
  vehicleType?: string;
  size?: "sm" | "md";
  className?: string;
}

export function CredentialBadge({ 
  hasTeachingLicense, 
  vehicleType, 
  size = "sm",
  className 
}: CredentialBadgeProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";

  const getVehicleIcon = () => {
    switch (vehicleType) {
      case 'car':
        return <Car className={iconSize} />;
      case 'motorcycle':
        return <Bike className={iconSize} />;
      case 'both':
        return (
          <div className="flex gap-0.5">
            <Car className={iconSize} />
            <Bike className={iconSize} />
          </div>
        );
      default:
        return <Car className={iconSize} />;
    }
  };

  const getVehicleLabel = () => {
    switch (vehicleType) {
      case 'car':
        return 'Carro';
      case 'motorcycle':
        return 'Moto';
      case 'both':
        return 'Carro e Moto';
      default:
        return 'Carro';
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {hasTeachingLicense && (
        <Badge 
          variant="default" 
          className={cn(
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
            padding, textSize, "gap-1 font-medium"
          )}
        >
          <Award className={iconSize} />
          Credenciado
        </Badge>
      )}
      {vehicleType && (
        <Badge 
          variant="outline" 
          className={cn(
            padding, textSize, "gap-1 font-normal"
          )}
        >
          {getVehicleIcon()}
          {getVehicleLabel()}
        </Badge>
      )}
    </div>
  );
}
