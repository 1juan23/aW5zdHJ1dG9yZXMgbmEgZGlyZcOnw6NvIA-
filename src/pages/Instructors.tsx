import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Star, MapPin, Clock, Filter, X, Search, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useInstructorsPaginated } from "@/hooks/useInstructorsPaginated";
import { useAuth } from "@/hooks/useAuth";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { VIPBadge } from "@/components/ui/VIPBadge";
import { CredentialBadge } from "@/components/ui/CredentialBadge";
import { cn } from "@/lib/utils";

const categories = ["Todos", "Iniciante", "Medo de dirigir", "Reciclagem", "Habilitados", "Primeira habilitação", "Baliza", "Estrada", "Defensiva"];
const ratingOptions = ["Todas", "4.5+", "4.0+", "3.5+", "3.0+"];
const vehicleOptions = ["Todos", "Carro", "Moto", "Ambos"];

export default function Instructors() {
  const [searchParams] = useSearchParams();
  const initialCity = searchParams.get("cidade") || "";
  
  const [searchTerm, setSearchTerm] = useState(initialCity);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [selectedRating, setSelectedRating] = useState("Todas");
  const [selectedVehicle, setSelectedVehicle] = useState("Todos");
  const [priceRange, setPriceRange] = useState([30, 200]);
  const [showFilters, setShowFilters] = useState(false);

  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInstructorsPaginated();
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Ref for infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 0
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [handleObserver]);

  const handleInstructorClick = (e: React.MouseEvent, id: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate("/login");
    }
  };

  // Flatten all pages of instructors
  const allInstructors = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.instructors);
  }, [data]);

  // Get unique cities from instructors
  const cities = useMemo(() => {
    if (!allInstructors.length) return ["Todas"];
    const uniqueCities = [...new Set(allInstructors.map((i) => i.city))];
    return ["Todas", ...uniqueCities.sort()];
  }, [allInstructors]);

  const filteredInstructors = useMemo(() => {
    if (!allInstructors.length) return [];
    
    return allInstructors.filter((instructor) => {
      const matchesSearch = 
        instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "Todos" || 
        (instructor.specialties || []).some(s => s.toLowerCase() === selectedCategory.toLowerCase());
      
      const matchesCity = selectedCity === "Todas" || instructor.city === selectedCity;
      
      const price = instructor.price || 0;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      // Rating filter
      let matchesRating = true;
      if (selectedRating !== "Todas") {
        const minRating = parseFloat(selectedRating.replace("+", ""));
        matchesRating = (instructor.rating || 0) >= minRating;
      }

      // Vehicle type filter
      let matchesVehicle = true;
      if (selectedVehicle !== "Todos") {
        const vehicleType = instructor.vehicle_type;
        if (selectedVehicle === "Carro") {
          matchesVehicle = vehicleType === 'car' || vehicleType === 'both';
        } else if (selectedVehicle === "Moto") {
          matchesVehicle = vehicleType === 'motorcycle' || vehicleType === 'both';
        } else if (selectedVehicle === "Ambos") {
          matchesVehicle = vehicleType === 'both';
        }
      }

      return matchesSearch && matchesCategory && matchesCity && matchesPrice && matchesRating && matchesVehicle;
    });
  }, [allInstructors, searchTerm, selectedCategory, selectedCity, priceRange, selectedRating, selectedVehicle]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Todos");
    setSelectedCity("Todas");
    setSelectedRating("Todas");
    setSelectedVehicle("Todos");
    setPriceRange([30, 200]);
  };

  return (
    <>
      <Helmet>
        <title>Encontre Instrutores de Direção | Instrutores na Direção</title>
        <meta 
          name="description" 
          content="Busque e compare instrutores de direção qualificados na sua cidade. Filtros por preço, disponibilidade e especialidade." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          {/* Page Header */}
          <section className="gradient-hero py-12">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Encontre seu instrutor
              </h1>
              <p className="text-primary-foreground/80 mb-8 max-w-2xl">
                Pesquise entre centenas de profissionais qualificados e encontre o ideal para você.
              </p>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por nome ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 bg-card border-0"
                  />
                </div>
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-5 w-5" />
                  Filtros
                </Button>
              </div>
            </div>
          </section>

          {/* Filters Panel */}
          {showFilters && (
            <section className="bg-card border-b py-6 animate-fade-in">
              <div className="container mx-auto px-4">
                <div className="flex flex-wrap gap-6 items-end">
                  {/* Category Filter */}
                  <div className="w-full sm:w-auto">
                    <label className="text-sm font-medium text-foreground mb-2 block">Categoria</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City Filter */}
                  <div className="w-full sm:w-auto">
                    <label className="text-sm font-medium text-foreground mb-2 block">Cidade</label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rating Filter */}
                  <div className="w-full sm:w-auto">
                    <label className="text-sm font-medium text-foreground mb-2 block">Avaliação</label>
                    <Select value={selectedRating} onValueChange={setSelectedRating}>
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ratingOptions.map((rating) => (
                          <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Vehicle Type Filter */}
                  <div className="w-full sm:w-auto">
                    <label className="text-sm font-medium text-foreground mb-2 block">Tipo de veículo</label>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleOptions.map((vehicle) => (
                          <SelectItem key={vehicle} value={vehicle}>{vehicle}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div className="w-full sm:w-auto sm:min-w-[200px]">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Preço: R$ {priceRange[0]} - R$ {priceRange[1]}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={30}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Clear Button */}
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                    <X className="h-4 w-4" />
                    Limpar
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Results */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isLoading && (
                <>
                  {/* Results Count */}
                  <p className="text-muted-foreground mb-6">
                    {filteredInstructors.length} instrutor(es) encontrado(s)
                  </p>

                  {/* Instructors Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInstructors.map((instructor) => {
                      const isElite = instructor.plan_type === 'elite';
                      const isDestaque = instructor.plan_type === 'destaque';
                      
                      return (
                      <Link 
                        to={`/instrutor/${instructor.id}`} 
                        key={instructor.id}
                        onClick={(e) => handleInstructorClick(e, instructor.id)}
                      >
                        <Card 
                          variant="interactive" 
                          className={cn(
                            "h-full transition-all duration-300",
                            isElite && "ring-2 ring-amber-400 shadow-lg shadow-amber-400/20 bg-gradient-to-br from-amber-50/5 to-transparent",
                            isDestaque && "ring-2 ring-primary shadow-lg shadow-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
                          )}
                        >
                          <CardContent className="p-0">
                            <div className="flex gap-4 p-4">
                              {/* Photo */}
                              <img
                                src={instructor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&size=96`}
                                alt={instructor.name}
                                className="w-24 h-24 rounded-xl object-cover flex-shrink-0 bg-muted"
                              />

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col gap-1 flex-1 min-w-0 mr-2">
                                      <h3 className="font-semibold text-foreground truncate text-base">
                                        {instructor.name}
                                      </h3>
                                      {isElite && <VIPBadge planType="elite" size="sm" />}
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      <FavoriteButton instructorId={instructor.id} />
                                      <div className="flex flex-col gap-1 items-end">
                                        <PlanBadge planType={instructor.plan_type} />
                                        <Badge variant="default" className="bg-accent text-accent-foreground flex-shrink-0 text-[10px] px-2 h-5">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Disponível
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{instructor.city}, {instructor.state}</span>
                                </div>

                                <div className="flex items-center gap-1 text-sm mt-1">
                                  <Star className="h-4 w-4 fill-warning text-warning" />
                                  <span className="font-medium">{instructor.rating || 0}</span>
                                  <span className="text-muted-foreground">({instructor.total_reviews || 0})</span>
                                </div>

                                {/* Credential Badges */}
                                <CredentialBadge 
                                  hasTeachingLicense={instructor.has_teaching_license} 
                                  vehicleType={instructor.vehicle_type}
                                  className="mt-2"
                                />
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-4 pt-0 border-t mt-4">
                              <div className="flex flex-wrap gap-1">
                                {(instructor.specialties || []).slice(0, 2).map((specialty) => (
                                  <Badge key={specialty} variant="outline" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                              <div className="text-right">
                                {isAuthenticated ? (
                                  <>
                                    <span className="text-xs text-muted-foreground">A partir de</span>
                                    <p className="font-bold text-foreground">
                                      R$ {instructor.price || 0}<span className="text-sm font-normal text-muted-foreground">/aula</span>
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xs text-muted-foreground">Preço</span>
                                    <p className="text-sm font-medium text-primary">Faça login para ver</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                      );
                    })}
                  </div>

                  {/* Infinite Scroll Loader */}
                  <div ref={loadMoreRef} className="py-8 flex justify-center">
                    {isFetchingNextPage && (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    )}
                    {!hasNextPage && filteredInstructors.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Você viu todos os instrutores
                      </p>
                    )}
                  </div>

                  {/* Empty State */}
                  {filteredInstructors.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Nenhum instrutor encontrado
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Tente ajustar os filtros para ver mais resultados.
                      </p>
                      <Button variant="outline" onClick={clearFilters}>
                        Limpar filtros
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
