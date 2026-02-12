
-- Allow doctors to view their connected patients' external connections (read-only)
CREATE POLICY "Doctors can view connected patient connections"
ON public.external_connections
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.doctor_has_patient_access(auth.uid(), user_id)
);
