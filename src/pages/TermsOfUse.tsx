import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Termos de Uso</CardTitle>
            <p className="text-center text-muted-foreground mt-2">Última atualização: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6 text-sm md:text-base leading-relaxed text-gray-700">
                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Aceitação dos Termos</h3>
                  <p>
                    Ao acessar e usar a plataforma "Instrutores na Direção", você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                    Se você não concordar com qualquer parte destes termos, você não deve usar nossos serviços.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Descrição do Serviço</h3>
                  <p>
                    "Instrutores na Direção" é uma plataforma online que conecta estudantes de direção a instrutores independentes e autoescolas. 
                    Nós atuamos apenas como intermediários para facilitar o agendamento e pagamento de aulas.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Responsabilidades dos Usuários</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li><strong>Alunos:</strong> Devem fornecer informações verdadeiras, comparecer às aulas agendadas e portar documentação necessária (Licença de Aprendizagem).</li>
                    <li><strong>Instrutores:</strong> Devem possuir credenciais válidas (Credencial de Instrutor), veículo adequado e segurado, e manter conduta profissional.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Pagamentos e Taxas</h3>
                  <p>
                    Os pagamentos são processados através de gateways seguros. A plataforma cobra uma taxa de serviço sobre cada transação para manutenção do sistema.
                    Instrutores recebem seus pagamentos conforme o cronograma definido em seu painel.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">5. Cancelamentos e Reembolsos</h3>
                  <p>
                    O cancelamento de aulas deve ser feito com no mínimo 24 horas de antecedência para reembolso total. 
                    Cancelamentos tardios podem estar sujeitos a taxas ou não reembolso, a critério da política do instrutor e da plataforma.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">6. Limitação de Responsabilidade</h3>
                  <p>
                    A plataforma não se responsabiliza por acidentes, danos ou condutas inadequadas durante as aulas práticas. 
                    A relação contratual de prestação de serviço de aula é firmada diretamente entre Aluno e Instrutor.
                  </p>
                </section>

                 <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">7. Modificações</h3>
                  <p>
                    Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação na plataforma.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfUse;
