
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      // Supabase API URL - Env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - Env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // 1. Fetch all public instructors
    const { data: instructors, error } = await supabaseClient
      .from('instructors')
      .select('id, user_id, updated_at')
      .eq('is_verified', true)
      
    if (error) throw error

    // 2. Base URL of the frontend
    const baseUrl = 'https://instrutoresnadirecao.com.br' // Replace with actual domain or env var if needed

    // 3. Static routes
    const staticRoutes = [
      '',
      '/instrutores',
      '/como-funciona',
      '/faq',
      '/login',
      '/termos',
      '/privacidade'
    ]

    // 4. Generate XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

    // Add static routes
    staticRoutes.forEach(route => {
      xml += `
  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`
    })

    // Add dynamic instructor routes
    instructors?.forEach(instructor => {
      xml += `
  <url>
    <loc>${baseUrl}/instrutor/${instructor.user_id}</loc> 
    <lastmod>${new Date(instructor.updated_at || new Date()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`
    })

    xml += `
</urlset>`

    return new Response(xml, {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/xml' 
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
