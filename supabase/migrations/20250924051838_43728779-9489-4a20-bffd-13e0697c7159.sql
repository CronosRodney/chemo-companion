-- Create events table for patient event registration
CREATE TABLE public.user_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'general',
  severity INTEGER DEFAULT 1,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own events" 
ON public.user_events 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own events" 
ON public.user_events 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own events" 
ON public.user_events 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own events" 
ON public.user_events 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Add trigger for updated_at
CREATE TRIGGER update_user_events_updated_at
BEFORE UPDATE ON public.user_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();