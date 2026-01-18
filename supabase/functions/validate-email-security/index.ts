import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetTime < now) {
    // Create new window
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count, resetIn: entry.resetTime - now };
}

function getClientIP(req: Request): string {
  // Check various headers for the real IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

// Disposable email domains blocklist
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'throwaway.email', 'fakeinbox.com', 'getnada.com', 'maildrop.cc',
  'yopmail.com', 'sharklasers.com', 'spam4.me', 'trashmail.com',
  'getairmail.com', 'mohmal.com', 'temp-mail.org', 'emailondeck.com',
  'guerrillamailblock.com', 'fakemailgenerator.com', 'discard.email',
  'mailnesia.com', 'mintemail.com', 'tempinbox.com', 'mt2009.com',
  'mytrashmail.com', 'spambox.us', 'throwawaymail.com', 'trash-mail.com',
]);

// Suspicious TLDs
const SUSPICIOUS_TLDS = new Set([
  '.zip', '.mov', '.top', '.click', '.xyz', '.club', '.work', 
  '.date', '.racing', '.win', '.stream', '.download', '.gdn', 
  '.loan', '.men', '.trade', '.bid', '.party', '.science',
  '.review', '.accountant', '.faith', '.cricket', '.webcam'
]);

// Known brand domains for typosquatting detection
const KNOWN_BRANDS = [
  'google', 'facebook', 'amazon', 'microsoft', 'apple', 'paypal',
  'netflix', 'instagram', 'twitter', 'linkedin', 'whatsapp', 
  'gmail', 'yahoo', 'hotmail', 'outlook', 'banco', 'bradesco',
  'itau', 'santander', 'caixa', 'nubank', 'inter', 'mercadolivre'
];

// Cache for domain validation results (TTL 24h)
const domainCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface ValidationResult {
  email: string;
  status: 'PERMITIDO' | 'DESAFIO' | 'BLOQUEADO';
  score_risco: number;
  motivos: string[];
  dominio: string;
  mx_valido: boolean;
  idade_dominio_dias: number | null;
  reputacao: {
    virustotal: string;
    abuseipdb: string;
  };
  acao_recomendada: string;
}

function logStep(step: string, details?: any) {
  console.log(`[EMAIL-SECURITY] ${step}`, details ? JSON.stringify(details) : '');
}

// RFC 5322 compliant email regex
function isValidEmailSyntax(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

function extractDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

function isDisposableEmail(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain);
}

function hasSuspiciousTLD(domain: string): boolean {
  return Array.from(SUSPICIOUS_TLDS).some(tld => domain.endsWith(tld));
}

