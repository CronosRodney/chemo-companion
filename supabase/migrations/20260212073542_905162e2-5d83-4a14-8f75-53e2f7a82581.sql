CREATE POLICY "Users can delete their own medications"
ON public.user_medications
FOR DELETE
USING (auth.uid() = user_id);