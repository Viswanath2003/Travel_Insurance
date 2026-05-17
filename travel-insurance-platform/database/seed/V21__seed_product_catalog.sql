-- =============================================================================
-- V21__seed_product_catalog.sql
-- Schema: ins_product
-- Description: Seed insurance products, plans, plan coverages, and add-ons.
--              Matches the 4-table new product schema (V03__product_schema.sql).
--
-- Removed vs old seed:
--   - product_types INSERT   → type_code is now inline column on insurance_products
--   - coverage_types INSERT  → coverage_code/name now inline in plan_coverages
--   - destination_zones      → moved to V23 (platform_configurations)
--   - zone_countries         → moved to V23 (platform_configurations)
-- =============================================================================

SET search_path = ins_product, public;

-- =============================================================================
-- Insurance Products  (type_code replaces product_type_id FK)
-- =============================================================================
INSERT INTO ins_product.insurance_products
  (id, product_code, product_name, type_code, description, is_active, launch_date)
VALUES
  ('c1d2e3f4-0100-0000-0000-000000000100',
   'TRAVEL_INSURE',
   'TravelInsure — Single Trip',
   'SINGLE_TRIP',
   'Comprehensive single-trip travel insurance: Medical, Trip Cancellation, Baggage, and more',
   TRUE, '2024-01-01'),

  ('c1d2e3f4-0101-0000-0000-000000000101',
   'TRAVEL_INSURE_ANNUAL',
   'TravelInsure — Annual Multi-trip',
   'ANNUAL_MULTI_TRIP',
   'Annual multi-trip cover for frequent travelers — up to 45 days per trip',
   TRUE, '2024-01-01'),

  ('c1d2e3f4-0102-0000-0000-000000000102',
   'TRAVEL_INSURE_SENIOR',
   'TravelInsure — Senior Citizen',
   'SENIOR_CITIZEN',
   'Enhanced medical limits for travellers aged 61 and above',
   TRUE, '2024-03-01'),

  ('c1d2e3f4-0103-0000-0000-000000000103',
   'TRAVEL_INSURE_FAMILY',
   'TravelInsure — Family',
   'FAMILY',
   'Comprehensive family group cover for up to 2 adults and 4 children',
   TRUE, '2024-03-01'),

  ('c1d2e3f4-0104-0000-0000-000000000104',
   'TRAVEL_INSURE_CORPORATE',
   'TravelInsure — Corporate',
   'CORPORATE',
   'Group business travel insurance for corporate employees',
   TRUE, '2024-06-01')

ON CONFLICT (product_code) DO UPDATE
  SET product_name = EXCLUDED.product_name,
      description  = EXCLUDED.description,
      is_active    = EXCLUDED.is_active,
      updated_at   = NOW();

-- =============================================================================
-- Plans  (3 consumer plans seeded as ACTIVE)
-- daily_rate in paise (₹ × 100); base_premium in paise
-- zone_codes: all zones covered by this plan
-- =============================================================================
INSERT INTO ins_product.plans
  (id, plan_code, plan_name, product_id, base_premium, daily_rate,
   zone_codes, status, premium_breakdown_config,
   min_trip_days, max_trip_days, min_traveler_age, max_traveler_age, max_travelers)
VALUES
  -- Basic plan
  ('c1d2e3f4-1001-0000-0000-000000000001',
   'BASIC', 'PolicyPilot Basic',
   'c1d2e3f4-0100-0000-0000-000000000100',
   15000, 150.0000,
   '{ZONE_DOMESTIC,ZONE_SE_ASIA,ZONE_ME_AFRICA,ZONE_EUROPE,ZONE_AUS_NZ,ZONE_USA_CANADA,ZONE_WORLDWIDE}',
   'ACTIVE',
   '{"gst_rate":0.18,"online_discount":0.05,"trip_multipliers":{"single":1.0,"multi":1.6,"annual":2.8}}'::JSONB,
   1, 180, 0, 75, 10),

  -- Plus plan
  ('c1d2e3f4-1002-0000-0000-000000000002',
   'PLUS', 'PolicyPilot Plus',
   'c1d2e3f4-0100-0000-0000-000000000100',
   30000, 300.0000,
   '{ZONE_DOMESTIC,ZONE_SE_ASIA,ZONE_ME_AFRICA,ZONE_EUROPE,ZONE_AUS_NZ,ZONE_USA_CANADA,ZONE_WORLDWIDE}',
   'ACTIVE',
   '{"gst_rate":0.18,"online_discount":0.05,"trip_multipliers":{"single":1.0,"multi":1.6,"annual":2.8}}'::JSONB,
   1, 365, 0, 75, 10),

  -- Pro plan
  ('c1d2e3f4-1003-0000-0000-000000000003',
   'PRO', 'PolicyPilot Pro',
   'c1d2e3f4-0100-0000-0000-000000000100',
   55000, 550.0000,
   '{ZONE_DOMESTIC,ZONE_SE_ASIA,ZONE_ME_AFRICA,ZONE_EUROPE,ZONE_AUS_NZ,ZONE_USA_CANADA,ZONE_WORLDWIDE}',
   'ACTIVE',
   '{"gst_rate":0.18,"online_discount":0.05,"trip_multipliers":{"single":1.0,"multi":1.6,"annual":2.8}}'::JSONB,
   1, 365, 0, 80, 10)

