import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock } from "lucide-react";
import { useInstructorAvailability, useCreateLesson } from "@/hooks/useLessons";
import { format, addDays, setHours, setMinutes, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useCreateConversation } from "@/hooks/useMessages";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BookingCalendarProps {
  instructorId: string;
  instructorName: string;
  pricePerHour: number;
  onSuccess?: () => void;
}

const timeSlots = [
  "07:00", "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

export function BookingCalendar({
  instructorId,
  instructorName,
  pricePerHour,
  onSuccess,
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const { data: availability, isLoading } = useInstructorAvailability(instructorId);
  const createLesson = useCreateLesson();
  const createConversation = useCreateConversation();
  const navigate = useNavigate();

  const availableDays = useMemo(() => {
    if (!availability) return [];
    return availability.map((slot) => slot.day_of_week);
  }, [availability]);

  const isDateDisabled = (date: Date) => {
    const dayOfWeek = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Disable days without availability
    if (availability?.length && !availableDays.includes(dayOfWeek)) return true;
    
    // If no availability set, enable all future dates
    return false;
  };

  const getAvailableTimesForDate = (date: Date) => {
    if (!availability?.length) return timeSlots;
    
    const dayOfWeek = date.getDay();
    const daySlots = availability.filter((slot) => slot.day_of_week === dayOfWeek);
    
    if (!daySlots.length) return [];
    
    return timeSlots.filter((time) => {
      const [hours] = time.split(":").map(Number);
      return daySlots.some((slot) => {
        const startHour = parseInt(slot.start_time.split(":")[0]);
        const endHour = parseInt(slot.end_time.split(":")[0]);
        return hours >= startHour && hours < endHour;
      });
    });
  };

  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];
  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

    try {
      // Get current user for student name
      const { data: { user } } = await supabase.auth.getUser();
      
      const booking = await createLesson.mutateAsync({
        instructorId,
        scheduledAt,
        durationMinutes: 60,
        price: pricePerHour,
      });

      // Send email notification to instructor
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user?.id)
          .single();

        await supabase.functions.invoke("send-booking-email", {
          body: {
            instructorId,
            studentName: profile?.name || "Aluno",
            scheduledAt: scheduledAt.toISOString(),
            price: pricePerHour,
          },
        });
        console.log("Booking email sent");
      } catch (emailError) {
        console.error("Error sending booking email:", emailError);
        // Don't fail the booking if email fails
      }

      setSelectedDate(undefined);
      setSelectedTime(null);
      
      // Auto-create/open conversation and redirect
      try {
        const conversation = await createConversation.mutateAsync(instructorId);
        navigate(`/mensagens?conversa=${conversation.id}`);
        toast.success("Aula agendada! Combinando detalhes no chat...");
      } catch (convError) {
        console.error("Error creating conversation:", convError);
        navigate("/mensagens");
      }
      
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecione a data</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
              disabled={isDateDisabled}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecione o horário</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                
                {availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {time}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum horário disponível nesta data.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Selecione uma data para ver os horários disponíveis.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Summary */}
      {selectedDate && selectedTime && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Resumo do agendamento</p>
                <p className="font-semibold">
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })} às {selectedTime}
                </p>
                <p className="text-sm">Instrutor: {instructorName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-2xl font-bold">R$ {pricePerHour}</p>
              </div>
              <Button
                onClick={handleBook}
                disabled={createLesson.isPending}
                className="w-full md:w-auto"
              >
                {createLesson.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  "Confirmar Agendamento"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
