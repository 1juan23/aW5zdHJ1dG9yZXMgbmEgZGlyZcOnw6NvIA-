import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Plus, Trash2, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface DaySchedule {
  day: string;
  dayName: string;
  enabled: boolean;
  slots: TimeSlot[];
}

const DAYS_OF_WEEK = [
  { day: "monday", dayName: "Segunda-feira" },
  { day: "tuesday", dayName: "Terça-feira" },
  { day: "wednesday", dayName: "Quarta-feira" },
  { day: "thursday", dayName: "Quinta-feira" },
  { day: "friday", dayName: "Sexta-feira" },
  { day: "saturday", dayName: "Sábado" },
  { day: "sunday", dayName: "Domingo" },
];

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: "1", start: "08:00", end: "12:00" },
  { id: "2", start: "14:00", end: "18:00" },
];

export function ScheduleManager() {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS_OF_WEEK.map(({ day, dayName }) => ({
      day,
      dayName,
      enabled: false,
      slots: [],
    }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // Auto-save function
  const saveSchedule = useCallback(async (scheduleData: DaySchedule[]) => {
    if (!instructorId || isInitialLoad.current) return;
    
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // 1. Delete existing slots for this instructor
      const { error: deleteError } = await supabase
        .from('availability_slots')
        .delete()
        .eq('instructor_id', instructorId);

      if (deleteError) throw deleteError;

      // 2. Insert new slots - use the actual day index from the full array
      const slotsToInsert = scheduleData
        .map((day, dayIndex) => ({
          ...day,
          dayIndex // Keep the real index
        }))
        .filter(day => day.enabled)
        .flatMap((day) => 
          day.slots.map(slot => ({
            instructor_id: instructorId,
            day_of_week: day.dayIndex, // Use the real day index
            start_time: slot.start,
            end_time: slot.end,
            is_active: true
          }))
        );

      if (slotsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('availability_slots')
          .insert(slotsToInsert);

        if (insertError) throw insertError;
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar sua agenda automaticamente.",
        variant: "destructive",
      });
      setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  }, [instructorId, toast]);

  // Debounced save - triggers after 800ms of no changes
  const debouncedSave = useCallback((scheduleData: DaySchedule[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveSchedule(scheduleData);
    }, 800);
  }, [saveSchedule]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const toggleDay = (dayIndex: number) => {
    setSchedule((prev) => {
      const newSchedule = [...prev];
      newSchedule[dayIndex].enabled = !newSchedule[dayIndex].enabled;
      
      // If enabling, add default slots
      if (newSchedule[dayIndex].enabled && newSchedule[dayIndex].slots.length === 0) {
        newSchedule[dayIndex].slots = DEFAULT_TIME_SLOTS.map(slot => ({
          ...slot,
          id: `${Date.now()}-${Math.random()}`
        }));
      }
      
      debouncedSave(newSchedule);
      return newSchedule;
    });
  };

  const addTimeSlot = (dayIndex: number) => {
    setSchedule((prev) => {
      const newSchedule = [...prev];
      const newSlot: TimeSlot = {
        id: Date.now().toString(),
        start: "09:00",
        end: "17:00",
      };
      newSchedule[dayIndex].slots.push(newSlot);
      debouncedSave(newSchedule);
      return newSchedule;
    });
  };

  const removeTimeSlot = (dayIndex: number, slotId: string) => {
    setSchedule((prev) => {
      const newSchedule = [...prev];
      newSchedule[dayIndex].slots = newSchedule[dayIndex].slots.filter(
        (slot) => slot.id !== slotId
      );
      debouncedSave(newSchedule);
      return newSchedule;
    });
  };

  const updateTimeSlot = (
    dayIndex: number,
    slotId: string,
    field: "start" | "end",
    value: string
  ) => {
    setSchedule((prev) => {
      const newSchedule = [...prev];
      const slotIndex = newSchedule[dayIndex].slots.findIndex(
        (s) => s.id === slotId
      );
      if (slotIndex !== -1) {
        newSchedule[dayIndex].slots[slotIndex][field] = value;
      }
      debouncedSave(newSchedule);
      return newSchedule;
    });
  };

  // Load schedule from Supabase
  useEffect(() => {
    async function loadSchedule() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: instructor } = await supabase
          .from('instructors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!instructor) return;
        
        setInstructorId(instructor.id);

        const { data: slots, error } = await supabase
          .from('availability_slots')
          .select('*')
          .eq('instructor_id', instructor.id);

        if (error) throw error;

        if (slots && slots.length > 0) {
          const newSchedule = DAYS_OF_WEEK.map(({ day, dayName }, index) => {
            const daySlots = slots.filter(s => s.day_of_week === index);
            return {
              day,
              dayName,
              enabled: daySlots.length > 0,
              slots: daySlots.map(s => ({
                id: s.id,
                start: s.start_time.slice(0, 5),
                end: s.end_time.slice(0, 5)
              }))
            };
          });
          setSchedule(newSchedule);
        }
        
        // Mark initial load as complete after setting schedule
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 100);
      } catch (error) {
        console.error('Error loading schedule:', error);
        toast({
          title: "Erro ao carregar agenda",
          description: "Não foi possível carregar seus horários.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadSchedule();
  }, [toast]);

  const getActiveDaysCount = () => {
    return schedule.filter((day) => day.enabled).length;
  };

  const getTotalHours = () => {
    let total = 0;
    schedule.forEach((day) => {
      if (day.enabled) {
        day.slots.forEach((slot) => {
          const start = parseInt(slot.start.split(":")[0]);
          const end = parseInt(slot.end.split(":")[0]);
          total += end - start;
        });
      }
    });
    return total;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dias Ativos</p>
                <p className="text-2xl font-bold text-foreground">
                  {getActiveDaysCount()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas/Semana</p>
                <p className="text-2xl font-bold text-foreground">
                  {getTotalHours()}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-accent/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={getActiveDaysCount() > 0 ? "default" : "secondary"}>
                  {getActiveDaysCount() > 0 ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configurar Disponibilidade</CardTitle>
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Salvo!</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {schedule.map((daySchedule, dayIndex) => (
            <div
              key={daySchedule.day}
              className="border rounded-lg p-4 space-y-4"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    id={`day-${daySchedule.day}`}
                    checked={daySchedule.enabled}
                    onCheckedChange={() => toggleDay(dayIndex)}
                  />
                  <Label
                    htmlFor={`day-${daySchedule.day}`}
                    className="text-base font-semibold cursor-pointer"
                  >
                    {daySchedule.dayName}
                  </Label>
                </div>
                {daySchedule.enabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeSlot(dayIndex)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Horário
                  </Button>
                )}
              </div>

              {/* Time Slots */}
              {daySchedule.enabled && (
                <div className="space-y-3 ml-8">
                  {daySchedule.slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum horário configurado. Clique em "Adicionar Horário"
                      para começar.
                    </p>
                  ) : (
                    daySchedule.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-3 bg-muted/30 p-3 rounded-md"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Label className="text-sm">Das</Label>
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) =>
                              updateTimeSlot(
                                dayIndex,
                                slot.id,
                                "start",
                                e.target.value
                              )
                            }
                            className="px-3 py-1 border rounded-md text-sm"
                          />
                          <Label className="text-sm">às</Label>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) =>
                              updateTimeSlot(
                                dayIndex,
                                slot.id,
                                "end",
                                e.target.value
                              )
                            }
                            className="px-3 py-1 border rounded-md text-sm"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeSlot(dayIndex, slot.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
            💡 Dica
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Configure sua disponibilidade semanal. Os alunos poderão agendar
            aulas apenas nos horários que você definir como disponíveis. Você
            pode adicionar múltiplos horários por dia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
