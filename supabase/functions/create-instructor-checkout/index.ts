import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;
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

// Plan configuration
const PLANS = {
  essencial: {
    priceId: "price_1ShfxNRtwHJgDsfmTtQ5zz6U",
    name: "Plano Essencial",
  },
  destaque: {
    priceId: "price_1ShfxaRtwHJgDsfmMgQWRc3S",
    name: "Plano Destaque",
  },
  elite: {
    priceId: "price_1ShfxlRtwHJgDsfm3zHteQrS",
    name: "Plano Elite",
  },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-INSTRUCTOR-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Pre-auth rate limit by IP
    const ipId = getClientIdentifier(req);
    const ipRateLimit = checkRateLimit(ipId);
    
    if (!ipRateLimit.allowed) {
      logStep("Rate limit exceeded", { identifier: ipId });
      
      // Log rate limit event to database
      try {
        await supabaseClient.rpc('log_security_event', {
          p_event_type: 'rate_limit_exceeded',
          p_ip_address: ipId,
          p_details: { function: 'create-instructor-checkout', client_id: ipId }
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { email: user.email });

    const { planType } = await req.json();
    if (!planType || !PLANS[planType as keyof typeof PLANS]) {
      throw new Error("Invalid plan type");
    }

    const plan = PLANS[planType as keyof typeof PLANS];
    logStep("Plan selected", { planType, priceId: plan.priceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing local customer ID
    const { data: localSub } = await supabaseClient
      .from("instructor_subscriptions")
      .select("stripe_customer_id")
      .eq("instructor_id", user.id) // Assuming instructor_id is the same as user.id (needs verification, but usually is for 1:1)
      .single();
    
    // Actually, we should get the instructor ID properly first
    const { data: instructor } = await supabaseClient
        .from("instructors")
        .select("id")
        .eq("user_id", user.id)
        .single();
        
    if (!instructor) throw new Error("Instructor profile not found");

    const { data: effectiveSub } = await supabaseClient
      .from("instructor_subscriptions")
      .select("stripe_customer_id")
      .eq("instructor_id", instructor.id)
      .single();

    let customerId = effectiveSub?.stripe_customer_id;

    if (customerId) {
        logStep("Using existing local customer ID", { customerId });
    } else {
        // Fallback: Check Stripe by email
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
            logStep("Found existing Stripe customer by email", { customerId });
        } else {
            // Create new customer
            const newCustomer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    user_id: user.id,
                    instructor_id: instructor.id
                }
            });
            customerId = newCustomer.id;
            logStep("Created new Stripe customer", { customerId });
        }

        // SAVE IT to the database immediately
        await supabaseClient
            .from("instructor_subscriptions")
            .upsert({ 
                instructor_id: instructor.id,
                stripe_customer_id: customerId
            }, { onConflict: 'instructor_id' }); // Ensure we update or insert
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/instrutor/planos?success=true`,
      cancel_url: `${origin}/instrutor/planos?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

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
