-- Remover política de UPDATE em doctor_notes para garantir imutabilidade
-- As notas clínicas NÃO podem ser editadas após criação (compliance clínico)

-- Primeiro, remover a política ALL que permite UPDATE
DROP POLICY IF EXISTS "Doctors can manage their notes" ON public.doctor_notes;

-- Criar políticas específicas para INSERT, SELECT e DELETE (sem UPDATE)
CREATE POLICY "Doctors can view their notes" 
ON public.doctor_notes 
FOR SELECT 
USING (auth.uid() = doctor_user_id);

CREATE POLICY "Doctors can create notes" 
ON public.doctor_notes 
FOR INSERT 
WITH CHECK (auth.uid() = doctor_user_id);

CREATE POLICY "Doctors can delete their notes" 
ON public.doctor_notes 
FOR DELETE 
USING (auth.uid() = doctor_user_id);

-- Manter política de visualização para pacientes
-- (já existe: "Patients can view their notes")