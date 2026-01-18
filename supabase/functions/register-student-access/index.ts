import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REGISTER-STUDENT-ACCESS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { instructor_id } = await req.json();
    if (!instructor_id) throw new Error("instructor_id is required");
    logStep("Instructor ID received", { instructorId: instructor_id });

    // Verify instructor exists
    const { data: instructor, error: instructorError } = await supabaseAdmin
      .from("instructors")
      .select("id, name")
      .eq("id", instructor_id)
      .single();

    if (instructorError || !instructor) {
      throw new Error("Instructor not found");
    }
    logStep("Instructor verified", { instructorId: instructor.id, name: instructor.name });

    // Check if access already exists
    const { data: existingAccess } = await supabaseAdmin
      .from("student_instructor_access")
      .select("id")
      .eq("student_id", user.id)
      .eq("instructor_id", instructor_id)
      .maybeSingle();

    if (existingAccess) {
      logStep("Access already exists", { accessId: existingAccess.id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Acesso já registrado",
        alreadyExists: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Register access (no expiration for now)
    const { data: access, error: accessError } = await supabaseAdmin
      .from("student_instructor_access")
      .insert({
        student_id: user.id,
        instructor_id: instructor_id,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (accessError) {
      logStep("Error registering access", { error: accessError.message });
      throw new Error(`Failed to register access: ${accessError.message}`);
    }

    logStep("Access registered successfully", { accessId: access.id });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Acesso liberado com sucesso!",
      access: {
        id: access.id,
        instructor_name: instructor.name,
        paid_at: access.paid_at,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
