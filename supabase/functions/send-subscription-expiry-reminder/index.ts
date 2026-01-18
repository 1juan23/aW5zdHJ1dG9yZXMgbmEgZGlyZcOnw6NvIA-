import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[SUBSCRIPTION-REMINDER] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting subscription expiry reminder check");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find subscriptions expiring in 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const sixDaysFromNow = new Date();
    sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);

    const { data: expiringSubscriptions, error: fetchError } = await supabaseClient
      .from("instructor_subscriptions")
      .select(`
        id,
        instructor_id,
        plan_type,
        subscription_ends_at,
        instructors (
          name,
          email
        )
      `)
      .eq("is_active", true)
      .neq("plan_type", "trial")
      .gte("subscription_ends_at", sixDaysFromNow.toISOString())
      .lte("subscription_ends_at", sevenDaysFromNow.toISOString());

    if (fetchError) {
      throw fetchError;
    }

    logStep("Found expiring subscriptions", { count: expiringSubscriptions?.length || 0 });

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions expiring soon", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const subscription of expiringSubscriptions) {
      const instructorData = subscription.instructors as unknown as { name: string; email: string } | null;
      
      if (!instructorData?.email) {
        logStep("Skipping - no email found", { instructorId: subscription.instructor_id });
        continue;
      }

      const planNames: Record<string, string> = {
        essencial: "Essencial",
        destaque: "Destaque",
        elite: "Elite",
      };

      const planName = planNames[subscription.plan_type] || subscription.plan_type;
      const expiryDate = new Date(subscription.subscription_ends_at!).toLocaleDateString("pt-BR");

      try {
        const { error: emailError } = await resend.emails.send({
          from: "Instrutores na Direção <noreply@resend.dev>",
          to: [instructorData.email],
          subject: `⚠️ Seu plano ${planName} expira em 7 dias`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); border-radius: 16px; padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 20px 0; font-size: 24px;">
                    ⚠️ Sua assinatura está expirando
                  </h1>
                  <p style="color: #94a3b8; margin: 0 0 30px 0; font-size: 16px;">
                    Olá, ${instructorData.name?.split(" ")[0] || "Instrutor"}!
                  </p>
                  <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <p style="color: #fbbf24; margin: 0; font-size: 18px; font-weight: 600;">
                      Seu plano ${planName} expira em ${expiryDate}
                    </p>
                  </div>
                  <p style="color: #94a3b8; margin: 0 0 30px 0; font-size: 14px;">
                    Para continuar aproveitando todos os benefícios do seu plano, renove sua assinatura antes do vencimento.
                  </p>
                  <a href="https://maestro-drive.lovable.app/instrutor/planos" 
                     style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Renovar Agora
                  </a>
                  <p style="color: #64748b; margin: 30px 0 0 0; font-size: 12px;">
                    Se você não renovar, seu perfil perderá os benefícios premium após a data de expiração.
                  </p>
                </div>
                <p style="color: #64748b; text-align: center; margin-top: 20px; font-size: 12px;">
                  © ${new Date().getFullYear()} Instrutores na Direção. Todos os direitos reservados.
                </p>
              </div>
            </body>
            </html>
          `,
        });

        if (emailError) {
          throw emailError;
        }

        sentCount++;
        logStep("Email sent successfully", { email: instructorData.email });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to send to ${instructorData.email}: ${errorMsg}`);
        logStep("Failed to send email", { email: instructorData.email, error: errorMsg });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Sent ${sentCount} reminder emails`,
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});