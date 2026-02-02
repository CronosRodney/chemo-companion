-- Allow doctors to CREATE/EDIT/DELETE treatment data for connected patients
-- Note: patient is stored as treatment_plans.user_id (not patient_user_id)

-- treatment_plans
CREATE POLICY "Doctors can create connected patient treatment plans"
ON public.treatment_plans
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'doctor'::public.app_role)
  AND public.doctor_has_patient_access(auth.uid(), user_id)
);

CREATE POLICY "Doctors can update connected patient treatment plans"
ON public.treatment_plans
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor'::public.app_role)
  AND public.doctor_has_patient_access(auth.uid(), user_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'doctor'::public.app_role)
  AND public.doctor_has_patient_access(auth.uid(), user_id)
);

CREATE POLICY "Doctors can delete connected patient treatment plans"
ON public.treatment_plans
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor'::public.app_role)
  AND public.doctor_has_patient_access(auth.uid(), user_id)
);

-- treatment_drugs
CREATE POLICY "Doctors can manage drugs for connected patients"
ON public.treatment_drugs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.treatment_plans tp
    WHERE tp.id = treatment_drugs.treatment_plan_id
      AND public.doctor_has_patient_access(auth.uid(), tp.user_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.treatment_plans tp
    WHERE tp.id = treatment_drugs.treatment_plan_id
      AND public.doctor_has_patient_access(auth.uid(), tp.user_id)
  )
);

-- treatment_cycles
CREATE POLICY "Doctors can manage cycles for connected patients"
ON public.treatment_cycles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.treatment_plans tp
    WHERE tp.id = treatment_cycles.treatment_plan_id
      AND public.doctor_has_patient_access(auth.uid(), tp.user_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.treatment_plans tp
    WHERE tp.id = treatment_cycles.treatment_plan_id
      AND public.doctor_has_patient_access(auth.uid(), tp.user_id)
  )
);

-- cycle_support_prescriptions
CREATE POLICY "Doctors can manage support prescriptions for connected patients"
ON public.cycle_support_prescriptions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.treatment_cycles tc
    JOIN public.treatment_plans tp ON tp.id = tc.treatment_plan_id
    WHERE tc.id = cycle_support_prescriptions.cycle_id
      AND public.doctor_has_patient_access(auth.uid(), tp.user_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.treatment_cycles tc
    JOIN public.treatment_plans tp ON tp.id = tc.treatment_plan_id
    WHERE tc.id = cycle_support_prescriptions.cycle_id
      AND public.doctor_has_patient_access(auth.uid(), tp.user_id)
  )
);

-- cycle_administrations
CREATE POLICY "Doctors can manage administrations for connected patients"
ON public.cycle_administrations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.treatment_cycles tc
    JOIN public.treatment_plans tp ON tp.id = tc.treatment_plan_id
    WHERE tc.id = cycle_administrations.cycle_id
      AND public.doctor_has_patient_access(auth.uid(), tp.user_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.treatment_cycles tc
    JOIN public.treatment_plans tp ON tp.id = tc.treatment_plan_id
    WHERE tc.id = cycle_administrations.cycle_id
      AND public.doctor_has_patient_access(auth.uid(), tp.user_id)
  )
);
