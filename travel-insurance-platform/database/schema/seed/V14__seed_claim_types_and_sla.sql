-- =============================================================================
-- V14__seed_claim_types_and_sla.sql
-- Schema: ins_claims
-- Description: Seed claim types, document checklists per type, SLA config,
--              and UW SLA config.
-- =============================================================================

USE ins_claims;

-- =============================================================================
-- Claim Types
-- =============================================================================
INSERT INTO claim_types (id, type_code, type_name, coverage_type_code, description,
    auto_decision_threshold, max_auto_approval_amount, requires_field_investigation_above,
    is_active, sort_order) VALUES
('ct-med-exp',  'MEDICAL_EXPENSES',     'Emergency Medical Expenses',  'MEDICAL_EXPENSES',    'Claims for emergency medical treatment costs abroad',       5000.00,  5000.00, 50000.00, 1, 1),
('ct-evac',     'EMERGENCY_EVACUATION', 'Emergency Evacuation',        'EMERGENCY_EVACUATION','Claims for emergency medical evacuation',                   NULL,     NULL,    10000.00, 1, 2),
('ct-cancel',   'TRIP_CANCELLATION',    'Trip Cancellation',           'TRIP_CANCELLATION',   'Claims for non-refundable trip costs after cancellation',   3000.00,  3000.00, 20000.00, 1, 3),
('ct-interrupt','TRIP_INTERRUPTION',    'Trip Interruption',           'TRIP_INTERRUPTION',   'Claims for costs due to early return from trip',            2000.00,  2000.00, 15000.00, 1, 4),
('ct-delay',    'FLIGHT_DELAY',         'Flight Delay',                'FLIGHT_DELAY',        'Claims for expenses due to significant flight delays',      1000.00,  1000.00, NULL,     1, 5),
('ct-bag-loss', 'BAGGAGE_LOSS',         'Baggage Loss',                'BAGGAGE_LOSS',        'Claims for lost, stolen or permanently damaged baggage',    2000.00,  2000.00, 10000.00, 1, 6),
('ct-bag-delay','BAGGAGE_DELAY',        'Baggage Delay',               'BAGGAGE_DELAY',       'Claims for emergency purchases due to delayed baggage',     500.00,   500.00,  NULL,     1, 7),
('ct-accident', 'PERSONAL_ACCIDENT',    'Personal Accident',           'PERSONAL_ACCIDENT',   'Claims for accidental death or permanent disability',       NULL,     NULL,    1000.00,  1, 8),
('ct-equip',    'BUSINESS_EQUIPMENT',   'Business Equipment',          'BUSINESS_EQUIPMENT',  'Claims for loss of business equipment',                     5000.00,  5000.00, 25000.00, 1, 9),
('ct-dental',   'DENTAL_EMERGENCY',     'Emergency Dental Treatment',  'DENTAL_EMERGENCY',    'Claims for emergency dental treatment',                     1500.00,  1500.00, NULL,     1, 10);

-- =============================================================================
-- Document Checklists per Claim Type
-- =============================================================================

-- MEDICAL_EXPENSES checklist
INSERT INTO claim_doc_checklist_config (id, claim_type_id, document_name, document_description, is_mandatory, sort_order) VALUES
(UUID(), 'ct-med-exp', 'Original Medical Bills',         'Original hospital/clinic bills and receipts',             1, 1),
(UUID(), 'ct-med-exp', 'Medical Report / Diagnosis',     'Doctor''s report or diagnosis letter',                    1, 2),
(UUID(), 'ct-med-exp', 'Prescription Copies',            'Copies of all prescriptions during treatment',            0, 3),
(UUID(), 'ct-med-exp', 'Hospital Admission Letter',      'Hospital admission and discharge summary',                0, 4),
(UUID(), 'ct-med-exp', 'Passport Copy',                  'Copy of passport showing travel dates',                   1, 5),
(UUID(), 'ct-med-exp', 'Insurance Card / Policy Copy',   'Copy of travel insurance policy',                        1, 6);

-- TRIP_CANCELLATION checklist
INSERT INTO claim_doc_checklist_config (id, claim_type_id, document_name, document_description, is_mandatory, sort_order) VALUES
(UUID(), 'ct-cancel', 'Booking Confirmation',            'Original hotel and flight booking confirmation',          1, 1),
(UUID(), 'ct-cancel', 'Cancellation Receipt',            'Official cancellation receipt from provider',             1, 2),
(UUID(), 'ct-cancel', 'Cancellation Reason Proof',       'Medical certificate or other evidence for cancellation',  1, 3),
(UUID(), 'ct-cancel', 'Refund Denial Letter',            'Letter from provider confirming non-refundable costs',    0, 4);

