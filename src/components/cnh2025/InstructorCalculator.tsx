import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Calculator, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCalculatorUsage, trackCTAClick } from "@/lib/analytics";

export function InstructorCalculator() {
  const [pricePerHour, setPricePerHour] = useState(80);
  const [hoursPerMonth, setHoursPerMonth] = useState(100);

  // Cálculos
  const platformFee = 0.15; // 15%
  const averageAutoescolaSalary = 3500;

  const grossRevenue = pricePerHour * hoursPerMonth;
  const platformCost = grossRevenue * platformFee;
  const netRevenue = grossRevenue - platformCost;
  const extraIncome = netRevenue - averageAutoescolaSalary;
  const percentageGain = ((extraIncome / averageAutoescolaSalary) * 100).toFixed(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Track calculator usage when values change
  useEffect(() => {
    const timer = setTimeout(() => {
      trackCalculatorUsage(pricePerHour, hoursPerMonth, netRevenue);
    }, 1000); // Debounce tracking

    return () => clearTimeout(timer);
  }, [pricePerHour, hoursPerMonth, netRevenue]);

  return (
    <div className="py-16 md:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/50">
            <Calculator className="h-3 w-3 mr-1" />
            Calculadora de Viabilidade
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Quanto Você Pode Ganhar Como Instrutor Autônomo?
          </h2>
          <p className="text-lg text-slate-300">
            Descubra seu potencial de ganhos e compare com o salário médio de uma autoescola tradicional.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Calculator Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Configure Seus Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Preço por Hora */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300">
                    Preço da Aula (por hora)
                  </label>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(pricePerHour)}
                  </span>
                </div>
                <Slider
                  value={[pricePerHour]}
                  onValueChange={(value) => setPricePerHour(value[0])}
                  min={50}
                  max={150}
                  step={5}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>R$ 50</span>
                  <span>R$ 150</span>
                </div>
              </div>

              {/* Horas por Mês */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300">
                    Horas Trabalhadas / Mês
                  </label>
                  <span className="text-2xl font-bold text-primary">
                    {hoursPerMonth}h
                  </span>
                </div>
                <Slider
                  value={[hoursPerMonth]}
                  onValueChange={(value) => setHoursPerMonth(value[0])}
                  min={40}
                  max={200}
                  step={10}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>40h</span>
                  <span>200h</span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  <strong>💡 Dica:</strong> A média de mercado é R$ 80-100/hora. 
                  Instrutores experientes cobram até R$ 150/hora.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Seus Ganhos Projetados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Receita Bruta */}
              <div>
                <p className="text-sm text-slate-300 mb-1">Receita Bruta</p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(grossRevenue)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {hoursPerMonth}h × {formatCurrency(pricePerHour)}
                </p>
              </div>

              {/* Taxa Plataforma */}
              <div>
                <p className="text-sm text-slate-300 mb-1">Taxa da Plataforma (15%)</p>
                <p className="text-xl font-semibold text-red-400">
                  - {formatCurrency(platformCost)}
                </p>
              </div>

              <div className="border-t border-slate-600 pt-4">
                {/* Receita Líquida */}
                <div className="mb-6">
                  <p className="text-sm text-slate-300 mb-1">Receita Líquida</p>
                  <p className="text-4xl font-bold text-green-400">
                    {formatCurrency(netRevenue)}
                  </p>
                </div>

                {/* Comparação */}
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Autoescola (média):</span>
                    <span className="font-semibold text-slate-400">
                      {formatCurrency(averageAutoescolaSalary)}
                    </span>
                  </div>
                  <div className="border-t border-slate-700 pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-white">Ganho Extra:</span>
                      <span className="text-2xl font-bold text-green-400">
                        {formatCurrency(extraIncome)}
                      </span>
                    </div>
                    {extraIncome > 0 ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500 text-white">
                          <Sparkles className="h-3 w-3 mr-1" />
                          +{percentageGain}% a mais
                        </Badge>
                        <span className="text-xs text-slate-400">
                          que na autoescola
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-yellow-400">
                        Ajuste os valores para ver seu potencial de ganho
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Link to="/instrutor/cadastro" className="block">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => trackCTAClick('Começar Como Instrutor Autônomo', 'calculator_section', {
                    price_per_hour: pricePerHour,
                    hours_per_month: hoursPerMonth,
                    net_revenue: netRevenue
                  })}
                >
                  Começar Como Instrutor Autônomo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-slate-800/30 border-slate-700 text-center">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-primary mb-2">15%</p>
              <p className="text-sm text-slate-300">Taxa da Plataforma</p>
              <p className="text-xs text-slate-400 mt-1">Menor que autoescolas</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700 text-center">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-green-400 mb-2">100%</p>
              <p className="text-sm text-slate-300">Flexibilidade</p>
              <p className="text-xs text-slate-400 mt-1">Você escolhe quando trabalhar</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700 text-center">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-blue-400 mb-2">0%</p>
              <p className="text-sm text-slate-300">Custos Fixos</p>
              <p className="text-xs text-slate-400 mt-1">Sem mensalidades ou taxas escondidas</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
