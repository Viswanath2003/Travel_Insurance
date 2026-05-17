-- =============================================================================
-- V13__seed_product_catalog.sql
-- Schema: ins_product
-- Description: Seed product types, coverage types, destination zones,
--              zone countries. Plans and add-ons are Admin-created via UI.
-- =============================================================================

USE ins_product;

-- =============================================================================
-- Product Types (configurable, Admin can add more)
-- =============================================================================
INSERT INTO product_types (id, type_code, type_name, description, is_active, sort_order) VALUES
('pt-single-trip',   'SINGLE_TRIP',       'Single Trip',          'One-way or return trip insurance for individuals',        1, 1),
('pt-annual-multi',  'ANNUAL_MULTI_TRIP', 'Annual Multi-Trip',    'Annual policy covering unlimited trips within policy year',1, 2),
('pt-student',       'STUDENT',           'Student Travel',       'Insurance for students travelling abroad for education',   1, 3),
('pt-family',        'FAMILY',            'Family Travel',        'Family travel insurance covering all family members',      1, 4),
('pt-corporate',     'CORPORATE',         'Corporate Travel',     'Business travel insurance for corporate travellers',       1, 5),
('pt-senior',        'SENIOR_CITIZEN',    'Senior Citizen Travel','Travel insurance designed for senior citizens',            1, 6),
('pt-group',         'GROUP',             'Group Travel',         'Group travel for 10 or more travellers',                  1, 7);

-- =============================================================================
-- Coverage Types (Admin can add more)
-- =============================================================================
INSERT INTO coverage_types (id, coverage_code, coverage_name, coverage_category, description, is_active, sort_order) VALUES
('ct-medical',       'MEDICAL_EXPENSES',       'Emergency Medical Expenses',      'HEALTH',    'Covers emergency medical treatment abroad',                    1,  1),
('ct-evac',          'EMERGENCY_EVACUATION',   'Emergency Evacuation',            'HEALTH',    'Covers emergency medical evacuation and repatriation',         1,  2),
('ct-dental',        'DENTAL_EMERGENCY',       'Emergency Dental Treatment',      'HEALTH',    'Covers emergency dental treatment abroad',                     1,  3),
('ct-cancel',        'TRIP_CANCELLATION',      'Trip Cancellation',               'TRAVEL',    'Covers non-refundable trip costs if trip is cancelled',        1,  4),
('ct-interrupt',     'TRIP_INTERRUPTION',      'Trip Interruption',               'TRAVEL',    'Covers costs if trip is cut short',                           1,  5),
('ct-delay',         'FLIGHT_DELAY',           'Flight Delay',                    'TRAVEL',    'Covers expenses due to significant flight delays',            1,  6),
('ct-baggage',       'BAGGAGE_LOSS',           'Baggage Loss',                    'TRAVEL',    'Covers lost, stolen or damaged baggage',                      1,  7),
('ct-bag-delay',     'BAGGAGE_DELAY',          'Baggage Delay',                   'TRAVEL',    'Covers emergency purchases due to delayed baggage',           1,  8),
('ct-accident',      'PERSONAL_ACCIDENT',      'Personal Accident',               'PERSONAL',  'Covers accidental death and permanent disability',             1,  9),
('ct-liability',     'PERSONAL_LIABILITY',     'Personal Liability',              'PERSONAL',  'Covers third-party liability claims',                         1, 10),
('ct-legal',         'LEGAL_EXPENSES',         'Legal Expenses',                  'PERSONAL',  'Covers legal costs while abroad',                             1, 11),
('ct-equipment',     'BUSINESS_EQUIPMENT',     'Business Equipment',              'FINANCIAL', 'Covers loss of business equipment (corporate plans)',         1, 12),
('ct-fraud',         'FRAUD_PROTECTION',       'Card Fraud Protection',           'FINANCIAL', 'Covers financial loss from card fraud',                       1, 13),
('ct-sponsor',       'SPONSOR_PROTECTION',     'Sponsor Protection',              'FINANCIAL', 'Covers sponsor obligations if sponsor passes away (students)', 1, 14),
('ct-adventure',     'ADVENTURE_SPORTS',       'Adventure Sports Cover',          'PERSONAL',  'Covers injuries from adventure sports activities',            1, 15),
('ct-cruise',        'CRUISE_COVER',           'Cruise Cover',                    'TRAVEL',    'Additional cover specific to cruise travel',                  1, 16);

