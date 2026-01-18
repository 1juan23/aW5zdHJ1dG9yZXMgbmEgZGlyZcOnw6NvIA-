import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // Lower limit for cancellations
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (identifier: string): { allowed: boolean; remaining: number } => {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count };
};

const getClientIdentifier = (req: Request): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `ip:${ip}`;
};

interface CancellationEmailRequest {
  lessonId: string;
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization - only allow calls from authenticated users or service role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limiting check
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId);
    
    if (!rateLimit.allowed) {
      console.log(`[RATE-LIMIT] Request blocked for ${clientId}`);
      
      // Log rate limit event to database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      
      try {
        await supabaseAdmin.rpc('log_security_event', {
          p_event_type: 'rate_limit_exceeded',
          p_ip_address: clientId,
          p_details: { function: 'send-cancellation-email', client_id: clientId }
        });
      } catch (logErr) {
        console.error('Failed to log security event:', logErr);
      }
      
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": "60",
            ...corsHeaders 
          } 
        }
      );
    }

    const { lessonId, reason }: CancellationEmailRequest = await req.json();

    // Basic input validation
    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: "Lesson ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending cancellation email for lesson:", lessonId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("*, instructor_id, student_id, scheduled_at, price")
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) {
      throw new Error("Aula não encontrada");
    }

    // Get student info
    const { data: student } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("user_id", lesson.student_id)
      .single();

    // Get instructor info
    const { data: instructor } = await supabase
      .from("instructors")
      .select("name, email")
      .eq("id", lesson.instructor_id)
      .single();

    if (!student || !instructor) {
      throw new Error("Dados não encontrados");
    }

    const scheduledDate = new Date(lesson.scheduled_at);
    const formattedDate = scheduledDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = scheduledDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send email to instructor
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Instrutores na Direção <onboarding@resend.dev>",
        to: [instructor.email],
        subject: `Aula cancelada - ${student.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444; }
              .reason { background: #FEF2F2; padding: 15px; border-radius: 8px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>❌ Aula Cancelada</h1>
              </div>
              <div class="content">
                <p>Olá, <strong>${instructor.name}</strong>!</p>
                <p>Infelizmente, uma aula foi cancelada pelo aluno.</p>
                
                <div class="info-box">
                  <p><strong>Aluno:</strong> ${student.name}</p>
                  <p><strong>Data:</strong> ${formattedDate}</p>
                  <p><strong>Horário:</strong> ${formattedTime}</p>
                  <p><strong>Valor:</strong> R$ ${lesson.price.toFixed(2)}</p>
                  ${reason ? `<div class="reason"><strong>Motivo:</strong> ${reason}</div>` : ""}
                </div>
                
                <p>Entre em contato com o aluno caso necessário.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    console.log("Cancellation email sent");

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-cancellation-email:", error);
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
