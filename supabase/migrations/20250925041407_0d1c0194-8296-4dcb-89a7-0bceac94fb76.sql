-- Create RLS policies to allow authenticated users to insert and manage clinic data
CREATE POLICY "Authenticated users can create clinics" 
ON public.clinics 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clinics" 
ON public.clinics 
FOR UPDATE 
TO authenticated
USING (true);

-- Also add INSERT policy for clinic_responsible table
CREATE POLICY "Authenticated users can create clinic responsible" 
ON public.clinic_responsible 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clinic responsible" 
ON public.clinic_responsible 
FOR UPDATE 
TO authenticated
USING (true);