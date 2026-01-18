import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

const getClientIdentifier = (req: Request): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `ip:${ip}`;
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Rate limiting check
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId);
    
    if (!rateLimit.allowed) {
      logStep("Rate limit exceeded", { identifier: clientId });
      
      try {
        await supabaseAdmin.rpc('log_security_event', {
          p_event_type: 'rate_limit_exceeded',
          p_ip_address: clientId,
          p_details: { function: 'create-payment', client_id: clientId }
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Faça login para continuar");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) throw new Error("Faça login para continuar");
    logStep("User authenticated", { email: user.email, userId: user.id });

    // Parse request body with explicit typing
    interface PaymentBody {
      instructorId?: string;
      instructor_id?: string;
      paymentType?: string;
    }
    
    let body: PaymentBody = {};
    try {
      body = await req.json() as PaymentBody;
    } catch {
      // No body provided
    }
    
    const instructorId = body.instructorId || body.instructor_id;
    const paymentType = body.paymentType || 'student_access'; // Default to original behavior

    logStep("Request params", { instructorId, paymentType });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Build success URL
    const successUrl = new URL(`${origin}/pagamento-sucesso`);
    successUrl.searchParams.set('type', paymentType);
    if (instructorId) {
      successUrl.searchParams.set('instructor_id', instructorId);
    }
    
    let lineItems = [];
    
    if (paymentType === 'booking') {
        // R$ 5.00 Booking Fee
        lineItems = [{
            price_data: {
                currency: 'brl',
                product_data: {
                    name: 'Taxa de Agendamento',
                    description: 'Taxa para agendar aula prática',
                },
                unit_amount: 500, // 500 cents = R$ 5.00
            },
            quantity: 1,
        }];
    } else {
        // Default Student Access
        lineItems = [{
          price: "price_1ShfiHRtwHJgDsfm8O9NiBZb", // Original Access Fee
          quantity: 1,
        }];
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl.toString(),
      cancel_url: `${origin}/pagamento-cancelado`,
      metadata: {
        user_id: user.id,
        instructor_id: instructorId || '',
        type: paymentType,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, instructorId });

    return new Response(JSON.stringify({ url: session.url }), {
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
