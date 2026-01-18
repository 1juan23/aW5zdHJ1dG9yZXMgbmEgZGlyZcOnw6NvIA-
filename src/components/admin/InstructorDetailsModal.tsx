import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  User,
  Check,
  X,
  XCircle,
  DollarSign,
  Clock,
  Award,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type InstructorStatus = Database["public"]["Enums"]["instructor_status"];
type Instructor = Database["public"]["Tables"]["instructors"]["Row"];

interface InstructorDetailsModalProps {
  instructor: Instructor | null;
  open: boolean;
  onClose: () => void;
  onApprove: (instructor: Instructor) => void;
  onReject: (instructor: Instructor, reason: string) => void;
  onSuspend: () => void;
}

export function InstructorDetailsModal({
  instructor,
  open,
  onClose,
  onApprove,
  onReject,
  onSuspend,
}: InstructorDetailsModalProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setRejecting(false);
      setReason("");
    }
  }, [open]);

  if (!instructor) return null;

  const getStatusBadge = (status: InstructorStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30">
            ⏳ Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30">
            ✅ Aprovado
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30">
            🚫 Suspenso
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleApprove = () => {
    onApprove(instructor);
    onClose();
  };

  const handleReject = () => {
    if (!rejecting) {
      setRejecting(true);
      return;
    }
    onReject(instructor, reason);
    onClose();
  };

  const handleSuspend = () => {
    onSuspend();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
              {instructor.avatar_url ? (
                <img
                  src={instructor.avatar_url}
                  alt={instructor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-xl font-semibold">{instructor.name}</p>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(instructor.status)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Contact Info */}
          <Card className="bg-red-950/30 border-red-900/50">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Informações de Contato (Privadas)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-3">
                  <Mail className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-slate-200 font-medium">{instructor.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-3">
                  <Phone className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-xs text-slate-500">Telefone</p>
                    <p className="text-slate-200 font-medium">{instructor.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-slate-300">
              <MapPin className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Localização</p>
                <p>{instructor.city}, {instructor.state}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-slate-300">
              <Calendar className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Data de Cadastro</p>
                <p>{new Date(instructor.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}</p>
              </div>
            </div>
          </div>

          {/* Instructor Details */}
          <div className="space-y-4">
            {instructor.neighborhoods && (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Bairros de Atuação
                </h4>
                <p className="text-slate-300">{instructor.neighborhoods}</p>
              </div>
            )}

            {instructor.experience && (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Anos de Experiência
                </h4>
                <p className="text-slate-300">{instructor.experience}</p>
              </div>
            )}

            {instructor.specialties && instructor.specialties.length > 0 && (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Especialidades</h4>
                <div className="flex flex-wrap gap-2">
                  {instructor.specialties.map((spec, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-slate-700 text-slate-300 hover:bg-slate-600"
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {instructor.bio && (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Bio / Descrição</h4>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {instructor.bio}
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto text-emerald-500 mb-2" />
              <p className="text-xs text-slate-500">Preço/Hora</p>
              <p className="text-xl font-bold text-white">
                {instructor.price ? `R$ ${instructor.price.toFixed(2)}` : "Não informado"}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <Star className="h-6 w-6 mx-auto text-amber-500 fill-amber-500 mb-2" />
              <p className="text-xs text-slate-500">Avaliação</p>
              <p className="text-xl font-bold text-white">
                {instructor.rating ? instructor.rating.toFixed(1) : "0.0"}
                <span className="text-sm font-normal text-slate-400 ml-1">
                  ({instructor.total_reviews || 0} avaliações)
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-700">
            {instructor.status === "pending" && (
              <>
                {!rejecting ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => setRejecting(true)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-red-500/30">
                    <p className="text-sm font-medium text-red-400">Motivo da Rejeição</p>
                    <Textarea 
                      placeholder="Explique por que o perfil foi rejeitado..."
                      className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => setRejecting(false)}
                        className="flex-1 text-slate-400 hover:text-white"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={!reason.trim()}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Confirmar Rejeição
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            {instructor.status === "approved" && (
              <Button
                onClick={handleSuspend}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
              >
                <XCircle className="h-4 w-4 mr-2" />
                Suspender
              </Button>
            )}
            {instructor.status === "suspended" && ( 
              <Button
                onClick={handleApprove}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Reativar
              </Button>
            )}
            
            {/* Close button always visible */}
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
