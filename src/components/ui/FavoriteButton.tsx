import { Heart } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface FavoriteButtonProps {
  instructorId: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
}

export function FavoriteButton({ instructorId, className, size = "icon" }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: favorites = [] } = useFavorites();
  const { mutate: toggleFavorite, isPending } = useToggleFavorite();
  
  const isFavorite = favorites.includes(instructorId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    toggleFavorite(
      { instructorId, isFavorite },
      {
        onSuccess: () => {
          toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
        },
        onError: () => {
          toast.error("Erro ao atualizar favoritos");
        },
      }
    );
  };

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(
        "hover:bg-transparent",
        isFavorite && "text-red-500",
        className
      )}
      onClick={handleClick}
      disabled={isPending}
    >
      <Heart 
        className={cn(
          "h-5 w-5 transition-all",
          isFavorite && "fill-red-500"
        )} 
      />
    </Button>
  );
}
