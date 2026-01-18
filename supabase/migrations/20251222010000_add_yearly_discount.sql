-- Add yearly discount field to pricing_plans
ALTER TABLE pricing_plans 
ADD COLUMN IF NOT EXISTS yearly_discount DECIMAL(5,4) DEFAULT 0.15;

-- Update existing plans with yearly discount
UPDATE pricing_plans 
SET yearly_discount = 0.15 
WHERE yearly_discount IS NULL;
