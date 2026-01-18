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
const MAX_REQUESTS_PER_WINDOW = 10;
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

const getClientIdentifier = (req: Request, userId?: string): string => {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `ip:${ip}`;
};

interface BookingEmailRequest {
  instructorId: string;
  studentName: string;
  scheduledAt: string;
  price: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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
          p_details: { function: 'send-booking-email', client_id: clientId }
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

    const { instructorId, studentName, scheduledAt, price }: BookingEmailRequest = await req.json();

    // Basic input validation
    if (!instructorId || !studentName || !scheduledAt || price === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending booking email for instructor:", instructorId);

    // Create Supabase client to fetch instructor details
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch instructor details
    const { data: instructor, error: instructorError } = await supabase
      .from("instructors")
      .select("name, email")
      .eq("id", instructorId)
      .single();

    if (instructorError || !instructor) {
      console.error("Error fetching instructor:", instructorError);
      throw new Error("Instrutor não encontrado");
    }

    // Format date for email
    const date = new Date(scheduledAt);
    const formattedDate = date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send email using Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Instrutores na Direção <onboarding@resend.dev>",
        to: [instructor.email],
        subject: `Nova aula agendada com ${studentName}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F97316, #EA580C); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F97316; }
              .info-row { margin: 10px 0; }
              .label { font-weight: 600; color: #666; }
              .value { color: #333; }
              .price { font-size: 24px; color: #F97316; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚗 Nova Aula Agendada!</h1>
              </div>
              <div class="content">
                <p>Olá, <strong>${instructor.name}</strong>!</p>
                <p>Você tem uma nova aula agendada. Confira os detalhes:</p>
                
                <div class="info-box">
                  <div class="info-row">
                    <span class="label">Aluno:</span>
                    <span class="value">${studentName}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Data:</span>
                    <span class="value">${formattedDate}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Horário:</span>
                    <span class="value">${formattedTime}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Valor:</span>
                    <span class="price">R$ ${price.toFixed(2)}</span>
                  </div>
                </div>
                
                <p>Acesse a plataforma para ver mais detalhes e entrar em contato com o aluno.</p>
                
                <div class="footer">
                  <p>Instrutores na Direção</p>
                  <p>Este é um email automático, não responda.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-email function:", error);
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
