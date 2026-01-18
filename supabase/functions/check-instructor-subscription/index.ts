import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_TO_PLAN: Record<string, string> = {
  "price_1ShfxNRtwHJgDsfmTtQ5zz6U": "essencial",
  "price_1ShfxaRtwHJgDsfmMgQWRc3S": "destaque",
  "price_1ShfxlRtwHJgDsfm3zHteQrS": "elite",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-INSTRUCTOR-SUBSCRIPTION] ${step}${detailsStr}`);
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

    // Get instructor
    const { data: instructor, error: instructorError } = await supabaseClient
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (instructorError || !instructor) {
      logStep("No instructor found");
      return new Response(JSON.stringify({ 
        isInstructor: false,
        subscription: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Instructor found", { instructorId: instructor.id });

    // Get local subscription record
    const { data: localSub } = await supabaseClient
      .from("instructor_subscriptions")
      .select("*")
      .eq("instructor_id", instructor.id)
      .single();

    // Check Stripe for active subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 10 }); // Check up to 10 customers

    let stripeSubscription = null;
    let stripeCustomerId = localSub?.stripe_customer_id;

    // STRATEGY 1: Check by stored Customer ID (Most Reliable)
    if (stripeCustomerId) {
        logStep("Checking stored customer ID", { stripeCustomerId });
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: "all",
            limit: 5,
        });

        const activeSub = subscriptions.data.find((sub: { status: string }) => 
            sub.status === 'active' || sub.status === 'trialing'
        );

        if (activeSub) {
             stripeSubscription = activeSub;
             logStep("Found active subscription via stored ID", { id: activeSub.id });
        }
    }

    // STRATEGY 2: Fallback to Email Search (if Strategy 1 failed)
    if (!stripeSubscription) {
        logStep("Fallback to email search");
        const customers = await stripe.customers.list({ email: user.email, limit: 10 });
        
        // Iterate through all found customers
        customerLoop: for (const customer of customers.data) {
            // Check this customer's subscriptions
            const subscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                status: "all", 
                limit: 20, 
            });

            const activeSub = subscriptions.data.find((sub: { status: string }) => 
                sub.status === 'active' || sub.status === 'trialing'
            );

            if (activeSub) {
                stripeSubscription = activeSub;
                stripeCustomerId = customer.id;
                logStep("Found active subscription via Email Fallback", { customerId: customer.id });
                break customerLoop; 
            }
        }
    }

    // If active Stripe subscription found, use it (and sync DB)
    if (stripeSubscription) {
        const priceId = stripeSubscription.items.data[0].price.id;
        const planType = PRICE_TO_PLAN[priceId] || "essencial";
        const subscriptionEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString();
        
        logStep("Active subscription found", { planType, subscriptionEnd, customerId: stripeCustomerId });

        // Update local record if needed
        await supabaseClient
          .from("instructor_subscriptions")
          .update({
            plan_type: planType,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscription.id,
            subscription_started_at: new Date(stripeSubscription.start_date * 1000).toISOString(),
            subscription_ends_at: subscriptionEnd,
            is_active: true,
          })
          .eq("instructor_id", instructor.id);

        return new Response(JSON.stringify({
          isInstructor: true,
          subscription: {
            planType,
            isActive: true,
            subscriptionEnd,
            stripeSubscriptionId: stripeSubscription.id,
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
    }

    // If NO active Stripe subscription, Check if trial is valid
    if (localSub?.plan_type === "trial") {
      const trialEndsAt = new Date(localSub.trial_ends_at);
      const now = new Date();
      
      if (now < trialEndsAt) {
        const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        logStep("Trial still active", { daysRemaining });
        
        return new Response(JSON.stringify({
          isInstructor: true,
          subscription: {
            planType: "trial",
            isActive: true,
            trialEndsAt: localSub.trial_ends_at,
            daysRemaining,
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // If neither Stripe nor Trial is active -> Expired
    logStep("No active subscription or trial");
    return new Response(JSON.stringify({
        isInstructor: true,
        subscription: {
          planType: localSub?.plan_type === "trial" ? "expired" : (localSub?.plan_type || "expired"),
          isActive: false,
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
