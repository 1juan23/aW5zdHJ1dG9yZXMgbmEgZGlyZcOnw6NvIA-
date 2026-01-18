import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, Calendar, Clock } from "lucide-react";
import { useProfileViews } from "@/hooks/useProfileViews";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface ProfileViewsCardProps {
  instructorId: string;
  planType: string;
}

export function ProfileViewsCard({ instructorId, planType }: ProfileViewsCardProps) {
  const { data: stats, isLoading } = useProfileViews(instructorId);
  
  // Only show for Destaque and Elite plans
  if (planType !== 'destaque' && planType !== 'elite') {
    return (
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-6 text-center">
          <Eye className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Analytics de visualizações disponível para planos Destaque e Elite
          </p>
          <Link to="/instrutor/planos">
            <Button variant="outline" size="sm" className="text-xs">
              Faça upgrade para ver
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Visualizações do Perfil
          </CardTitle>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {planType === 'elite' ? 'Elite' : 'Destaque'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main stat */}
        <div className="text-center p-4 bg-background/50 rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Total de visualizações</p>
          <p className="text-4xl font-black text-primary">{stats?.totalViews || 0}</p>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 bg-background/30 rounded-lg">
            <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{stats?.todayViews || 0}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </div>
          <div className="text-center p-3 bg-background/30 rounded-lg">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{stats?.last7Days || 0}</p>
            <p className="text-xs text-muted-foreground">7 dias</p>
          </div>
          <div className="text-center p-3 bg-background/30 rounded-lg">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{stats?.last30Days || 0}</p>
            <p className="text-xs text-muted-foreground">30 dias</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
