-- Permitir usuário inserir seu próprio role 'patient' (apenas 1x)
-- Usa upsert com ON CONFLICT DO NOTHING para idempotência
CREATE POLICY "Users can set their own patient role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND role = 'patient'
  );