import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccountLockedPayload {
  email: string;
  attemptCount: number;
  lockDurationMinutes: number;
  ipAddress?: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AccountLockedPayload = await req.json();
    const { email, attemptCount, lockDurationMinutes, ipAddress } = payload;

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Sending account locked notification to ${email}`);

    const currentTime = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "medium",
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Alerta de Segurança - Conta Bloqueada</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              
              <!-- Header with warning icon -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">🔒</span>
                </div>
                <h1 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0;">
                  Alerta de Segurança
                </h1>
              </div>

              <!-- Alert box -->
              <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #92400e; font-weight: 600; margin: 0 0 8px 0; font-size: 16px;">
                  ⚠️ Sua conta foi temporariamente bloqueada
                </p>
                <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6;">
                  Detectamos <strong>${attemptCount} tentativas de login falhas</strong> em sua conta. 
                  Por segurança, o acesso foi bloqueado por <strong>${lockDurationMinutes} minutos</strong>.
                </p>
              </div>

              <!-- Details -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="color: #475569; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
                  Detalhes do evento:
                </h3>
                <table style="width: 100%; font-size: 14px;">
                  <tr>
                    <td style="color: #64748b; padding: 4px 0;">Data/Hora:</td>
                    <td style="color: #1e293b; font-weight: 500; padding: 4px 0;">${currentTime}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 4px 0;">Tentativas falhas:</td>
                    <td style="color: #dc2626; font-weight: 600; padding: 4px 0;">${attemptCount}</td>
                  </tr>
                  ${ipAddress ? `
                  <tr>
                    <td style="color: #64748b; padding: 4px 0;">Endereço IP:</td>
                    <td style="color: #1e293b; font-family: monospace; padding: 4px 0;">${ipAddress}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="color: #64748b; padding: 4px 0;">Bloqueio expira em:</td>
                    <td style="color: #059669; font-weight: 600; padding: 4px 0;">${lockDurationMinutes} minutos</td>
                  </tr>
                </table>
              </div>

              <!-- What to do -->
              <div style="margin-bottom: 24px;">
                <h3 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                  O que fazer agora?
                </h3>
                <ul style="color: #475569; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Se foi você:</strong> Aguarde ${lockDurationMinutes} minutos e tente novamente com a senha correta.</li>
                  <li><strong>Se não foi você:</strong> Recomendamos alterar sua senha imediatamente após o desbloqueio.</li>
                  <li>Considere ativar a <strong>autenticação de dois fatores (2FA)</strong> para maior segurança.</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="https://instrutoresnadirecao.com.br/recuperar-senha" 
                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  Recuperar Senha
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">
                  Se você não reconhece esta atividade, entre em contato conosco imediatamente.
                </p>
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Instrutores na Direção. Todos os direitos reservados.
                </p>
              </div>

            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Segurança <seguranca@instrutoresnadirecao.com.br>",
      to: [email],
      subject: "🔒 Alerta de Segurança: Sua conta foi temporariamente bloqueada",
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Account locked email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, messageId: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-account-locked-email:", errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
