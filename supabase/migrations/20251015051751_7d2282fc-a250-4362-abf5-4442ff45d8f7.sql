-- Add clinic_id column to user_medications table
ALTER TABLE user_medications 
ADD COLUMN clinic_id uuid REFERENCES clinics(id);

-- Create index for better performance
CREATE INDEX idx_user_medications_clinic_id ON user_medications(clinic_id);

-- Update RLS policy to allow clinic_id updates
DROP POLICY IF EXISTS "Users can create their own medications" ON user_medications;
CREATE POLICY "Users can create their own medications" 
ON user_medications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own medications" ON user_medications;
CREATE POLICY "Users can update their own medications" 
ON user_medications 
FOR UPDATE 
USING (auth.uid() = user_id);