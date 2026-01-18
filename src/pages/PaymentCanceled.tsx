import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCanceled() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Pagamento Cancelado
          </h1>
          <p className="text-muted-foreground">
            Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.
          </p>
        </div>

        {/* Info card */}
        <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
          <p className="text-sm text-muted-foreground">
            Não se preocupe! Você pode retornar aos planos a qualquer momento e escolher a opção que melhor atende suas necessidades.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link to="/instrutor/planos" className="w-full">
            <Button className="w-full gap-2" size="lg">
              <CreditCard className="w-4 h-4" />
              Ver Planos Novamente
            </Button>
          </Link>
          
          <Link to="/instrutor/dashboard" className="w-full">
            <Button variant="outline" className="w-full gap-2" size="lg">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        {/* Help text */}
        <p className="text-sm text-muted-foreground">
          Precisa de ajuda?{" "}
          <Link to="/faq" className="text-primary hover:underline">
            Acesse nossa FAQ
          </Link>
        </p>
      </div>
    </div>
  );
}