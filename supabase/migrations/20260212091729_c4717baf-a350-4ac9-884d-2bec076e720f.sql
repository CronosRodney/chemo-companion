
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_json jsonb NOT NULL,
  clinical_state jsonb NOT NULL,
  clinical_state_hash text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights" ON public.ai_insights
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON public.ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights" ON public.ai_insights
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_insights_user_generated
  ON public.ai_insights(user_id, generated_at DESC);
