
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'BOARD', 'MANAGER', 'SALESPERSON')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Create stores table
CREATE TABLE public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create store assignments table
CREATE TABLE public.user_stores (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, store_id)
);

-- Create products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT NOT NULL,
  description TEXT NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create customer interactions table
CREATE TABLE public.interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Closed', 'Quoted', 'Lost')),
  reason TEXT CHECK (reason IN ('Lack of product', 'Stock Error', 'Delay', 'Price', 'Other')),
  monetary_value DECIMAL(10,2),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create interaction products relationship table
CREATE TABLE public.interaction_products (
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  is_custom BOOLEAN DEFAULT FALSE,
  custom_description TEXT,
  PRIMARY KEY (interaction_id, product_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_products ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles if ADMIN or BOARD" ON public.profiles
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD') OR 
    id = auth.uid()
  );

CREATE POLICY "Only ADMIN and BOARD can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD'));

CREATE POLICY "Only ADMIN and BOARD can update profiles" ON public.profiles
  FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD'));

-- RLS Policies for stores
CREATE POLICY "Users can view stores" ON public.stores
  FOR SELECT USING (true);

CREATE POLICY "Only ADMIN and BOARD can manage stores" ON public.stores
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD'));

-- RLS Policies for user_stores
CREATE POLICY "Users can view store assignments" ON public.user_stores
  FOR SELECT USING (true);

CREATE POLICY "Only ADMIN and BOARD can manage store assignments" ON public.user_stores
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD'));

-- RLS Policies for products (global access for reading, restricted for writing)
CREATE POLICY "All authenticated users can view products" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only ADMIN and BOARD can manage products" ON public.products
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD'));

-- RLS Policies for interactions
CREATE POLICY "Users can view own interactions or all if ADMIN/BOARD" ON public.interactions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD')
  );

CREATE POLICY "Users can insert own interactions" ON public.interactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own interactions or all if ADMIN/BOARD" ON public.interactions
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD')
  );

-- RLS Policies for interaction_products
CREATE POLICY "Users can view interaction products based on interaction access" ON public.interaction_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.interactions 
      WHERE id = interaction_id AND (
        user_id = auth.uid() OR 
        public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD')
      )
    )
  );

CREATE POLICY "Users can manage interaction products for own interactions" ON public.interaction_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.interactions 
      WHERE id = interaction_id AND (
        user_id = auth.uid() OR 
        public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD')
      )
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'ADMIN'
      ELSE 'SALESPERSON'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default admin user (will be handled by the application)
-- The trigger will create the profile automatically

-- Create storage bucket for product uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', false);

-- Storage policies for product uploads
CREATE POLICY "Only ADMIN and BOARD can upload products" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND 
    public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD')
  );

CREATE POLICY "Only ADMIN and BOARD can view product uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'products' AND 
    public.get_user_role(auth.uid()) IN ('ADMIN', 'BOARD')
  );
