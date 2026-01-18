import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";

const faqData = [
  {
    question: "Como funciona a plataforma?",
    answer: "O Instrutores na Direção conecta alunos que desejam aprender a dirigir ou aperfeiçoar sua direção com instrutores particulares qualificados. Você busca por cidade, escolhe o instrutor, entra em contato via chat ou WhatsApp e agenda suas aulas."
  },
  {
    question: "Os instrutores são verificados?",
    answer: "Sim, todos os instrutores cadastrados passam por um processo de verificação de documentos e antecedentes para garantir a segurança dos nossos alunos."
  },
  {
    question: "Como faço para agendar uma aula?",
    answer: "Após escolher um instrutor, você pode clicar em 'Agendar Aula' no perfil dele. Você escolherá o melhor horário disponível e o instrutor confirmará o agendamento."
  },
  {
    question: "Como posso pagar pelas aulas?",
    answer: "O pagamento é combinado diretamente com o instrutor ou realizado através da nossa plataforma, dependendo da modalidade escolhida pelo profissional."
  },
  {
    question: "E se eu precisar cancelar uma aula?",
    answer: "Você pode cancelar aulas através do seu painel do aluno. Recomendamos que o cancelamento seja feito com pelo menos 24 horas de antecedência."
  },
  {
    question: "Como me torno um instrutor na plataforma?",
    answer: "Basta clicar em 'Seja um Instrutor' no rodapé ou 'Área do Instrutor' no topo, realizar seu cadastro e aguardar a validação do nosso time."
  }
];

export default function FAQ() {
  return (
    <>
      <Helmet>
        <title>Perguntas Frequentes | Instrutores na Direção</title>
        <meta name="description" content="Tire suas dúvidas sobre como usar a plataforma Instrutores na Direção." />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">Perguntas Frequentes (FAQ)</h1>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqData.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 pt-2">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
