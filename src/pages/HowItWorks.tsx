import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  UserCheck, 
  Calendar, 
  Car, 
  Shield, 
  Star, 
  MessageCircle, 
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const steps = [
  {
    icon: Search,
    title: "1. Busque",
    description: "Use nossa busca inteligente para encontrar instrutores na sua cidade. Filtre por preço, disponibilidade, especialidade e avaliações.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: UserCheck,
    title: "2. Compare",
    description: "Analise os perfis completos dos instrutores: fotos, bio, metodologia, avaliações de outros alunos e preços.",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    icon: MessageCircle,
    title: "3. Entre em contato",
    description: "Envie uma mensagem diretamente pelo WhatsApp ou formulário interno. Tire suas dúvidas antes de começar.",
    color: "bg-green-500/10 text-green-600",
  },
  {
    icon: Calendar,
    title: "4. Agende",
    description: "Combine os horários e locais das aulas diretamente com o instrutor escolhido.",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    icon: Car,
    title: "5. Aprenda",
    description: "Tenha aulas personalizadas com um profissional qualificado e evolua com segurança no trânsito.",
    color: "bg-accent/10 text-accent",
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Instrutores Verificados",
    description: "Todos os profissionais passam por verificação de documentos e credenciais.",
  },
  {
    icon: Star,
    title: "Avaliações Reais",
    description: "Leia avaliações de alunos reais que já tiveram aulas com os instrutores.",
  },
  {
    icon: Clock,
    title: "Horários Flexíveis",
    description: "Encontre instrutores com disponibilidade que se encaixe na sua rotina.",
  },
  {
    icon: MessageCircle,
    title: "Contato Direto",
    description: "Fale diretamente com o instrutor sem intermediários.",
  },
];

const faqs = [
  {
    question: "Como funciona o pagamento?",
    answer: "O pagamento é feito diretamente ao instrutor, sem taxas da plataforma para alunos. Combine a forma de pagamento diretamente com seu instrutor.",
  },
  {
    question: "Os instrutores são verificados?",
    answer: "Sim! Todos os instrutores passam por um processo de verificação que inclui análise de documentos, certificações e credenciais profissionais.",
  },
  {
    question: "Posso trocar de instrutor?",
    answer: "Claro! Você tem total liberdade para buscar outros profissionais a qualquer momento. Recomendamos avaliar seu instrutor para ajudar outros alunos.",
  },
  {
    question: "Quanto tempo leva para aprender a dirigir?",
    answer: "Isso varia de pessoa para pessoa. Em média, alunos iniciantes precisam de 20 a 40 horas de prática. Seu instrutor poderá fazer uma avaliação personalizada.",
  },
  {
    question: "A plataforma cobra alguma taxa?",
    answer: "Para alunos, o uso da plataforma é totalmente gratuito. Os instrutores pagam uma pequena mensalidade para manter seus perfis ativos.",
  },
];

export default function HowItWorks() {
  return (
    <>
      <Helmet>
        <title>Como Funciona | Instrutores na Direção</title>
        <meta 
          name="description" 
          content="Descubra como encontrar o instrutor de direção ideal na nossa plataforma. Processo simples, seguro e sem complicações." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          {/* Hero */}
          <section className="gradient-hero py-16 md:py-24">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
                Como Funciona
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                Encontrar o instrutor ideal é simples, rápido e seguro. 
                Veja como nossa plataforma conecta você aos melhores profissionais.
              </p>
            </div>
          </section>

          {/* Steps */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Passo a Passo
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Em 5 passos simples você encontra o instrutor perfeito para suas necessidades.
                </p>
              </div>

              <div className="max-w-4xl mx-auto space-y-8">
                {steps.map((step, index) => (
                  <div 
                    key={step.title}
                    className="flex flex-col md:flex-row items-start gap-6 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`flex-shrink-0 w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center`}>
                      <step.icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link to="/instrutores">
                  <Button size="lg" className="gap-2">
                    Começar agora
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Por que usar nossa plataforma?
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Vantagens exclusivas que fazem a diferença na sua busca pelo instrutor ideal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => (
                  <Card 
                    key={benefit.title} 
                    variant="elevated"
                    className="text-center animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="pt-8 pb-6">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/5 flex items-center justify-center">
                        <benefit.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Perguntas Frequentes
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Tire suas dúvidas sobre como funciona nossa plataforma.
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index} variant="default">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-2 flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        {faq.question}
                      </h3>
                      <p className="text-muted-foreground pl-8">
                        {faq.answer}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 md:py-24 gradient-hero">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-6">
                Pronto para encontrar seu instrutor?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Milhares de alunos já encontraram seus instrutores através da nossa plataforma.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/instrutores">
                  <Button size="xl" variant="accent" className="gap-2 w-full sm:w-auto">
                    Buscar instrutores
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/instrutor/cadastro">
                  <Button size="xl" variant="hero" className="w-full sm:w-auto">
                    Sou instrutor
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
