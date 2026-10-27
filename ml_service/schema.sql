-- ============================================================================
-- FAIRWORK SETU: OFFICIAL SUPABASE POSTGRESQL SCHEMA DEFINITION
-- Execute this script in the Supabase SQL Editor (SQL Editor -> New Query)
-- ============================================================================

-- 1. PROFILES & PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(30) UNIQUE,
    email VARCHAR(120),
    full_name VARCHAR(120) NOT NULL,
    avatar_url TEXT,
    gender VARCHAR(30),
    city_key VARCHAR(80) NOT NULL DEFAULT 'cities.pune',
    work_type VARCHAR(60) NOT NULL DEFAULT 'driver',
    experience_years INT NOT NULL DEFAULT 1,
    availability VARCHAR(30) NOT NULL DEFAULT 'anytime',
    pay_min NUMERIC(10, 2) DEFAULT 400.00,
    pay_max NUMERIC(10, 2) DEFAULT 700.00,
    emergency_contact VARCHAR(40),
    savings_goal NUMERIC(12, 2) DEFAULT 5000.00,
    weekly_save_goal NUMERIC(12, 2) DEFAULT 350.00,
    preferred_language VARCHAR(10) DEFAULT 'hi',
    speech_rate NUMERIC(3, 2) DEFAULT 0.95,
    voice_silence_timeout INT DEFAULT 5,
    privacy_mask_earnings BOOLEAN DEFAULT FALSE,
    auto_readout BOOLEAN DEFAULT FALSE,
    expense_alerts BOOLEAN DEFAULT TRUE,
    skills TEXT DEFAULT '',
    custom_skills TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist in case table was created previously
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_skills TEXT DEFAULT '';

-- 2. TRANSACTIONS (INCOME & EXPENSES WITH OFFLINE IDEMPOTENCY)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_tx_id VARCHAR(80),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(60) NOT NULL,
    description TEXT DEFAULT '',
    work_ref VARCHAR(120),
    source VARCHAR(30) DEFAULT 'manual' CHECK (source IN ('manual', 'quick', 'voice')),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_client_tx UNIQUE (user_id, client_tx_id)
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_timestamp ON public.transactions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(user_id, category);

-- 3. WORKER SERVICE MARKETPLACE PROFILES
CREATE TABLE IF NOT EXISTS public.service_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name VARCHAR(120) NOT NULL,
    trade VARCHAR(80) NOT NULL,
    short_description TEXT,
    phone VARCHAR(30),
    indicative_price NUMERIC(10, 2) DEFAULT 250.00,
    pricing_type VARCHAR(40) DEFAULT 'visit_fee',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SERVICE BOOKINGS & REQUESTS
CREATE TABLE IF NOT EXISTS public.service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_address TEXT NOT NULL,
    service_trade VARCHAR(80) NOT NULL,
    service_description TEXT NOT NULL,
    booking_date VARCHAR(30) NOT NULL,
    time_slot VARCHAR(60) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'proposed', 'completed', 'cancelled')),
    estimated_price NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_worker ON public.service_bookings(worker_id, booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.service_bookings(customer_id);

-- 5. JOB APPLICATIONS
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(80) NOT NULL,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'interview_scheduled', 'accepted', 'rejected', 'withdrawn')),
    cover_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_applicant_job UNIQUE (applicant_id, job_id)
);

-- 6. HAQ SETU GRIEVANCE CASES
CREATE TABLE IF NOT EXISTS public.haq_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    case_number VARCHAR(60) UNIQUE NOT NULL,
    platform_name VARCHAR(80) NOT NULL,
    deactivation_reason VARCHAR(120),
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'resolved', 'closed')),
    incident_date VARCHAR(30),
    loss_of_income_est NUMERIC(10, 2),
    appeal_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. HEALTH SAVED ITEMS
CREATE TABLE IF NOT EXISTS public.saved_health_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL,
    item_type VARCHAR(40) NOT NULL,
    title VARCHAR(180) NOT NULL,
    notes TEXT,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_health_item UNIQUE (user_id, item_id)
);

-- 8. NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    browser_push_enabled BOOLEAN DEFAULT FALSE,
    android_native_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    vibration_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours_start VARCHAR(10) DEFAULT '22:00',
    quiet_hours_end VARCHAR(10) DEFAULT '07:00',
    category_money BOOLEAN DEFAULT TRUE,
    category_work BOOLEAN DEFAULT TRUE,
    category_health BOOLEAN DEFAULT TRUE,
    category_skills BOOLEAN DEFAULT TRUE,
    category_rights BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER (auth.users -> public.profiles)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        phone_number,
        full_name,
        city_key,
        work_type,
        created_at,
        updated_at
    )
    VALUES (
        new.id,
        new.email,
        new.phone,
        COALESCE(
            NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
            NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
            NULLIF(TRIM(split_part(new.email, '@', 1)), ''),
            'Setu Worker'
        ),
        'cities.pune',
        'driver',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
        updated_at = NOW();

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Protects direct Supabase client access)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haq_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_health_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and edit their own profile
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Transactions: Strict user isolation
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

-- Service Profiles: Public read, owner write
DROP POLICY IF EXISTS "Public can view service profiles" ON public.service_profiles;
CREATE POLICY "Public can view service profiles" ON public.service_profiles
    FOR SELECT USING (is_available = TRUE);

DROP POLICY IF EXISTS "Users can manage own service profile" ON public.service_profiles;
CREATE POLICY "Users can manage own service profile" ON public.service_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Bookings: Participants can access their bookings
DROP POLICY IF EXISTS "Participants can view and update bookings" ON public.service_bookings;
CREATE POLICY "Participants can view and update bookings" ON public.service_bookings
    FOR ALL USING (auth.uid() = worker_id OR auth.uid() = customer_id);

-- Job Applications: Owner access
DROP POLICY IF EXISTS "Applicants can manage own applications" ON public.job_applications;
CREATE POLICY "Applicants can manage own applications" ON public.job_applications
    FOR ALL USING (auth.uid() = applicant_id);

-- Grievance Cases: Owner access
DROP POLICY IF EXISTS "Users can manage own haq cases" ON public.haq_cases;
CREATE POLICY "Users can manage own haq cases" ON public.haq_cases
    FOR ALL USING (auth.uid() = user_id);

-- Saved Health Items: Owner access
DROP POLICY IF EXISTS "Users can manage own saved health items" ON public.saved_health_items;
CREATE POLICY "Users can manage own saved health items" ON public.saved_health_items
    FOR ALL USING (auth.uid() = user_id);

-- Notification Preferences: Owner access
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 9. ACCOUNT EXISTENCE VERIFICATION RPC (Publicly callable via Supabase client rpc)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_email_registered(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF email_to_check IS NULL OR length(trim(email_to_check)) = 0 THEN
        RETURN FALSE;
    END IF;

    -- Check auth.users table
    IF EXISTS (
        SELECT 1 FROM auth.users
        WHERE LOWER(email) = LOWER(TRIM(email_to_check))
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check public.profiles table
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE LOWER(email) = LOWER(TRIM(email_to_check))
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check authorized demo accounts
    IF LOWER(TRIM(email_to_check)) = 'sadia.sakharkar@cumminscollege.in' THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Grant EXECUTE permission to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.check_email_registered(text) TO anon, authenticated, service_role;
