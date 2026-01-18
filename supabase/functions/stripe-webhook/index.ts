import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2025-08-27.basil",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    let event;
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } else {
      event = JSON.parse(body);
    }

    console.log(`Event received: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const type = session.metadata?.type;

      if (userId && type === 'student_access') {
        const instructorId = session.metadata?.instructor_id;
        if (instructorId) {
            console.log(`Registering access for student ${userId} to instructor ${instructorId}`);
            await supabase.from('student_instructor_access').insert({
                student_id: userId,
                instructor_id: instructorId,
                paid_at: new Date().toISOString(),
                stripe_payment_id: session.id
            });
        }
      } else if (userId && session.mode === 'subscription') {
         // Instructor Subscription
         const planType = session.metadata?.plan_type || 'essencial'; // Default fallback
         
         console.log(`Activating subscription ${planType} for user ${userId}`);
         const { data: instructor } = await supabase
            .from('instructors')
            .select('id')
            .eq('user_id', userId)
            .single();
            
         if (instructor) {
            await supabase.from('instructor_subscriptions').upsert({
                instructor_id: instructor.id,
                plan_type: planType,
                is_active: true,
                stripe_customer_id: session.customer,
                stripe_subscription_id: session.subscription,
                subscription_started_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'instructor_id' });
         }
      }
    }
    
    // Handle other events like invoice.payment_succeeded to extend subscription
    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        if (invoice.subscription) {
            const { data: subscription } = await supabase
                .from('instructor_subscriptions')
                .select('*')
                .eq('stripe_subscription_id', invoice.subscription)
                .single();
                
            if (subscription) {
                // Extend subscription
                // We rely on 'is_active' mostly, but we could update period end
            }
        }
    }
    
    if (event.type === 'customer.subscription.deleted') {
         const subscriptionId = event.data.object.id;
         console.log(`Subscription deleted: ${subscriptionId}`);
         await supabase
            .from('instructor_subscriptions')
            .update({ is_active: false, plan_type: 'expired' })
            .eq('stripe_subscription_id', subscriptionId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Webhook Error: ${errorMessage}`);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
});
