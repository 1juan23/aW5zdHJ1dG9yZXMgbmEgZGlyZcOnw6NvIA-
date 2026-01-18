import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization - this is called by cron, check for service key or internal call
    const authHeader = req.headers.get("Authorization");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Allow if it's the service role key or internal cron call
    if (authHeader && !authHeader.includes(supabaseServiceKey || "")) {
      // For cron jobs, we check if the request comes from Supabase internal
      const isInternalCall = req.headers.get("X-Supabase-Webhook-Signature") !== null;
      if (!isInternalCall && !authHeader.includes("Bearer")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    console.log("Starting lesson reminders check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get lessons scheduled for the next 24-25 hours that are confirmed/pending
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select(`
        id,
        scheduled_at,
        price,
        student_id,
        instructor_id
      `)
      .gte("scheduled_at", in24Hours.toISOString())
      .lt("scheduled_at", in25Hours.toISOString())
      .in("status", ["pending", "confirmed"]);

    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError);
      throw lessonsError;
    }

    console.log(`Found ${lessons?.length || 0} lessons to remind`);

    const emailsSent = [];

    for (const lesson of lessons || []) {
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

      if (!student || !instructor) continue;

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

      // Send reminder to student
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Instrutores na Direção <onboarding@resend.dev>",
          to: [student.email],
          subject: `Lembrete: sua aula é amanhã!`,
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
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⏰ Lembrete de Aula</h1>
                </div>
                <div class="content">
                  <p>Olá, <strong>${student.name}</strong>!</p>
                  <p>Sua aula está marcada para amanhã!</p>
                  
                  <div class="info-box">
                    <p><strong>Instrutor:</strong> ${instructor.name}</p>
                    <p><strong>Data:</strong> ${formattedDate}</p>
                    <p><strong>Horário:</strong> ${formattedTime}</p>
                  </div>
                  
                  <p>Não se esqueça! Boa aula!</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });

      // Send reminder to instructor
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Instrutores na Direção <onboarding@resend.dev>",
          to: [instructor.email],
          subject: `Lembrete: aula com ${student.name} amanhã!`,
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
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⏰ Lembrete de Aula</h1>
                </div>
                <div class="content">
                  <p>Olá, <strong>${instructor.name}</strong>!</p>
                  <p>Você tem uma aula marcada para amanhã!</p>
                  
                  <div class="info-box">
                    <p><strong>Aluno:</strong> ${student.name}</p>
                    <p><strong>Data:</strong> ${formattedDate}</p>
                    <p><strong>Horário:</strong> ${formattedTime}</p>
                  </div>
                  
                  <p>Não se esqueça!</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });

      emailsSent.push(lesson.id);
      console.log(`Sent reminders for lesson ${lesson.id}`);
    }

    return new Response(
      JSON.stringify({ success: true, emailsSent: emailsSent.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-lesson-reminders:", error);
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
