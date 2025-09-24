-- Create timeline_events table for medication scanning
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  details text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own timeline events" 
ON public.timeline_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own timeline events" 
ON public.timeline_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline events" 
ON public.timeline_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeline events" 
ON public.timeline_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_timeline_events_updated_at
BEFORE UPDATE ON public.timeline_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();