ON CONFLICT (plan_code) DO UPDATE
  SET plan_name                = EXCLUDED.plan_name,
      base_premium             = EXCLUDED.base_premium,
      daily_rate               = EXCLUDED.daily_rate,
      zone_codes               = EXCLUDED.zone_codes,
      status                   = EXCLUDED.status,
      premium_breakdown_config = EXCLUDED.premium_breakdown_config,
      updated_at               = NOW();

-- =============================================================================
-- Plan Coverages  (coverage_code + coverage_name inline — no coverage_type_id FK)
-- is_adjustable=TRUE powers the coverage limit slider in the customer portal
-- =============================================================================

-- BASIC plan coverages
INSERT INTO ins_product.plan_coverages
  (plan_id, coverage_code, coverage_name, coverage_category,
   min_limit, max_limit, default_limit, limit_step,
   is_mandatory, is_adjustable, sort_order)
VALUES
  ('c1d2e3f4-1001-0000-0000-000000000001', 'EMERGENCY_MEDICAL', 'Emergency Medical Expenses', 'HEALTH',
   1000000, 5000000, 2500000, 250000, TRUE, TRUE, 1),
  ('c1d2e3f4-1001-0000-0000-000000000001', 'TRIP_CANCELLATION', 'Trip Cancellation', 'TRAVEL',
   25000, 100000, 50000, 12500, TRUE, TRUE, 2),
  ('c1d2e3f4-1001-0000-0000-000000000001', 'BAGGAGE_LOSS', 'Baggage Loss & Damage', 'TRAVEL',
   10000, 50000, 25000, 5000, TRUE, TRUE, 3),
  ('c1d2e3f4-1001-0000-0000-000000000001', 'PASSPORT_LOSS', 'Passport Loss', 'TRAVEL',
   10000, 10000, 10000, 0, TRUE, FALSE, 4),
  ('c1d2e3f4-1001-0000-0000-000000000001', 'PERSONAL_ACCIDENT', 'Personal Accident', 'PERSONAL',
   1000000, 1000000, 1000000, 0, TRUE, FALSE, 5),
  ('c1d2e3f4-1001-0000-0000-000000000001', 'EMERGENCY_EVACUATION', 'Emergency Evacuation', 'HEALTH',
   1000000, 1000000, 1000000, 0, TRUE, FALSE, 6);

-- PLUS plan coverages
INSERT INTO ins_product.plan_coverages
  (plan_id, coverage_code, coverage_name, coverage_category,
   min_limit, max_limit, default_limit, limit_step,
   is_mandatory, is_adjustable, sort_order)
VALUES
  ('c1d2e3f4-1002-0000-0000-000000000002', 'EMERGENCY_MEDICAL', 'Emergency Medical Expenses', 'HEALTH',
   5000000, 15000000, 7500000, 500000, TRUE, TRUE, 1),
  ('c1d2e3f4-1002-0000-0000-000000000002', 'TRIP_CANCELLATION', 'Trip Cancellation', 'TRAVEL',
   75000, 300000, 150000, 37500, TRUE, TRUE, 2),
  ('c1d2e3f4-1002-0000-0000-000000000002', 'BAGGAGE_LOSS', 'Baggage Loss & Damage', 'TRAVEL',
   37500, 150000, 75000, 18750, TRUE, TRUE, 3),
  ('c1d2e3f4-1002-0000-0000-000000000002', 'PREEXISTING_CONDITIONS', 'Pre-existing Conditions (Listed)', 'HEALTH',
   500000, 2000000, 1000000, 250000, FALSE, TRUE, 4),
  ('c1d2e3f4-1002-0000-0000-000000000002', 'PASSPORT_LOSS', 'Passport Loss', 'TRAVEL',
   20000, 20000, 20000, 0, TRUE, FALSE, 5),
  ('c1d2e3f4-1002-0000-0000-000000000002', 'PERSONAL_ACCIDENT', 'Personal Accident', 'PERSONAL',
   3000000, 3000000, 3000000, 0, TRUE, FALSE, 6),
  ('c1d2e3f4-1002-0000-0000-000000000002', 'EMERGENCY_EVACUATION', 'Emergency Evacuation', 'HEALTH',
   3000000, 3000000, 3000000, 0, TRUE, FALSE, 7),
  ('c1d2e3f4-1002-0000-0000-000000000002', 'FLIGHT_DELAY', 'Flight Delay (>4 hrs)', 'TRAVEL',
   3000, 12000, 3000, 3000, FALSE, FALSE, 8),
  ('c1d2e3f4-1002-0000-0000-000000000002', 'RENTAL_CAR_DAMAGE', 'Rental Car Damage', 'TRAVEL',
   75000, 75000, 75000, 0, FALSE, FALSE, 9),
  ('c1d2e3f4-1002-0000-0000-000000000002', 'HOME_BURGLARY', 'Home Burglary', 'PERSONAL',
   100000, 100000, 100000, 0, FALSE, FALSE, 10);

