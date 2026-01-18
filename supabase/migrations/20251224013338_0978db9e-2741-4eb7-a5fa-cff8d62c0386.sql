-- Enable realtime for lessons table to receive status change notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons;