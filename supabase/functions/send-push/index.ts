
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from "https://esm.sh/web-push@3.6.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { user_id, title, message } = await req.json()

    if (!user_id || !title || !message) {
      throw new Error('Missing required fields: user_id, title, message')
    }

    // Configure Web Push
    // NOTE: USER MUST SET THESE ENV VARS IN SUPABASE DASHBOARD
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const adminEmail = 'mailto:admin@instrutoresnadirecao.com.br'

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured in Edge Function')
    }

    webpush.setVapidDetails(
      adminEmail,
      vapidPublicKey,
      vapidPrivateKey
    )

    // Fetch user's subscriptions
    const { data: subscriptions, error: dbError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)

    if (dbError) throw dbError

    const results = await Promise.all(subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }
        
        await webpush.sendNotification(pushSubscription, JSON.stringify({
          title,
          body: message
        }))
        return { status: 'fulfilled', id: sub.id }
      } catch (error) {
        // If 410 Gone, delete connection
        if (error.statusCode === 410) {
           await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id)
        }
        return { status: 'rejected', error, id: sub.id }
      }
    }))

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
