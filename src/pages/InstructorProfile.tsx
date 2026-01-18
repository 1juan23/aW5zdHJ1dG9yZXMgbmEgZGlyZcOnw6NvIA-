import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, MapPin, Clock, Phone, Mail, MessageCircle, Heart, Shield, Award, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useInstructor } from "@/hooks/useInstructors";
import { useInstructorReviews } from "@/hooks/useReviews";
import { BookingCalendar } from "@/components/scheduling/BookingCalendar";
import { useCreateConversation } from "@/hooks/useMessages";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { VIPBadge } from "@/components/ui/VIPBadge";
import { PaymentGateModal } from "@/components/payment/PaymentGateModal";
import { logProfileView } from "@/hooks/useProfileViews";
import { useStudentAccess } from "@/hooks/useStudentAccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function InstructorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"booking" | "whatsapp" | "message" | null>(null);

  const { data: instructor, isLoading } = useInstructor(id || "");
  const { data: reviews } = useInstructorReviews(id || "");
  const createConversation = useCreateConversation();
  
  // Check student access from database (persisted)
  const { hasAccess, isLoading: accessLoading, refetch: refetchAccess } = useStudentAccess(id || null);

  // Check if user just completed payment - refetch access
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      refetchAccess();
      toast.success("Pagamento confirmado! Agora você pode entrar em contato.");
    }
  }, [searchParams, refetchAccess]);

  // Log profile view
  useEffect(() => {
    if (id) {
      logProfileView(id);
    }
  }, [id]);


  const requirePayment = (action: "booking" | "whatsapp" | "message") => {
    // Check database-persisted access, not local state
    if (hasAccess) return false;
    setPendingAction(action);
    setShowPaymentModal(true);
    return true;
  };

  const handlePaymentSuccess = async () => {
    // Refetch access from database to confirm payment
    await refetchAccess();
    setShowPaymentModal(false);
    
    // Execute pending action after access is confirmed
    if (pendingAction === "booking") {
      setShowBooking(true);
    } else if (pendingAction === "whatsapp") {
      executeWhatsApp();
    } else if (pendingAction === "message") {
      executeSendMessage();
    }
    setPendingAction(null);
  };

  const executeWhatsApp = () => {
    if (!instructor) return;
    const fullInstructor = instructor as { phone?: string };
    if (fullInstructor.phone) {
      const message = encodeURIComponent(`Olá ${instructor.name}! Vi seu perfil na plataforma Instrutores na Direção e gostaria de saber mais sobre suas aulas.`);
      window.open(`https://wa.me/55${fullInstructor.phone.replace(/\D/g, "")}?text=${message}`, "_blank");
    } else {
      toast.error("Não foi possível obter o número do instrutor");
    }
  };

  const executeSendMessage = async () => {
    try {
      const conversation = await createConversation.mutateAsync(id!);
      navigate(`/mensagens?conversa=${conversation.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleWhatsApp = async () => {
    if (!instructor) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para chamar no WhatsApp");
      navigate("/login");
      return;
    }

    if (requirePayment("whatsapp")) return;
    executeWhatsApp();
  };

  const handleSendMessage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para enviar mensagens");
      navigate("/login");
      return;
    }

    if (requirePayment("message")) return;
    executeSendMessage();
  };

  const handleBooking = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para agendar aulas");
      navigate("/login");
      return;
    }

    if (requirePayment("booking")) return;
    setShowBooking(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Instrutor não encontrado</h1>
            <p className="text-muted-foreground">Este perfil não existe ou foi removido.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{instructor.name} - Instrutor de Direção em {instructor.city} | Instrutores na Direção</title>
        <meta 
          name="description" 
          content={`${instructor.name} - Instrutor de direção em ${instructor.city}, ${instructor.state}. ${instructor.experience || "Experiência comprovada"}. Avaliação ${instructor.rating || 0}/5. Agende sua aula!`} 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          {/* Cover Photo */}
          <div className="relative h-48 md:h-64 bg-primary">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
          </div>

          <div className="container mx-auto px-4">
            {/* Profile Header */}
            <div className="relative -mt-20 mb-8">
              <div className="flex flex-col gap-6 items-start md:items-start md:justify-start px-[10px] py-[10px] mx-[10px] my-[50px] md:flex md:flex-row">
                {/* Photo */}
                <div className="relative">
                  <img
                    src={instructor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&size=160`}
                    alt={instructor.name}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-card shadow-lg object-cover bg-muted"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-accent text-accent-foreground p-2 rounded-full">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 pt-4 md:pt-8">
                  <div className="flex flex-wrap items-start gap-4 justify-between">
                    <div>
                      <div className="flex flex-col gap-2 mb-1">
                        <div className="flex items-center gap-3">
                          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                            {instructor.name}
                          </h1>
                          <PlanBadge planType={(instructor as any).plan_type || 'trial'} size="md" />
                        </div>
                        <VIPBadge planType={(instructor as any).plan_type} size="md" />
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>{instructor.city}, {instructor.state}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-warning text-warning" />
                          <span className="font-bold text-foreground">{instructor.rating || 0}</span>
                          <span className="text-muted-foreground">({instructor.total_reviews || 0} avaliações)</span>
                        </div>
                        <Badge className="bg-accent/10 text-accent border-accent/20">
                          <Clock className="h-3 w-3 mr-1" />
                          Disponível
                        </Badge>
                      </div>
                    </div>

                    {/* Favorite Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="rounded-full"
                    >
                      <Heart className={`h-5 w-5 ${isFavorite ? "fill-destructive text-destructive" : ""}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Bio */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sobre mim</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-line leading-relaxed">
                      {instructor.bio || "Instrutor de direção qualificado e dedicado a ajudar você a conquistar sua CNH."}
                    </p>
                  </CardContent>
                </Card>

                {/* Specialties */}
                {instructor.specialties && instructor.specialties.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Especialidades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {instructor.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary" className="text-sm py-1 px-3">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Vehicle Type and Teaching License */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Profissionais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      {(instructor as any).vehicle_type && (
                        <Badge variant="outline" className="text-sm py-2 px-4 gap-2">
                          {(instructor as any).vehicle_type === 'car' && (
                            <>🚗 Aulas de Carro</>
                          )}
                          {(instructor as any).vehicle_type === 'motorcycle' && (
                            <>🏍️ Aulas de Moto</>
                          )}
                          {(instructor as any).vehicle_type === 'both' && (
                            <>🚗🏍️ Carro e Moto</>
                          )}
                        </Badge>
                      )}
                      {(instructor as any).has_teaching_license && (
                        <Badge className="text-sm py-2 px-4 gap-2 bg-accent text-accent-foreground">
                          <Award className="h-4 w-4" />
                          Instrutor Credenciado
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Neighborhoods */}
                {instructor.neighborhoods && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Bairros atendidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground">{instructor.neighborhoods}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Avaliações</CardTitle>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-warning text-warning" />
                      <span className="font-bold">{instructor.rating || 0}</span>
                      <span className="text-muted-foreground">({instructor.total_reviews || 0})</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {reviews && reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="pb-6 border-b last:border-0 last:pb-0">
                            <div className="flex items-start gap-4">
                              <img
                                src={review.student_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.student_name || "Aluno")}&size=48`}
                                alt={review.student_name || "Aluno"}
                                className="w-12 h-12 rounded-full object-cover bg-muted"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium text-foreground">
                                    {review.student_name || "Aluno"}
                                  </h4>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(review.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                  </span>
                                </div>
                                <div className="flex gap-0.5 mb-2">
                                  {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                                  ))}
                                </div>
                                {review.comment && (
                                  <p className="text-foreground">{review.comment}</p>
                                )}
                                {review.photos && review.photos.length > 0 && (
                                  <div className="flex gap-2 mt-3">
                                    {review.photos.map((photo: string, i: number) => (
                                      <img
                                        key={i}
                                        src={photo}
                                        alt={`Foto ${i + 1}`}
                                        className="h-20 w-20 rounded-lg object-cover"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma avaliação ainda.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Pricing Card */}
                <Card className="sticky top-24">
                  <CardContent className="p-6">
                    {/* Price */}
                    <div className="text-center mb-6">
                      <span className="text-sm text-muted-foreground">A partir de</span>
                      <div className="text-4xl font-bold text-foreground">
                        {supabase.auth.getUser().then(({ data }) => data.user) ? (
                          <>
                            R$ {instructor.price || 0}
                            <span className="text-lg font-normal text-muted-foreground">/aula</span>
                          </>
                        ) : (
                          <div className="text-xl text-primary mt-2">Faça login para ver</div>
                        )}
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="space-y-3">
                      <Button 
                        size="lg" 
                        className="w-full gap-2"
                        onClick={handleBooking}
                      >
                        <Calendar className="h-5 w-5" />
                        Agendar Aula
                      </Button>
                      <Dialog open={showBooking} onOpenChange={setShowBooking}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Agendar aula com {instructor.name}</DialogTitle>
                          </DialogHeader>
                          <BookingCalendar
                            instructorId={instructor.id}
                            instructorName={instructor.name}
                            pricePerHour={instructor.price || 0}
                            onSuccess={() => setShowBooking(false)}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        size="lg"
                        variant="whatsapp"
                        className="w-full gap-2"
                        onClick={handleWhatsApp}
                      >
                        <MessageCircle className="h-5 w-5" />
                        Chamar no WhatsApp
                      </Button>
                      
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleSendMessage}
                        disabled={createConversation.isPending}
                      >
                        {createConversation.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Mail className="h-5 w-5" />
                        )}
                        Enviar mensagem
                      </Button>
                    </div>

                    <hr className="my-6" />

                    {/* Quick Info */}
                    <div className="space-y-4 text-sm">
                      {instructor.experience && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Experiência
                          </span>
                          <span className="font-medium text-foreground">{instructor.experience}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Avaliação
                        </span>
                        <span className="font-medium text-foreground">{instructor.rating || 0}/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <Footer />

        {/* Payment Gate Modal */}
        <PaymentGateModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          onPaymentSuccess={handlePaymentSuccess}
          instructorName={instructor?.name || ""}
          instructorId={instructor?.id || ""}
          actionType={pendingAction || "booking"}
        />
      </div>
    </>
  );
}
