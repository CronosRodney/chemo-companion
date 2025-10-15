-- Enable REPLICA IDENTITY FULL for reminders table to support realtime updates
ALTER TABLE public.reminders REPLICA IDENTITY FULL;

-- Add reminders table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;

-- Enable REPLICA IDENTITY FULL for user_stats table to support realtime updates
ALTER TABLE public.user_stats REPLICA IDENTITY FULL;

-- Add user_stats table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stats;