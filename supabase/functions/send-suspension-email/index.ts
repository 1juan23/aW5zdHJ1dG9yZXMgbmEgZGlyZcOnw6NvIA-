import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SuspensionEmailRequest {
  instructorId: string;
  justification: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // 3. Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 4. Verify user has admin role using the has_role function
    const { data: hasAdminRole, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !hasAdminRole) {
      console.error("Role check failed:", roleError?.message || "Not an admin");
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 5. Parse and validate request body
    const { instructorId, justification }: SuspensionEmailRequest = await req.json();
    
    if (!instructorId || !justification) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: instructorId and justification" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 6. Fetch instructor data from database (don't trust client-supplied email)
    const { data: instructor, error: instError } = await supabase
      .from("instructors")
      .select("name, email")
      .eq("id", instructorId)
      .single();

    if (instError || !instructor) {
      console.error("Instructor not found:", instError?.message);
      return new Response(
        JSON.stringify({ error: "Instructor not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 7. Send email with validated data from database
    const emailResponse = await resend.emails.send({
      from: "Instrutores na Direção <onboarding@resend.dev>",
      to: [instructor.email],
      subject: "Seu cadastro foi suspenso - Instrutores na Direção",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .reason-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .btn { display: inline-block; background: #2d4a6f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cadastro Suspenso</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${instructor.name}</strong>,</p>
              
              <p>Infelizmente, seu cadastro como instrutor na plataforma <strong>Instrutores na Direção</strong> foi suspenso pela nossa equipe de administração.</p>
              
              <div class="reason-box">
                <strong>Motivo da suspensão:</strong>
                <p style="margin-bottom: 0;">${justification}</p>
              </div>
              
              <p>Caso deseje voltar a fazer parte da nossa plataforma, por favor, revise as informações mencionadas e realize um novo cadastro com os ajustes necessários.</p>
              
              <p>Se você acredita que houve um engano ou precisa de mais informações, entre em contato conosco respondendo este email.</p>
              
              <p>Atenciosamente,<br><strong>Equipe Instrutores na Direção</strong></p>
            </div>
            <div class="footer">
              <p>Este email foi enviado automaticamente. Por favor, não responda diretamente.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Suspension email sent successfully by admin:", user.id, "to instructor:", instructorId);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-suspension-email function:", error);
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
