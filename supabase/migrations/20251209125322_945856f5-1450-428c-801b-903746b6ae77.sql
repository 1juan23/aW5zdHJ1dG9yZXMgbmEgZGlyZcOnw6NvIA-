-- Create enum for user roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for instructor status
DO $$ BEGIN
    CREATE TYPE public.instructor_status AS ENUM ('pending', 'approved', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table (CRITICAL: roles must be in separate table for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table for all users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create instructors table
CREATE TABLE IF NOT EXISTS public.instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    neighborhoods TEXT,
    experience TEXT,
    specialties TEXT[] DEFAULT '{}',
    bio TEXT,
    price NUMERIC(10,2),
    avatar_url TEXT,
    status instructor_status NOT NULL DEFAULT 'pending',
    rating NUMERIC(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);



-- Ensure ALL columns exist (Handle partially existing tables)
DO $$ BEGIN
    -- Profiles
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

    -- Instructors
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS state TEXT;
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS neighborhoods TEXT;
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS experience TEXT;
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS status instructor_status NOT NULL DEFAULT 'pending';
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0;
    ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
    
    -- Constraints
    BEGIN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.instructors ADD CONSTRAINT instructors_user_id_unique UNIQUE (user_id);
    EXCEPTION WHEN duplicate_object THEN NULL; END;

EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
DO $$ BEGIN
  CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for profiles
DO $$ BEGIN
  CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for instructors
DO $$ BEGIN
  CREATE POLICY "Anyone can view approved instructors"
  ON public.instructors FOR SELECT
  USING (status = 'approved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can view all instructors"
  ON public.instructors FOR SELECT
  TO authenticated
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Instructors can update own profile"
  ON public.instructors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Instructors can insert own profile"
  ON public.instructors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all instructors"
  ON public.instructors FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_instructors_updated_at ON public.instructors;
CREATE TRIGGER update_instructors_updated_at
BEFORE UPDATE ON public.instructors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile and role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, name, email, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Add role based on user_type metadata
    IF NEW.raw_user_meta_data ->> 'user_type' = 'instructor' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'instructor')
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'student')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();