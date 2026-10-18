-- ============================================================================
-- FAIRWORK SETU: IDEMPOTENT DEMO ACCOUNT PROVISIONING & DATA SEEDING (SUPABASE)
-- Execute in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================
-- Authorized Test Users:
-- 1. Sadia Sakharkar  (+918055440700, sadia.sakharkar@cumminscollege.in)
-- 2. Bhumika Chaudhari (+919766236307, Email: None - Phone OTP Only)
-- 3. Nouf Bamne       (+917028403043, Email: None - Syntax error flagged, Phone OTP Only)
-- 4. Aboli Gaikwad    (+918263935704, Email: None - Phone OTP Only)
-- ============================================================================

DO $$
DECLARE
    sadia_id UUID := '69526c6f-6172-5205-9d41-98ac24a26b36';
    bhumika_id UUID := '7576d78e-103c-5af6-9a55-ae991bf8afe1';
    nouf_id UUID := 'a0430967-5d21-5db3-bf4d-b1c18af864e8';
    aboli_id UUID := 'fae20068-36ab-5ad2-bea9-cd17da0d8623';
BEGIN

    -- ------------------------------------------------------------------------
    -- OPTIONAL: If auth.users exists and has entries by phone, resolve real UUIDs
    -- ------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        -- Link to genuine auth.users if registered through phone or email
        SELECT id INTO sadia_id FROM auth.users WHERE phone = '+918055440700' OR email = 'sadia.sakharkar@cumminscollege.in' LIMIT 1;
        IF sadia_id IS NULL THEN sadia_id := '69526c6f-6172-5205-9d41-98ac24a26b36'; END IF;

        SELECT id INTO bhumika_id FROM auth.users WHERE phone = '+919766236307' LIMIT 1;
        IF bhumika_id IS NULL THEN bhumika_id := '7576d78e-103c-5af6-9a55-ae991bf8afe1'; END IF;

        SELECT id INTO nouf_id FROM auth.users WHERE phone = '+917028403043' LIMIT 1;
        IF nouf_id IS NULL THEN nouf_id := 'a0430967-5d21-5db3-bf4d-b1c18af864e8'; END IF;

        SELECT id INTO aboli_id FROM auth.users WHERE phone = '+918263935704' LIMIT 1;
        IF aboli_id IS NULL THEN aboli_id := 'fae20068-36ab-5ad2-bea9-cd17da0d8623'; END IF;

        -- Ensure parent rows in auth.users exist so FK constraint on profiles(id) succeeds
        INSERT INTO auth.users (id, aud, role, email, phone, encrypted_password, email_confirmed_at, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES
            (sadia_id, 'authenticated', 'authenticated', 'sadia.sakharkar@cumminscollege.in', '+918055440700', '', NOW(), NOW(), '{"provider":"phone","providers":["phone","email"]}', '{"full_name":"Sadia Sakharkar"}', NOW(), NOW()),
            (bhumika_id, 'authenticated', 'authenticated', NULL, '+919766236307', '', NOW(), NOW(), '{"provider":"phone","providers":["phone"]}', '{"full_name":"Bhumika Chaudhari"}', NOW(), NOW()),
            (nouf_id, 'authenticated', 'authenticated', NULL, '+917028403043', '', NOW(), NOW(), '{"provider":"phone","providers":["phone"]}', '{"full_name":"Nouf Bamne"}', NOW(), NOW()),
            (aboli_id, 'authenticated', 'authenticated', NULL, '+918263935704', '', NOW(), NOW(), '{"provider":"phone","providers":["phone"]}', '{"full_name":"Aboli Gaikwad"}', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            updated_at = NOW();
    END IF;

    -- ------------------------------------------------------------------------
    -- 1. PROFILES TABLE (Upsert)
    -- ------------------------------------------------------------------------
    INSERT INTO public.profiles (
        id, phone_number, email, full_name, gender, city_key, work_type,
        experience_years, availability, pay_min, pay_max, emergency_contact,
        savings_goal, weekly_save_goal, preferred_language, updated_at
    ) VALUES
        (sadia_id, '+918055440700', 'sadia.sakharkar@cumminscollege.in', 'Sadia Sakharkar', 'female', 'cities.pune', 'domestic_worker', 4, 'morning', 450.00, 850.00, '+919822000001', 8000.00, 600.00, 'mr', NOW()),
        (bhumika_id, '+919766236307', NULL, 'Bhumika Chaudhari', 'female', 'cities.pune', 'delivery', 2, 'flexible', 500.00, 950.00, '+919822000002', 6000.00, 500.00, 'hi', NOW()),
        (nouf_id, '+917028403043', NULL, 'Nouf Bamne', 'female', 'cities.pune', 'electrician', 3, 'daytime', 600.00, 1200.00, '+919822000003', 10000.00, 800.00, 'en', NOW()),
        (aboli_id, '+918263935704', NULL, 'Aboli Gaikwad', 'female', 'cities.pune', 'driver', 5, 'flexible', 800.00, 1500.00, '+919822000004', 12000.00, 1000.00, 'mr', NOW())
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        email = EXCLUDED.email,
        gender = EXCLUDED.gender,
        work_type = EXCLUDED.work_type,
        savings_goal = EXCLUDED.savings_goal,
        weekly_save_goal = EXCLUDED.weekly_save_goal,
        preferred_language = EXCLUDED.preferred_language,
        updated_at = NOW();

    -- ------------------------------------------------------------------------
    -- 2. NOTIFICATION PREFERENCES (Upsert)
    -- ------------------------------------------------------------------------
    INSERT INTO public.notification_preferences (user_id, in_app_enabled, sound_enabled, vibration_enabled, category_money, category_work, category_health, category_skills, category_rights)
    VALUES
        (sadia_id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
        (bhumika_id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
        (nouf_id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
        (aboli_id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
    ON CONFLICT (user_id) DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 3. TRANSACTIONS (Upsert by (user_id, client_tx_id))
    -- ------------------------------------------------------------------------
    -- Sadia's Transactions
    INSERT INTO public.transactions (user_id, client_tx_id, type, amount, category, description, work_ref, source, timestamp)
    VALUES
        (sadia_id, 'demo_seed_8055440700_1', 'income', 6500.00, 'work_earnings', '[Demo Seed] Society Cooking & Monthly Domestic Retainer', 'Karvenagar Housing Society', 'manual', NOW() - INTERVAL '4 days'),
        (sadia_id, 'demo_seed_8055440700_2', 'expense', 1450.00, 'food', '[Demo Seed] Household Groceries & Fresh Produce', NULL, 'manual', NOW() - INTERVAL '3 days'),
        (sadia_id, 'demo_seed_8055440700_3', 'income', 1200.00, 'work_earnings', '[Demo Seed] Festival Kitchen Deep-Cleaning Gig', 'Kothrud Bungalow Service', 'manual', NOW() - INTERVAL '2 days'),
        (sadia_id, 'demo_seed_8055440700_4', 'expense', 600.00, 'tools', '[Demo Seed] Sanitization Supplies & Cleaning Utensils', NULL, 'manual', NOW() - INTERVAL '2 days'),
        (sadia_id, 'demo_seed_8055440700_5', 'income', 800.00, 'work_earnings', '[Demo Seed] Weekend Private Catering Assistant', 'Baner Event Planners', 'quick', NOW() - INTERVAL '1 day'),
        (sadia_id, 'demo_seed_8055440700_6', 'expense', 250.00, 'travel_fuel', '[Demo Seed] Auto-Rickshaw Shared Transit', NULL, 'quick', NOW())
    ON CONFLICT (user_id, client_tx_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        timestamp = EXCLUDED.timestamp,
        updated_at = NOW();

    -- Bhumika's Transactions
    INSERT INTO public.transactions (user_id, client_tx_id, type, amount, category, description, work_ref, source, timestamp)
    VALUES
        (bhumika_id, 'demo_seed_9766236307_1', 'income', 2100.00, 'work_earnings', '[Demo Seed] Weekend Express Delivery Surge Batch', 'Zomato / Blinkit Partner', 'manual', NOW() - INTERVAL '4 days'),
        (bhumika_id, 'demo_seed_9766236307_2', 'expense', 450.00, 'travel_fuel', '[Demo Seed] Petrol Fuel Refill at Indian Oil Hinjawadi', NULL, 'manual', NOW() - INTERVAL '3 days'),
        (bhumika_id, 'demo_seed_9766236307_3', 'income', 1450.00, 'work_earnings', '[Demo Seed] Weekday Quick Commerce Grocery Drops', 'Zepto Delivery Partner', 'manual', NOW() - INTERVAL '2 days'),
        (bhumika_id, 'demo_seed_9766236307_4', 'expense', 350.00, 'tools', '[Demo Seed] Scooter Engine Oil Top-Up & Brake Pad Check', NULL, 'manual', NOW() - INTERVAL '2 days'),
        (bhumika_id, 'demo_seed_9766236307_5', 'income', 450.00, 'work_earnings', '[Demo Seed] Customer App Tips & Rain Surge Bonus', 'Delivery Payout Hub', 'quick', NOW() - INTERVAL '1 day'),
        (bhumika_id, 'demo_seed_9766236307_6', 'expense', 120.00, 'food', '[Demo Seed] Tea & Evening Meal During Shift', NULL, 'quick', NOW())
    ON CONFLICT (user_id, client_tx_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        timestamp = EXCLUDED.timestamp,
        updated_at = NOW();

    -- Nouf's Transactions
    INSERT INTO public.transactions (user_id, client_tx_id, type, amount, category, description, work_ref, source, timestamp)
    VALUES
        (nouf_id, 'demo_seed_7028403043_1', 'income', 2800.00, 'work_earnings', '[Demo Seed] Dual Inverter Backup & MCB Distribution Rewiring', 'Shivajinagar Commercial Complex', 'manual', NOW() - INTERVAL '4 days'),
        (nouf_id, 'demo_seed_7028403043_2', 'expense', 850.00, 'tools', '[Demo Seed] Digital Clamp Multimeter & Insulated Wire Strippers', NULL, 'manual', NOW() - INTERVAL '3 days'),
        (nouf_id, 'demo_seed_7028403043_3', 'income', 1500.00, 'work_earnings', '[Demo Seed] Showroom LED Track Lighting & Safety Load Audit', 'FC Road Retail Store', 'manual', NOW() - INTERVAL '2 days'),
        (nouf_id, 'demo_seed_7028403043_4', 'expense', 380.00, 'tools', '[Demo Seed] Copper Wire Spools, Cartridge Fuses & PVC Tape', NULL, 'manual', NOW() - INTERVAL '2 days'),
        (nouf_id, 'demo_seed_7028403043_5', 'income', 850.00, 'work_earnings', '[Demo Seed] Apartment Trip Switch Replacement & Earthing Fix', 'Model Colony Society', 'quick', NOW() - INTERVAL '1 day'),
        (nouf_id, 'demo_seed_7028403043_6', 'expense', 200.00, 'travel_fuel', '[Demo Seed] Pune Metro Card Smart Transit Recharge', NULL, 'quick', NOW())
    ON CONFLICT (user_id, client_tx_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        timestamp = EXCLUDED.timestamp,
        updated_at = NOW();

    -- Aboli's Transactions
    INSERT INTO public.transactions (user_id, client_tx_id, type, amount, category, description, work_ref, source, timestamp)
    VALUES
        (aboli_id, 'demo_seed_8263935704_1', 'income', 3200.00, 'work_earnings', '[Demo Seed] Outstation Pune-Mumbai Expressway Passenger Trip', 'Inter-City Taxi Hub', 'manual', NOW() - INTERVAL '4 days'),
        (aboli_id, 'demo_seed_8263935704_2', 'expense', 950.00, 'travel_fuel', '[Demo Seed] CNG Cylinder Complete Fill at Viman Nagar Pump', NULL, 'manual', NOW() - INTERVAL '3 days'),
        (aboli_id, 'demo_seed_8263935704_3', 'income', 1800.00, 'work_earnings', '[Demo Seed] Early Morning Airport Surge Transfers', 'Pune Airport (PNQ) Rides', 'manual', NOW() - INTERVAL '2 days'),
        (aboli_id, 'demo_seed_8263935704_4', 'expense', 360.00, 'travel_fuel', '[Demo Seed] FASTag Highway Electronic Toll Debits', NULL, 'manual', NOW() - INTERVAL '2 days'),
        (aboli_id, 'demo_seed_8263935704_5', 'income', 1100.00, 'work_earnings', '[Demo Seed] Evening Corporate Park Commute Rides', 'Kalyani Nagar / EON Hub', 'quick', NOW() - INTERVAL '1 day'),
        (aboli_id, 'demo_seed_8263935704_6', 'expense', 200.00, 'tools', '[Demo Seed] High-Pressure Vehicle Wash & Interior Sanitization', NULL, 'quick', NOW())
    ON CONFLICT (user_id, client_tx_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        timestamp = EXCLUDED.timestamp,
        updated_at = NOW();

    -- ------------------------------------------------------------------------
    -- 4. SERVICE MARKETPLACE PROFILES (Upsert by user_id)
    -- ------------------------------------------------------------------------
    INSERT INTO public.service_profiles (user_id, display_name, trade, short_description, indicative_price, pricing_type, is_available)
    VALUES
        (sadia_id, 'Sadia''s Home Culinary & Domestic Care', 'Domestic Services / Home Chef', 'Specialized in authentic Maharashtrian cuisine, healthy daily family meals, and comprehensive household upkeep.', 500.00, 'visit_fee', TRUE),
        (bhumika_id, 'Bhumika Express Courier & Logistics', 'Delivery & Logistics', 'Rapid, trusted parcel and document transit across Hinjawadi IT Park, Wakad, and Baner corridor.', 250.00, 'per_trip', TRUE),
        (nouf_id, 'Nouf Electrical Solutions & Wiring', 'Electrical & Appliance Repair', 'Licensed electrical technician certified in domestic switchboards, inverter wiring, and industrial safety load audits.', 400.00, 'visit_fee', TRUE),
        (aboli_id, 'Aboli Safe Transit & Airport Escort', 'Commercial Chauffeur & Cab Driver', '5-star rated commercial driver offering safe airport transfers, outstation cab journeys, and verified corporate carpools.', 650.00, 'per_trip', TRUE)
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        trade = EXCLUDED.trade,
        short_description = EXCLUDED.short_description,
        indicative_price = EXCLUDED.indicative_price,
        is_available = EXCLUDED.is_available,
        updated_at = NOW();

    -- ------------------------------------------------------------------------
    -- 5. SERVICE BOOKINGS
    -- ------------------------------------------------------------------------
    INSERT INTO public.service_bookings (worker_id, customer_name, customer_phone, customer_address, service_trade, service_description, booking_date, time_slot, status, estimated_price)
    VALUES
        (sadia_id, 'Pooja Deshmukh', '+919822111111', 'Flat 302, Nisarg Heights, Karvenagar, Pune', 'Domestic Services / Home Chef', 'Festive multi-course dinner preparation for 8 family guests.', (CURRENT_DATE + 1)::TEXT, '09:00 - 13:00', 'confirmed', 750.00),
        (sadia_id, 'Rajesh Kulkarni', '+919822222222', 'Mayur Colony, Kothrud, Pune', 'Domestic Services / Home Chef', 'Deep sanitization and cabinet reorganization of modular kitchen.', (CURRENT_DATE + 3)::TEXT, '14:00 - 17:00', 'pending', 600.00),
        (bhumika_id, 'Rohan Mehta', '+919822333333', 'Tech Park Tower B, Phase 1 Hinjawadi, Pune', 'Delivery & Logistics', 'Urgent signed legal contracts dispatch to Baner corporate branch.', (CURRENT_DATE - 1)::TEXT, '11:00 - 12:30', 'completed', 300.00),
        (bhumika_id, 'Dr. Sneha Patil', '+919822444444', 'Blue Ridge Township, Phase 2 Hinjawadi, Pune', 'Delivery & Logistics', 'Urgent temperature-controlled prescription medication delivery.', (CURRENT_DATE + 1)::TEXT, '09:30 - 10:30', 'confirmed', 250.00),
        (nouf_id, 'Amit Shinde', '+919822555555', 'Deccan Gymkhana, Shivajinagar, Pune', 'Electrical & Appliance Repair', 'Complete diagnostic inspection of inverter battery backup and load shedding switchover.', (CURRENT_DATE + 1)::TEXT, '10:00 - 12:00', 'confirmed', 500.00),
        (nouf_id, 'Priya Joshi', '+919822666666', 'Bhandarkar Road, Shivajinagar, Pune', 'Electrical & Appliance Repair', 'Kitchen high-amp appliance circuit tripping investigation.', (CURRENT_DATE + 2)::TEXT, '15:00 - 17:00', 'pending', 650.00),
        (aboli_id, 'Vikram Rao', '+919822777777', 'Konark Nagar, Viman Nagar, Pune', 'Commercial Chauffeur & Cab Driver', 'Pre-dawn airport drop to Pune International Airport (PNQ) Terminal 2.', (CURRENT_DATE - 1)::TEXT, '04:30 - 05:45', 'completed', 700.00),
        (aboli_id, 'Neha Saxena', '+919822888888', 'Cerebrum IT Park, Kalyani Nagar, Pune', 'Commercial Chauffeur & Cab Driver', 'Evening commute transit from EON Kharadi to Kalyani Nagar.', (CURRENT_DATE + 1)::TEXT, '18:30 - 19:45', 'confirmed', 550.00);

    -- ------------------------------------------------------------------------
    -- 6. HAQ SETU GRIEVANCE CASES
    -- ------------------------------------------------------------------------
    INSERT INTO public.haq_cases (user_id, case_number, platform_name, deactivation_reason, status, incident_date, loss_of_income_est, appeal_text)
    VALUES
        (sadia_id, 'HAQ-PUN-2026-001', 'Urban Company Partner', 'Unjust rating penalty following app geolocation outage during rainstorm', 'in_review', (CURRENT_DATE - 6)::TEXT, 1500.00, 'Monsoon downpour on Oct 12 caused carrier network dropout, falsely flagging arrival as late. Requesting rating neutralization and fee reinstatement.'),
        (aboli_id, 'HAQ-PUN-2026-002', 'Uber Driver Partner', 'Arbitrary toll fee reimbursement deduction', 'resolved', (CURRENT_DATE - 5)::TEXT, 360.00, 'FASTag statement attached proving ₹360 toll paid on Talegaon toll plaza, which was missing in weekly settlement. Settlement now credited.')
    ON CONFLICT (case_number) DO UPDATE SET
        status = EXCLUDED.status,
        appeal_text = EXCLUDED.appeal_text,
        updated_at = NOW();

    -- ------------------------------------------------------------------------
    -- 7. SAVED HEALTH ITEMS
    -- ------------------------------------------------------------------------
    INSERT INTO public.saved_health_items (user_id, item_id, item_type, title, notes)
    VALUES
        (sadia_id, 'facility-pmjay-pune-01', 'clinic', 'Ayushman Bharat PM-JAY Empanelled Health Centre - Karvenagar', 'Free OPD consultations and subsidized diagnostic blood panel for informal workers.'),
        (nouf_id, 'facility-pmjay-pune-02', 'hospital', 'Sancheti Hospital Informal Worker Occupational Health Desk', 'Ergonomic strain screenings and preventive musculoskeletal checkups for technicians.')
    ON CONFLICT (user_id, item_id) DO NOTHING;

    RAISE NOTICE 'FairWork Setu demo accounts and module records provisioned successfully.';
END $$;