-- BAGGAGE_LOSS checklist
INSERT INTO claim_doc_checklist_config (id, claim_type_id, document_name, document_description, is_mandatory, sort_order) VALUES
(UUID(), 'ct-bag-loss', 'Property Irregularity Report',  'Airline PIR (Property Irregularity Report)',              1, 1),
(UUID(), 'ct-bag-loss', 'Baggage Receipt',               'Original baggage check-in receipt',                       1, 2),
(UUID(), 'ct-bag-loss', 'Police Report',                 'Police report for theft/loss in destination',             1, 3),
(UUID(), 'ct-bag-loss', 'Itemised Loss List',            'Detailed list of lost/damaged items with values',         1, 4),
(UUID(), 'ct-bag-loss', 'Purchase Receipts',             'Original purchase receipts for claimed items',            0, 5);

-- FLIGHT_DELAY checklist
INSERT INTO claim_doc_checklist_config (id, claim_type_id, document_name, document_description, is_mandatory, sort_order) VALUES
(UUID(), 'ct-delay', 'Airline Delay Confirmation',       'Official delay confirmation letter from airline',         1, 1),
(UUID(), 'ct-delay', 'Boarding Pass',                    'Original boarding pass',                                  1, 2),
(UUID(), 'ct-delay', 'Expense Receipts',                 'Receipts for meals/accommodation due to delay',           1, 3);

-- PERSONAL_ACCIDENT checklist
INSERT INTO claim_doc_checklist_config (id, claim_type_id, document_name, document_description, is_mandatory, sort_order) VALUES
(UUID(), 'ct-accident', 'Police / Accident Report',      'Official police or accident report',                      1, 1),
(UUID(), 'ct-accident', 'Medical Report',                'Full medical report detailing injuries',                  1, 2),
(UUID(), 'ct-accident', 'Death Certificate',             'Death certificate (for fatal accident claims)',            0, 3),
(UUID(), 'ct-accident', 'Disability Certificate',        'Doctor''s disability certificate with percentage',        0, 4),
(UUID(), 'ct-accident', 'Nominee ID Proof',              'ID proof of nominated beneficiary',                       0, 5);

-- =============================================================================
-- Claim SLA Configuration (hours to process per claim type)
-- =============================================================================
INSERT INTO claim_sla_config (id, claim_type_code, sla_hours, escalation_notify_roles) VALUES
(UUID(), 'MEDICAL_EXPENSES',     48, 'ROLE_ADMIN,ROLE_CLAIMS_OFFICER'),
(UUID(), 'EMERGENCY_EVACUATION', 24, 'ROLE_ADMIN,ROLE_CLAIMS_OFFICER'),
(UUID(), 'TRIP_CANCELLATION',    72, 'ROLE_ADMIN,ROLE_CLAIMS_OFFICER'),
(UUID(), 'TRIP_INTERRUPTION',    72, 'ROLE_ADMIN,ROLE_CLAIMS_OFFICER'),
(UUID(), 'FLIGHT_DELAY',         48, 'ROLE_ADMIN'),
(UUID(), 'BAGGAGE_LOSS',         72, 'ROLE_ADMIN,ROLE_CLAIMS_OFFICER'),
(UUID(), 'BAGGAGE_DELAY',        48, 'ROLE_ADMIN'),
(UUID(), 'PERSONAL_ACCIDENT',    48, 'ROLE_ADMIN,ROLE_CLAIMS_OFFICER'),
(UUID(), 'BUSINESS_EQUIPMENT',   72, 'ROLE_ADMIN,ROLE_CLAIMS_OFFICER'),
(UUID(), 'DENTAL_EMERGENCY',     48, 'ROLE_ADMIN');

-- =============================================================================
-- UW SLA Configuration (in ins_underwriting schema)
-- =============================================================================
USE ins_underwriting;

INSERT INTO uw_sla_config (id, risk_level, uw_level, sla_hours, escalation_notify_roles) VALUES
(UUID(), 'HIGH',      1, 24, 'ROLE_ADMIN,ROLE_UNDERWRITER_L2'),
(UUID(), 'HIGH',      2, 48, 'ROLE_ADMIN'),
(UUID(), 'VERY_HIGH', 1, 12, 'ROLE_ADMIN,ROLE_UNDERWRITER_L2'),
(UUID(), 'VERY_HIGH', 2, 24, 'ROLE_ADMIN');
