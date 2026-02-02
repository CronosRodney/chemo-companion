-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Clinic responsible are viewable by everyone" ON public.clinic_responsible;

-- Create policy: Users connected to the clinic can view responsible
CREATE POLICY "Users connected to clinic can view responsible"
ON public.clinic_responsible
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_clinic_connections ucc
    WHERE ucc.clinic_id = clinic_responsible.clinic_id
      AND ucc.user_id = auth.uid()
  )
);

-- Create policy: Doctors working at the clinic can view responsible
CREATE POLICY "Doctors at clinic can view responsible"
ON public.clinic_responsible
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.healthcare_professionals hp
    WHERE hp.clinic_id = clinic_responsible.clinic_id
      AND hp.user_id = auth.uid()
  )
);

-- Also restrict INSERT to authenticated users only (not public)
DROP POLICY IF EXISTS "Authenticated users can create clinic responsible" ON public.clinic_responsible;
CREATE POLICY "Authenticated users can create clinic responsible"
ON public.clinic_responsible
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also restrict UPDATE to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can update clinic responsible" ON public.clinic_responsible;
CREATE POLICY "Authenticated users can update clinic responsible"
ON public.clinic_responsible
FOR UPDATE
TO authenticated
USING (true);