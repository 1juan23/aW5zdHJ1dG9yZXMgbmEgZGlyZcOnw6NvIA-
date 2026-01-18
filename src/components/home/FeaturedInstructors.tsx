import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, ArrowRight, Loader2, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useFeaturedInstructors } from "@/hooks/useInstructors";
import { useAuth } from "@/hooks/useAuth";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

export function FeaturedInstructors() {
  const { data: instructors, isLoading } = useFeaturedInstructors();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleInstructorClick = (e: React.MouseEvent, id: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate("/login");
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Destaques
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Instrutores em Destaque
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Conheça alguns dos nossos profissionais mais bem avaliados e comece suas aulas com confiança.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!instructors || instructors.length === 0) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum instrutor disponível no momento.
            </p>
          </div>
        )}

        {/* Instructors Grid */}
        {instructors && instructors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {instructors.map((instructor, index) => (
              <Link 
                to={`/instrutor/${instructor.id}`} 
                key={instructor.id}
                onClick={(e) => handleInstructorClick(e, instructor.id)}
              >
                <Card 
                  variant="interactive" 
                  className="h-full overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={instructor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&size=300&format=webp`}
                      alt={instructor.name}
                      width="306"
                      height="306"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Availability & Verification Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <VerifiedBadge isVerified={instructor.is_verified} />
                      <Badge variant="default" className="bg-accent text-accent-foreground">
                        <Clock className="h-3 w-3 mr-1" /> Disponível
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Name & Rating */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{instructor.name}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-medium">{instructor.rating || 0}</span>
                        <span className="text-muted-foreground">({instructor.total_reviews || 0})</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{instructor.city}, {instructor.state}</span>
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(instructor.specialties || []).slice(0, 2).map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      {isAuthenticated ? (
                        <div>
                          <span className="text-xs text-muted-foreground">A partir de</span>
                          <p className="font-bold text-lg text-foreground">
                            R$ {instructor.price || 0}<span className="text-sm font-normal text-muted-foreground">/aula</span>
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs text-muted-foreground">Preço</span>
                          <p className="text-sm font-medium text-primary">Faça login para ver</p>
                        </div>
                      )}
                      <Button size="sm" variant="ghost" className="gap-1 text-accent hover:text-accent">
                        Ver perfil <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/instrutores">
            <Button size="lg" variant="outline" className="gap-2">
              Ver todos os instrutores
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
