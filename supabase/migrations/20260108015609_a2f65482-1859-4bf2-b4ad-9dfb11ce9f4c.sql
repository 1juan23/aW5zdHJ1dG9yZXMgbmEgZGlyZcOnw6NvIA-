-- Create system_settings table for platform configuration
CREATE TABLE public.system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  booking_fee NUMERIC NOT NULL DEFAULT 5.00,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  allow_registrations BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view settings
CREATE POLICY "Admins can view system settings"
ON public.system_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update settings
CREATE POLICY "Admins can update system settings"
ON public.system_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings row
INSERT INTO public.system_settings (id, booking_fee, maintenance_mode, allow_registrations)
VALUES (1, 5.00, false, true)
ON CONFLICT (id) DO NOTHING;