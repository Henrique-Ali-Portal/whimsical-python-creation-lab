
-- Create a function to delete a user and all associated records
CREATE OR REPLACE FUNCTION public.delete_user_cascade(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the current user's role
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
  
  -- Only ADMIN can delete users
  IF current_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Only ADMIN users can delete other users';
  END IF;
  
  -- Delete associated records (cascading deletes)
  DELETE FROM public.interaction_products 
  WHERE interaction_id IN (
    SELECT id FROM public.interactions WHERE user_id = target_user_id
  );
  
  DELETE FROM public.interactions WHERE user_id = target_user_id;
  DELETE FROM public.user_stores WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Note: auth.users deletion requires admin privileges via service role
END;
$$;

-- Create a function to validate role updates
CREATE OR REPLACE FUNCTION public.can_update_role(
  current_user_id UUID,
  target_user_id UUID,
  new_role TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
  target_user_role TEXT;
BEGIN
  -- Get roles
  SELECT role INTO current_user_role FROM public.profiles WHERE id = current_user_id;
  SELECT role INTO target_user_role FROM public.profiles WHERE id = target_user_id;
  
  -- ADMIN can change any role to any role
  IF current_user_role = 'ADMIN' THEN
    RETURN true;
  END IF;
  
  -- BOARD can only promote SALESPERSON to MANAGER
  IF current_user_role = 'BOARD' THEN
    RETURN (target_user_role = 'SALESPERSON' AND new_role = 'MANAGER');
  END IF;
  
  -- Others cannot update roles
  RETURN false;
END;
$$;

-- Create a function to validate store updates
CREATE OR REPLACE FUNCTION public.can_update_store(current_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  SELECT role INTO current_user_role FROM public.profiles WHERE id = current_user_id;
  RETURN current_user_role IN ('ADMIN', 'BOARD');
END;
$$;

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Only ADMIN and BOARD can update profiles" ON public.profiles;

CREATE POLICY "Users can update profiles with role validation" ON public.profiles
  FOR UPDATE USING (
    -- Users can update their own profile (except role)
    (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())) OR
    -- ADMIN/BOARD can update others with validation
    (public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD'))
  );

-- Add check constraint to prevent invalid role transitions
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_valid_role_transition;

-- Create Edge Function for user deletion (handles auth.users deletion)
-- This will be created in the lov-code block
