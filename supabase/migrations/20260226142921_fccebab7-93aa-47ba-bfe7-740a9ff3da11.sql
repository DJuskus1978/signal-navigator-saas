
-- Drop the overly permissive public insert policy
DROP POLICY "Anyone can submit contact messages" ON public.contact_messages;

-- Add user_id column to track who sent the message
ALTER TABLE public.contact_messages ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Only authenticated users can insert their own messages
CREATE POLICY "Authenticated users can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
