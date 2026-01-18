-- Create student_pricing table for dynamic pricing configuration
CREATE TABLE IF NOT EXISTS student_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  booking_fee DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE student_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active student pricing"
  ON student_pricing FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can modify student pricing"
  ON student_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default student pricing
INSERT INTO student_pricing (config_key, booking_fee, description) VALUES
  ('default', 5.00, 'Taxa de serviço padrão por agendamento de aula')
ON CONFLICT (config_key) DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_student_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_pricing_updated_at
  BEFORE UPDATE ON student_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_student_pricing_updated_at();
