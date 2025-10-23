-- Create table for wearable device connections
CREATE TABLE public.wearable_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google_fit', 'apple_health', 'fitbit', 'garmin')),
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_frequency_hours INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for wearable health metrics
CREATE TABLE public.wearable_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES public.wearable_connections(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  metric_time TIME,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('steps', 'heart_rate', 'sleep_hours', 'sleep_quality', 'calories_burned', 'body_temperature', 'blood_oxygen', 'resting_heart_rate', 'active_minutes')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  source_device TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for health alerts based on wearable data
CREATE TABLE public.wearable_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_id UUID REFERENCES public.wearable_metrics(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('fever', 'low_heart_rate', 'high_heart_rate', 'low_activity', 'poor_sleep', 'low_oxygen')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  threshold_value NUMERIC,
  actual_value NUMERIC NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearable_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearable_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wearable_connections
CREATE POLICY "Users can view their own wearable connections"
ON public.wearable_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wearable connections"
ON public.wearable_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wearable connections"
ON public.wearable_connections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wearable connections"
ON public.wearable_connections
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for wearable_metrics
CREATE POLICY "Users can view their own wearable metrics"
ON public.wearable_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wearable metrics"
ON public.wearable_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wearable metrics"
ON public.wearable_metrics
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for wearable_alerts
CREATE POLICY "Users can view their own wearable alerts"
ON public.wearable_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wearable alerts"
ON public.wearable_alerts
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_wearable_connections_user_id ON public.wearable_connections(user_id);
CREATE INDEX idx_wearable_connections_provider ON public.wearable_connections(provider);
CREATE INDEX idx_wearable_metrics_user_id ON public.wearable_metrics(user_id);
CREATE INDEX idx_wearable_metrics_date ON public.wearable_metrics(metric_date);
CREATE INDEX idx_wearable_metrics_type ON public.wearable_metrics(metric_type);
CREATE INDEX idx_wearable_alerts_user_id ON public.wearable_alerts(user_id);
CREATE INDEX idx_wearable_alerts_acknowledged ON public.wearable_alerts(acknowledged);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_wearable_connections_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wearable_connections_timestamp
BEFORE UPDATE ON public.wearable_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_wearable_connections_updated_at();

-- Create function to generate health alerts based on metrics
CREATE OR REPLACE FUNCTION public.check_health_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Check for fever (temperature > 38°C)
  IF NEW.metric_type = 'body_temperature' AND NEW.value >= 38.0 THEN
    INSERT INTO public.wearable_alerts (user_id, metric_id, alert_type, severity, threshold_value, actual_value, message)
    VALUES (
      NEW.user_id,
      NEW.id,
      'fever',
      CASE 
        WHEN NEW.value >= 39.0 THEN 'critical'
        WHEN NEW.value >= 38.5 THEN 'warning'
        ELSE 'info'
      END,
      38.0,
      NEW.value,
      'Temperatura corporal elevada detectada: ' || NEW.value || '°C. Considere entrar em contato com seu médico.'
    );
  END IF;

  -- Check for high heart rate (> 100 bpm at rest)
  IF NEW.metric_type = 'resting_heart_rate' AND NEW.value > 100 THEN
    INSERT INTO public.wearable_alerts (user_id, metric_id, alert_type, severity, threshold_value, actual_value, message)
    VALUES (
      NEW.user_id,
      NEW.id,
      'high_heart_rate',
      CASE 
        WHEN NEW.value > 120 THEN 'warning'
        ELSE 'info'
      END,
      100,
      NEW.value,
      'Frequência cardíaca em repouso elevada: ' || NEW.value || ' bpm.'
    );
  END IF;

  -- Check for low activity (< 2000 steps per day)
  IF NEW.metric_type = 'steps' AND NEW.value < 2000 THEN
    INSERT INTO public.wearable_alerts (user_id, metric_id, alert_type, severity, threshold_value, actual_value, message)
    VALUES (
      NEW.user_id,
      NEW.id,
      'low_activity',
      'info',
      2000,
      NEW.value,
      'Atividade física baixa hoje: ' || NEW.value || ' passos. Tente fazer caminhadas curtas se estiver se sentindo bem.'
    );
  END IF;

  -- Check for poor sleep (< 5 hours)
  IF NEW.metric_type = 'sleep_hours' AND NEW.value < 5 THEN
    INSERT INTO public.wearable_alerts (user_id, metric_id, alert_type, severity, threshold_value, actual_value, message)
    VALUES (
      NEW.user_id,
      NEW.id,
      'poor_sleep',
      CASE 
        WHEN NEW.value < 4 THEN 'warning'
        ELSE 'info'
      END,
      5,
      NEW.value,
      'Sono insuficiente detectado: ' || NEW.value || ' horas. O descanso é importante durante o tratamento.'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to check for health alerts on new metrics
CREATE TRIGGER check_health_alerts_on_insert
AFTER INSERT ON public.wearable_metrics
FOR EACH ROW
EXECUTE FUNCTION public.check_health_alerts();