import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Política de Privacidade</CardTitle>
            <p className="text-center text-muted-foreground mt-2">Em conformidade com a LGPD (Lei Geral de Proteção de Dados)</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6 text-sm md:text-base leading-relaxed text-gray-700">
                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Coleta de Informações</h3>
                  <p>
                    Coletamos informações que você nos fornece diretamente, como nome, email, telefone, endereço e dados de pagamento ao se registrar ou agendar uma aula.
                    Também podemos coletar dados de documentos para verificação de identidade (KYC).
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Uso das Informações</h3>
                  <p>Utilizamos seus dados para:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Processar agendamentos e pagamentos.</li>
                    <li>Verificar a identidade e credenciais de instrutores e alunos.</li>
                    <li>Enviar notificações sobre aulas, atualizações e promoções.</li>
                    <li>Melhorar e personalizar nossos serviços.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Compartilhamento de Dados</h3>
                  <p>
                    Não vendemos seus dados pessoais. Compartilhamos informações apenas com:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Instrutores/Alunos:</strong> Dados de contato estritamente necessários para a realização da aula.</li>
                    <li><strong>Processadores de Pagamento:</strong> Stripe/Pagar.me para processar transações.</li>
                    <li><strong>Autoridades Legais:</strong> Quando exigido por lei.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Segurança de Dados</h3>
                  <p>
                    Implementamos medidas de segurança técnicas e administrativas para proteger seus dados contra acesso não autorizado, perda ou alteração. 
                    Utilizamos criptografia em trânsito e em repouso.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">5. Seus Direitos (LGPD)</h3>
                  <p>
                    Você tem o direito de solicitar acesso, correção, exclusão ou portabilidade dos seus dados pessoais. 
                    Você também pode revogar seu consentimento a qualquer momento.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">6. Cookies</h3>
                  <p>
                    Utilizamos cookies para melhorar a experiência de navegação e analisar o tráfego do site. 
                    Você pode gerenciar as preferências de cookies nas configurações do seu navegador.
                  </p>
                </section>

                 <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">7. Contato</h3>
                  <p>
                    Se tiver dúvidas sobre esta política de privacidade, entre em contato conosco através do suporte na plataforma ou pelo email: privacidade@instrutoresnadirecao.com.br
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

export default PrivacyPolicy;