-- =============================================================================
-- Destination Zones
-- =============================================================================
INSERT INTO destination_zones (id, zone_code, zone_name, risk_tier, description, is_active, sort_order) VALUES
('zone-domestic',    'ZONE_DOMESTIC',    'Domestic',           'TIER_1', 'Travel within home country',                           1, 1),
('zone-saarc',       'ZONE_SAARC',       'SAARC Countries',    'TIER_1', 'India SAARC neighbouring countries',                  1, 2),
('zone-asia',        'ZONE_ASIA',        'Asia (excl. Japan)', 'TIER_2', 'Asian countries excluding Japan and South Korea',      1, 3),
('zone-asia-adv',    'ZONE_ASIA_ADV',    'Asia Advanced',      'TIER_2', 'Japan, South Korea, Singapore, Hong Kong, Australia',  1, 4),
('zone-europe',      'ZONE_EUROPE',      'Europe (Schengen)',   'TIER_3', 'Schengen area European countries',                    1, 5),
('zone-uk',          'ZONE_UK',          'United Kingdom',     'TIER_3', 'United Kingdom and Ireland',                           1, 6),
('zone-middle-east', 'ZONE_MIDDLE_EAST', 'Middle East',        'TIER_3', 'GCC and Middle Eastern countries',                    1, 7),
('zone-usa',         'ZONE_USA_CANADA',  'USA & Canada',       'TIER_4', 'United States of America and Canada',                 1, 8),
('zone-worldwide',   'ZONE_WORLDWIDE',   'Worldwide',          'TIER_4', 'All countries worldwide including USA/Canada',         1, 9),
('zone-high-risk',   'ZONE_HIGH_RISK',   'High Risk Countries','TIER_5', 'Countries with active travel advisories (level 3-4)',  1, 10);

-- =============================================================================
-- Zone-Country Mappings (representative countries per zone)
-- =============================================================================
INSERT INTO zone_countries (id, zone_id, country_code, country_name) VALUES
-- SAARC
(UUID(), 'zone-saarc', 'NP', 'Nepal'),
(UUID(), 'zone-saarc', 'LK', 'Sri Lanka'),
(UUID(), 'zone-saarc', 'BD', 'Bangladesh'),
(UUID(), 'zone-saarc', 'BT', 'Bhutan'),
(UUID(), 'zone-saarc', 'MV', 'Maldives'),
(UUID(), 'zone-saarc', 'PK', 'Pakistan'),
-- Asia
(UUID(), 'zone-asia', 'TH', 'Thailand'),
(UUID(), 'zone-asia', 'MY', 'Malaysia'),
(UUID(), 'zone-asia', 'ID', 'Indonesia'),
(UUID(), 'zone-asia', 'VN', 'Vietnam'),
(UUID(), 'zone-asia', 'PH', 'Philippines'),
(UUID(), 'zone-asia', 'CN', 'China'),
-- Asia Advanced
(UUID(), 'zone-asia-adv', 'JP', 'Japan'),
(UUID(), 'zone-asia-adv', 'KR', 'South Korea'),
(UUID(), 'zone-asia-adv', 'SG', 'Singapore'),
(UUID(), 'zone-asia-adv', 'HK', 'Hong Kong'),
(UUID(), 'zone-asia-adv', 'AU', 'Australia'),
(UUID(), 'zone-asia-adv', 'NZ', 'New Zealand'),
-- Europe
(UUID(), 'zone-europe', 'FR', 'France'),
(UUID(), 'zone-europe', 'DE', 'Germany'),
(UUID(), 'zone-europe', 'IT', 'Italy'),
(UUID(), 'zone-europe', 'ES', 'Spain'),
(UUID(), 'zone-europe', 'NL', 'Netherlands'),
(UUID(), 'zone-europe', 'CH', 'Switzerland'),
(UUID(), 'zone-europe', 'AT', 'Austria'),
(UUID(), 'zone-europe', 'GR', 'Greece'),
(UUID(), 'zone-europe', 'PT', 'Portugal'),
-- UK
(UUID(), 'zone-uk', 'GB', 'United Kingdom'),
(UUID(), 'zone-uk', 'IE', 'Ireland'),
-- Middle East
(UUID(), 'zone-middle-east', 'AE', 'United Arab Emirates'),
(UUID(), 'zone-middle-east', 'SA', 'Saudi Arabia'),
(UUID(), 'zone-middle-east', 'QA', 'Qatar'),
(UUID(), 'zone-middle-east', 'BH', 'Bahrain'),
(UUID(), 'zone-middle-east', 'KW', 'Kuwait'),
(UUID(), 'zone-middle-east', 'OM', 'Oman'),
-- USA & Canada
(UUID(), 'zone-usa', 'US', 'United States of America'),
(UUID(), 'zone-usa', 'CA', 'Canada');
