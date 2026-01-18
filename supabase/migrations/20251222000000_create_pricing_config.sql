-- Create pricing_plans table for dynamic pricing configuration
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  plan_slug TEXT NOT NULL UNIQUE,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5,4) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 1),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active pricing plans
CREATE POLICY "Anyone can view active pricing plans"
  ON pricing_plans
  FOR SELECT
  USING (is_active = true);

-- Only admins can modify pricing plans
CREATE POLICY "Only admins can modify pricing plans"
  ON pricing_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default pricing plans
INSERT INTO pricing_plans (plan_name, plan_slug, monthly_price, commission_rate, features, display_order) VALUES
  ('Plano Iniciante', 'essential', 0.00, 0.20, 
   '["20% de comissão por aula", "Visibilidade Padrão", "Agenda Online Completa", "Suporte via E-mail", "Selo Verificado Básico"]'::jsonb, 
   1),
  ('Plano Elite', 'pro', 59.90, 0.12, 
   '["12% de comissão por aula", "Visibilidade Alta (Topo das buscas)", "Agenda Online Completa", "Suporte WhatsApp Prioritário", "Selo Premium Gold"]'::jsonb, 
   2)
ON CONFLICT (plan_slug) DO NOTHING;

-- Create site_config table for other dynamic values
CREATE TABLE IF NOT EXISTS site_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies for site_config
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site config"
  ON site_config
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify site config"
  ON site_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default site config
INSERT INTO site_config (config_key, config_value, description) VALUES
  ('student_booking_fee', '{"amount": 5.00, "currency": "BRL"}'::jsonb, 'Taxa de serviço cobrada do aluno por agendamento')
ON CONFLICT (config_key) DO NOTHING;
