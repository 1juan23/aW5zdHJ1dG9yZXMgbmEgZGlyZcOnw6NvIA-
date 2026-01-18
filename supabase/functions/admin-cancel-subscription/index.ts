import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // 1. Verify Admin User
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) throw new Error("Unauthorized");

    // Check if user has admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error("Forbidden: Admin access required");

    // 2. Get Request Data
    const { instructorId, reason } = await req.json();
    if (!instructorId) throw new Error("Instructor ID is required");

    // 3. Get Subscription Details
    const { data: subscription } = await supabaseClient
      .from('instructor_subscriptions')
      .select('stripe_subscription_id')
      .eq('instructor_id', instructorId)
      .single();

    if (!subscription?.stripe_subscription_id) {
      throw new Error("No active subscription found for this instructor");
    }

    // 4. Cancel on Stripe
    try {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } catch (stripeError) {
        console.error("Stripe cancellation error:", stripeError);
        // Continue to update DB even if Stripe fails (e.g. already canceled)
    }

    // 5. Update Database
    const { error: updateError } = await supabaseClient
      .from('instructor_subscriptions')
      .update({ 
        status: 'canceled', 
        current_period_end: new Date().toISOString() // End immediately
      })
      .eq('instructor_id', instructorId);

    if (updateError) throw updateError;

    // 6. Log Action
    await supabaseClient.from('admin_action_logs').insert({
      action: 'cancel_subscription',
      admin_user_id: user.id,
      target_instructor_id: instructorId,
      new_status: 'canceled',
      notes: reason || "Cancelled by admin"
    });

    return new Response(
      JSON.stringify({ message: "Subscription cancelled successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
