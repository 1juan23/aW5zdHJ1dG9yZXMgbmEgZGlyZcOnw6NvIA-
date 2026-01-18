import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewInstructorRequest {
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
  instructorCity: string;
  instructorState: string;
  hasTeachingLicense: boolean;
  vehicleType: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      instructorId,
      instructorName,
      instructorEmail,
      instructorCity,
      instructorState,
      hasTeachingLicense,
      vehicleType,
    }: NewInstructorRequest = await req.json();

    // Basic input validation
    if (!instructorId || !instructorName || !instructorEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Notifying admin about new instructor:", instructorId);

    // Create Supabase client to fetch admin emails
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch admin users
    const { data: adminRoles, error: adminError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admin roles:", adminError);
    }

    // Get admin emails from auth
    const adminEmails: string[] = [];
    if (adminRoles && adminRoles.length > 0) {
      for (const role of adminRoles) {
        const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
        if (userData?.user?.email) {
          adminEmails.push(userData.user.email);
        }
      }
    }

    // If no admins found, use fallback email
    const recipients = adminEmails.length > 0 ? adminEmails : ["admin@maestrodrive.com.br"];

    const vehicleLabel = vehicleType === 'car' ? 'Carro' : vehicleType === 'motorcycle' ? 'Moto' : 'Carro e Moto';

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Instrutores na Direção <onboarding@resend.dev>",
        to: recipients,
        subject: `🆕 Novo Instrutor Cadastrado: ${instructorName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F97316, #EA580C); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F97316; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .info-row { margin: 12px 0; display: flex; gap: 10px; }
              .label { font-weight: 600; color: #666; min-width: 140px; }
              .value { color: #333; }
              .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
              .badge-pending { background: #FEF3C7; color: #92400E; }
              .badge-license { background: #D1FAE5; color: #065F46; }
              .cta-button { display: inline-block; background: #F97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
              .alert { background: #FEF3C7; border: 1px solid #FCD34D; padding: 15px; border-radius: 8px; margin-top: 20px; }
              .alert-title { font-weight: 600; color: #92400E; margin: 0 0 5px 0; }
              .alert-text { color: #92400E; margin: 0; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚗 Novo Instrutor Cadastrado!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Aguardando revisão de documentos</p>
              </div>
              <div class="content">
                <p>Um novo instrutor completou o cadastro na plataforma e está aguardando a verificação dos documentos.</p>
                
                <div class="info-box">
                  <div class="info-row">
                    <span class="label">👤 Nome:</span>
                    <span class="value"><strong>${instructorName}</strong></span>
                  </div>
                  <div class="info-row">
                    <span class="label">📧 Email:</span>
                    <span class="value">${instructorEmail}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">📍 Localização:</span>
                    <span class="value">${instructorCity}, ${instructorState}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">🚗 Tipo de Veículo:</span>
                    <span class="value">${vehicleLabel}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">📋 Credenciamento:</span>
                    <span class="value">
                      ${hasTeachingLicense 
                        ? '<span class="badge badge-license">✓ Possui Registro de Instrutor</span>' 
                        : '<span class="badge badge-pending">Não informado</span>'}
                    </span>
                  </div>
                  <div class="info-row">
                    <span class="label">🔖 Status:</span>
                    <span class="value"><span class="badge badge-pending">Pendente</span></span>
                  </div>
                </div>
                
                <div class="alert">
                  <p class="alert-title">⚠️ Ação Necessária</p>
                  <p class="alert-text">Acesse o painel administrativo para revisar os documentos (CNH) do instrutor e aprovar ou rejeitar o cadastro.</p>
                </div>
                
                <div style="text-align: center;">
                  <a href="https://maestro-drive.lovable.app/admin" class="cta-button">
                    Acessar Painel Admin
                  </a>
                </div>
                
                <div class="footer">
                  <p>Instrutores na Direção - Painel Administrativo</p>
                  <p style="font-size: 12px; color: #999;">Este é um email automático, não responda.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Admin notification email sent:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-new-instructor function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