-- PRO plan coverages
INSERT INTO ins_product.plan_coverages
  (plan_id, coverage_code, coverage_name, coverage_category,
   min_limit, max_limit, default_limit, limit_step,
   is_mandatory, is_adjustable, sort_order)
VALUES
  ('c1d2e3f4-1003-0000-0000-000000000003', 'EMERGENCY_MEDICAL', 'Emergency Medical Expenses', 'HEALTH',
   10000000, 40000000, 20000000, 2000000, TRUE, TRUE, 1),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'TRIP_CANCELLATION', 'Trip Cancellation', 'TRAVEL',
   150000, 600000, 300000, 75000, TRUE, TRUE, 2),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'BAGGAGE_LOSS', 'Baggage Loss & Damage', 'TRAVEL',
   100000, 400000, 200000, 50000, TRUE, TRUE, 3),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'PREEXISTING_CONDITIONS', 'All Pre-existing Conditions', 'HEALTH',
   1500000, 6000000, 3000000, 750000, FALSE, TRUE, 4),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'ADVENTURE_SPORTS', 'Adventure Sports Cover', 'ADVENTURE',
   2500000, 10000000, 5000000, 1250000, FALSE, TRUE, 5),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'PASSPORT_LOSS', 'Passport Loss', 'TRAVEL',
   40000, 40000, 40000, 0, TRUE, FALSE, 6),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'PERSONAL_ACCIDENT', 'Personal Accident', 'PERSONAL',
   10000000, 10000000, 10000000, 0, TRUE, FALSE, 7),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'EMERGENCY_EVACUATION', 'Emergency Evacuation', 'HEALTH',
   10000000, 10000000, 10000000, 0, TRUE, FALSE, 8),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'FLIGHT_DELAY', 'Flight Delay (>2 hrs)', 'TRAVEL',
   5000, 25000, 5000, 5000, FALSE, FALSE, 9),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'RENTAL_CAR_DAMAGE', 'Rental Car Damage', 'TRAVEL',
   200000, 200000, 200000, 0, FALSE, FALSE, 10),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'HOME_BURGLARY', 'Home Burglary', 'PERSONAL',
   100000, 100000, 100000, 0, FALSE, FALSE, 11),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'GOLF_EQUIPMENT', 'Golf Equipment Cover', 'PERSONAL',
   75000, 75000, 75000, 0, FALSE, FALSE, 12),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'BUSINESS_EQUIPMENT', 'Business Equipment', 'PERSONAL',
   500000, 500000, 500000, 0, FALSE, FALSE, 13),
  ('c1d2e3f4-1003-0000-0000-000000000003', 'LEGAL_EXPENSES', 'Legal Expenses', 'PERSONAL',
   300000, 300000, 300000, 0, FALSE, FALSE, 14);

-- =============================================================================
-- Add-ons  (new schema: pricing_type + pricing_value; no product_id; compatible_plan_codes)
-- =============================================================================
INSERT INTO ins_product.addons
  (id, addon_code, addon_name, addon_category, description,
   pricing_type, pricing_value, currency, compatible_plan_codes, is_active)
VALUES
  ('c1d2e3f4-3001-0000-0000-000000000001',
   'ADVENTURE_SPORTS', 'Adventure Sports Cover', 'ADVENTURE',
   'Skiing, scuba, bungee, paragliding & 50+ activities',
   'FLAT', 500, 'INR', '{}', TRUE),

  ('c1d2e3f4-3002-0000-0000-000000000002',
   'RENTAL_CAR', 'Rental Car Protection', 'TRAVEL',
   'Collision damage waiver for rental vehicles',
   'FLAT', 400, 'INR', '{}', TRUE),

  ('c1d2e3f4-3003-0000-0000-000000000003',
   'GOLF_COVER', 'Golf Equipment Cover', 'PERSONAL',
   'Equipment, green fees, hole-in-one',
   'FLAT', 350, 'INR', '{}', TRUE),

  ('c1d2e3f4-3004-0000-0000-000000000004',
   'BUSINESS_EQUIPMENT', 'Business Equipment', 'PERSONAL',
   'Laptops, cameras, instruments up to ₹5L',
   'FLAT', 600, 'INR', '{}', TRUE),

  ('c1d2e3f4-3005-0000-0000-000000000005',
   'PREEXIST_CONDITIONS', 'Pre-existing Conditions', 'MEDICAL',
   'Extended cover for declared conditions',
   'FLAT', 800, 'INR', '{BASIC,PLUS}', TRUE),

  ('c1d2e3f4-3006-0000-0000-000000000006',
   'HOME_BURGLARY', 'Home Burglary Cover', 'PERSONAL',
   'Protect your home while you travel',
   'FLAT', 300, 'INR', '{BASIC,PLUS}', TRUE)

ON CONFLICT (addon_code) DO UPDATE
  SET addon_name   = EXCLUDED.addon_name,
      description  = EXCLUDED.description,
      pricing_value = EXCLUDED.pricing_value,
      is_active    = EXCLUDED.is_active,
      updated_at   = NOW();