function checkTyposquatting(domain: string): { isTyposquat: boolean; similarTo?: string } {
  const domainName = domain.split('.')[0].toLowerCase();
  
  for (const brand of KNOWN_BRANDS) {
    if (domainName === brand) continue; // Exact match is fine
    
    // Check Levenshtein distance
    const distance = levenshteinDistance(domainName, brand);
    if (distance <= 2 && distance > 0) {
      return { isTyposquat: true, similarTo: brand };
    }
    
    // Check for common typosquatting patterns
    const patterns = [
      brand.replace('o', '0'),
      brand.replace('i', '1'),
      brand.replace('l', '1'),
      brand.replace('e', '3'),
      brand + 'login',
      brand + 'secure',
      brand + 'support',
      'my' + brand,
      brand + 'oficial',
    ];
    
    if (patterns.includes(domainName)) {
      return { isTyposquat: true, similarTo: brand };
    }
  }
  
  return { isTyposquat: false };
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

function hasExcessiveNumbersOrHyphens(domain: string): boolean {
  const domainName = domain.split('.')[0];
  const numbers = (domainName.match(/\d/g) || []).length;
  const hyphens = (domainName.match(/-/g) || []).length;
  
  return numbers >= 3 || hyphens >= 2 || (numbers + hyphens >= 4);
}

async function checkMXRecords(domain: string): Promise<boolean> {
  try {
    // Using DNS over HTTPS (Google Public DNS)
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.Answer && data.Answer.length > 0;
  } catch (error) {
    logStep('MX check error', { domain, error: String(error) });
    return false; // Fail open for MX check
  }
}

async function checkVirusTotal(domain: string): Promise<{ reputation: string; score: number }> {
  const apiKey = Deno.env.get('VIRUSTOTAL_API_KEY');
  if (!apiKey) {
    logStep('VirusTotal API key not configured');
    return { reputation: 'não verificado', score: 0 };
  }

  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/domains/${domain}`, {
      headers: { 'x-apikey': apiKey }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { reputation: 'desconhecido', score: 5 }; // Unknown domain adds small risk
      }
      return { reputation: 'erro na verificação', score: 0 };
    }

    const data = await response.json();
    const stats = data.data?.attributes?.last_analysis_stats || {};
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;

    if (malicious > 0) {
      return { reputation: `malicioso (${malicious} detecções)`, score: 40 + (malicious * 5) };
    } else if (suspicious > 0) {
      return { reputation: `suspeito (${suspicious} detecções)`, score: 20 + (suspicious * 5) };
    }
    
    return { reputation: 'limpo', score: 0 };
  } catch (error) {
    logStep('VirusTotal error', { domain, error: String(error) });
    return { reputation: 'erro na verificação', score: 0 };
  }
}

async function checkAbuseIPDB(domain: string): Promise<{ reputation: string; score: number }> {
  const apiKey = Deno.env.get('ABUSEIPDB_API_KEY');
  if (!apiKey) {
    logStep('AbuseIPDB API key not configured');
    return { reputation: 'não verificado', score: 0 };
  }

  try {
    // First, resolve domain to IP
    const dnsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    
    if (!dnsResponse.ok) {
      return { reputation: 'não resolvido', score: 5 };
    }
    
    const dnsData = await dnsResponse.json();
    const ip = dnsData.Answer?.[0]?.data;
    
    if (!ip) {
      return { reputation: 'sem IP', score: 5 };
    }

    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
      headers: {
        'Key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return { reputation: 'erro na verificação', score: 0 };
    }

    const data = await response.json();
    const abuseScore = data.data?.abuseConfidenceScore || 0;

    if (abuseScore >= 75) {
      return { reputation: `alto risco (${abuseScore}%)`, score: 30 };
    } else if (abuseScore >= 25) {
      return { reputation: `risco moderado (${abuseScore}%)`, score: 15 };
    }
    
    return { reputation: `baixo risco (${abuseScore}%)`, score: 0 };
  } catch (error) {
    logStep('AbuseIPDB error', { domain, error: String(error) });
    return { reputation: 'erro na verificação', score: 0 };
  }
}

async function checkDomainAge(domain: string): Promise<number | null> {
  // Using RDAP for domain age (public, free)
  try {
    // Try different RDAP servers
    const rdapServers = [
      `https://rdap.registro.br/domain/${domain}`,
      `https://rdap.org/domain/${domain}`,
    ];

    for (const rdapUrl of rdapServers) {
      try {
        const response = await fetch(rdapUrl, {
          headers: { 'Accept': 'application/rdap+json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          const events = data.events || [];
          const registrationEvent = events.find((e: any) => e.eventAction === 'registration');
          
          if (registrationEvent?.eventDate) {
            const registrationDate = new Date(registrationEvent.eventDate);
            const now = new Date();
            const ageDays = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
            return ageDays;
          }
        }
      } catch {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    logStep('Domain age check error', { domain, error: String(error) });
    return null;
  }
}

function getCachedResult(domain: string): ValidationResult | null {
  const cached = domainCache.get(domain);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    logStep('Cache hit', { domain });
    return cached.result;
  }
  return null;
}

function setCachedResult(domain: string, result: ValidationResult): void {
  domainCache.set(domain, { result, timestamp: Date.now() });
}

async function validateEmail(email: string): Promise<ValidationResult> {
  const motivos: string[] = [];
  let scoreRisco = 0;
  
  const domain = extractDomain(email);
  
  // Check cache first
  const cached = getCachedResult(domain);
  if (cached) {
    return { ...cached, email }; // Update email in cached result
  }

  logStep('Starting validation', { email, domain });

  // 1. Syntactic validation
  if (!isValidEmailSyntax(email)) {
    return {
      email,
      status: 'BLOQUEADO',
      score_risco: 100,
      motivos: ['Formato de email inválido'],
      dominio: domain,
      mx_valido: false,
      idade_dominio_dias: null,
      reputacao: { virustotal: 'não verificado', abuseipdb: 'não verificado' },
      acao_recomendada: 'Corrija o formato do email'
    };
  }

  // 2. Disposable email check
  if (isDisposableEmail(domain)) {
    motivos.push('Email descartável detectado');
    scoreRisco += 60;
  }

  // 3. Suspicious TLD check
  if (hasSuspiciousTLD(domain)) {
    motivos.push('TLD suspeito');
    scoreRisco += 15;
  }

  // 4. Typosquatting check
  const typosquatResult = checkTyposquatting(domain);
  if (typosquatResult.isTyposquat) {
    motivos.push(`Possível typosquatting (similar a ${typosquatResult.similarTo})`);
    scoreRisco += 25;
  }

  // 5. Excessive numbers/hyphens check
  if (hasExcessiveNumbersOrHyphens(domain)) {
    motivos.push('Domínio com padrão suspeito (muitos números ou hífens)');
    scoreRisco += 10;
  }

  // 6. MX Records check
  const mxValid = await checkMXRecords(domain);
  if (!mxValid) {
    motivos.push('Domínio sem registros MX válidos');
    scoreRisco += 30;
  }

  // 7. Domain age check
  const domainAge = await checkDomainAge(domain);
  if (domainAge !== null && domainAge < 30) {
    motivos.push(`Domínio muito recente (${domainAge} dias)`);
    scoreRisco += 25;
  }

  // 8. VirusTotal check
  const vtResult = await checkVirusTotal(domain);
  scoreRisco += vtResult.score;
  if (vtResult.score > 0) {
    motivos.push(`VirusTotal: ${vtResult.reputation}`);
  }

  // 9. AbuseIPDB check
  const abuseResult = await checkAbuseIPDB(domain);
  scoreRisco += abuseResult.score;
  if (abuseResult.score > 0) {
    motivos.push(`AbuseIPDB: ${abuseResult.reputation}`);
  }

  // Cap score at 100
  scoreRisco = Math.min(scoreRisco, 100);

  // Determine status based on score
  let status: 'PERMITIDO' | 'DESAFIO' | 'BLOQUEADO';
  let acaoRecomendada: string;

  if (scoreRisco >= 60) {
    status = 'BLOQUEADO';
    acaoRecomendada = 'Email bloqueado por segurança. Use outro email.';
  } else if (scoreRisco >= 30) {
    status = 'DESAFIO';
    acaoRecomendada = 'Verificação adicional necessária (CAPTCHA/MFA)';
  } else {
    status = 'PERMITIDO';
    acaoRecomendada = 'Prosseguir com autenticação normal';
  }

  const result: ValidationResult = {
    email,
    status,
    score_risco: scoreRisco,
    motivos: motivos.length > 0 ? motivos : ['Nenhum problema detectado'],
    dominio: domain,
    mx_valido: mxValid,
    idade_dominio_dias: domainAge,
    reputacao: {
      virustotal: vtResult.reputation,
      abuseipdb: abuseResult.reputation
    },
    acao_recomendada: acaoRecomendada
  };

  // Cache result
  setCachedResult(domain, result);

  logStep('Validation complete', { email, status, scoreRisco });

  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP);

  // Add rate limit headers to all responses
  const rateLimitHeaders = {
    ...corsHeaders,
    'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
  };

  if (!rateLimit.allowed) {
    logStep('Rate limit exceeded', { ip: clientIP, resetIn: rateLimit.resetIn });
    return new Response(
      JSON.stringify({ 
        error: 'Muitas requisições. Tente novamente em alguns segundos.',
        retry_after_seconds: Math.ceil(rateLimit.resetIn / 1000)
      }),
      { 
        status: 429, 
        headers: { ...rateLimitHeaders, 'Content-Type': 'application/json', 'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString() } 
      }
    );
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await validateEmail(email.trim().toLowerCase());

    // Log to security_logs for SOC/SIEM
    if (result.status !== 'PERMITIDO') {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          await fetch(`${supabaseUrl}/rest/v1/security_logs`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              event_type: `email_validation_${result.status.toLowerCase()}`,
              email: email,
              ip_address: clientIP,
              details: {
                score: result.score_risco,
                motivos: result.motivos,
                dominio: result.dominio,
                reputacao: result.reputacao
              }
            })
          });
        }
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('Request error', { error: String(error) });
    return new Response(
      JSON.stringify({ error: 'Erro interno na validação' }),
      { status: 500, headers: { ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
