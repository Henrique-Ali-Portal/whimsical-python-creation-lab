
-- First, let's ensure interactions table has store_id properly configured
-- and add RLS policies for role-based access

-- Enable RLS on interactions table if not already enabled
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view interactions based on role" ON public.interactions;
DROP POLICY IF EXISTS "Users can insert interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can view own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Managers can view store interactions" ON public.interactions;
DROP POLICY IF EXISTS "Admins can view all interactions" ON public.interactions;

-- Create comprehensive RLS policy for viewing interactions based on role
CREATE POLICY "Role-based interaction access" ON public.interactions
  FOR SELECT USING (
    CASE 
      -- SALESPERSON: can only see their own interactions
      WHEN public.get_user_role(auth.uid()) = 'SALESPERSON' THEN 
        user_id = auth.uid()
      -- MANAGER: can see interactions from their current store
      WHEN public.get_user_role(auth.uid()) = 'MANAGER' THEN 
        store_id IN (
          SELECT us.store_id 
          FROM public.user_stores us 
          WHERE us.user_id = auth.uid()
        )
      -- ADMIN and BOARD: can see all interactions
      WHEN public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD') THEN 
        true
      ELSE false
    END
  );

-- Create policy for inserting interactions (only SALESPERSON can create)
CREATE POLICY "Salesperson can create interactions" ON public.interactions
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) = 'SALESPERSON' AND
    user_id = auth.uid()
  );

-- Enable realtime for interactions table
ALTER TABLE public.interactions REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.interactions;
