-- =============================================================================
-- V24__seed_claim_types_and_sla.sql
-- Schema: ins_workflow
-- Description: Seed claim type definitions, document checklists, and SLA
--              configurations as platform_configurations entries.
--
-- Removed vs old seed:
--   - ins_claims.claim_types table           → inline enum in claims.claim_type_code
--   - ins_claims.claim_doc_checklist_config  → platform_configurations (group: CLAIMS)
--   - ins_claims.claim_sla_config            → platform_configurations (group: SLA)
--
-- Claim type codes (matching claims.chk_claims_type CHECK constraint):
--   MEDICAL | BAGGAGE_LOSS | TRIP_CANCELLATION | FLIGHT_DELAY
--   PERSONAL_LIABILITY | PASSPORT_LOSS | EMERGENCY_EVACUATION
--   DENTAL | ACCIDENTAL_DEATH | OTHER
-- =============================================================================

SET search_path = ins_workflow, public;

-- =============================================================================
-- Claim Type Definitions  (group: CLAIMS)
-- Each entry describes a claim type: display name, default SLA hours,
-- and the required / optional documents for the submission checklist.
-- =============================================================================
INSERT INTO ins_workflow.platform_configurations
    (id, config_key, config_value, value_type, description, group_name, is_active)
VALUES

('g1h2i3j4-1001-0000-0000-000000001001',
 'claims.type_definitions',
 '[
  {
    "code": "MEDICAL",
    "name": "Medical Emergency",
    "description": "In-patient treatment, surgery, or hospitalization abroad due to sudden illness or accident",
    "default_sla_hours": 48,
    "required_docs": [
      {"code":"HOSPITAL_BILL",       "label":"Original Hospital Bill",            "mandatory":true},
      {"code":"DISCHARGE_SUMMARY",   "label":"Discharge Summary",                 "mandatory":true},
      {"code":"PRESCRIPTION",        "label":"Doctor Prescription",               "mandatory":false},
      {"code":"PAYMENT_RECEIPT",     "label":"Proof of Payment",                  "mandatory":true},
      {"code":"PASSPORT_COPY",       "label":"Passport Copy (photo + stamp page)","mandatory":true}
    ]
  },
  {
    "code": "BAGGAGE_LOSS",
    "name": "Baggage & Personal Effects Loss",
    "description": "Loss, theft, or damage to checked baggage and personal belongings during travel",
    "default_sla_hours": 24,
    "required_docs": [
      {"code":"AIRLINE_PIR",         "label":"Airline Property Irregularity Report (PIR)","mandatory":true},
      {"code":"POLICE_REPORT",       "label":"Police Report (for theft)",               "mandatory":false},
      {"code":"PURCHASE_RECEIPTS",   "label":"Purchase Receipts for Lost Items",         "mandatory":false},
      {"code":"PASSPORT_COPY",       "label":"Passport Copy",                            "mandatory":true}
    ]
  },
  {
    "code": "TRIP_CANCELLATION",
    "name": "Trip Cancellation",
    "description": "Non-refundable pre-paid expenses due to unavoidable trip cancellation before departure",
    "default_sla_hours": 48,
    "required_docs": [
      {"code":"CANCELLATION_PROOF",     "label":"Cancellation Confirmation",     "mandatory":true},
      {"code":"AIRLINE_REFUND_DENIAL",  "label":"Airline Refund Denial Letter",  "mandatory":true},
      {"code":"BOOKING_CONFIRMATION",   "label":"Original Booking Confirmation", "mandatory":true},
      {"code":"REASON_DOCUMENT",        "label":"Reason Document (e.g., medical certificate)","mandatory":false}
    ]
  },
  {
    "code": "FLIGHT_DELAY",
    "name": "Flight Delay",
    "description": "Compensation for expenses incurred due to airline delays exceeding the threshold",
    "default_sla_hours": 12,
    "required_docs": [
      {"code":"DELAY_CERTIFICATE",   "label":"Airline Delay Certificate",        "mandatory":true},
      {"code":"EXPENSE_RECEIPTS",    "label":"Expense Receipts (meals, hotel)",  "mandatory":false},
      {"code":"BOARDING_PASS",       "label":"Boarding Pass",                    "mandatory":true}
    ]
  },
  {
    "code": "PERSONAL_LIABILITY",
    "name": "Personal Liability",
    "description": "Accidental damage to third-party property or personal liability claims abroad",
    "default_sla_hours": 72,
    "required_docs": [
      {"code":"INCIDENT_REPORT",     "label":"Incident Report",                 "mandatory":true},
      {"code":"THIRD_PARTY_CLAIM",   "label":"Third Party Claim Document",      "mandatory":true},
      {"code":"POLICE_REPORT",       "label":"Police Report",                   "mandatory":false},
      {"code":"RECEIPTS",            "label":"Supporting Receipts",             "mandatory":false}
    ]
  },
  {
    "code": "PASSPORT_LOSS",
    "name": "Passport Loss",
    "description": "Emergency expenses arising from loss or theft of passport during travel",
    "default_sla_hours": 24,
    "required_docs": [
      {"code":"POLICE_REPORT",       "label":"Police Report (passport theft)",  "mandatory":true},
      {"code":"EMBASSY_RECEIPT",     "label":"Embassy Emergency Certificate",   "mandatory":false},
      {"code":"EXPENSE_RECEIPTS",    "label":"Emergency Expense Receipts",      "mandatory":true}
    ]
  },
  {
    "code": "EMERGENCY_EVACUATION",
    "name": "Emergency Evacuation",
    "description": "Medical evacuation or repatriation costs due to life-threatening emergency",
    "default_sla_hours": 48,
    "required_docs": [
      {"code":"EVACUATION_INVOICE",  "label":"Evacuation Provider Invoice",     "mandatory":true},
      {"code":"MEDICAL_REPORT",      "label":"Attending Doctor Medical Report", "mandatory":true},
      {"code":"PASSPORT_COPY",       "label":"Passport Copy",                   "mandatory":true}
    ]
  },
  {
    "code": "DENTAL",
    "name": "Emergency Dental",
    "description": "Emergency dental treatment required due to sudden pain or accident abroad",
    "default_sla_hours": 24,
    "required_docs": [
      {"code":"DENTAL_BILL",         "label":"Dental Treatment Bill",           "mandatory":true},
      {"code":"DENTIST_REPORT",      "label":"Dentist Treatment Report",        "mandatory":true},
      {"code":"PAYMENT_RECEIPT",     "label":"Payment Receipt",                 "mandatory":true},
      {"code":"PASSPORT_COPY",       "label":"Passport Copy",                   "mandatory":false}
    ]
  },
  {
    "code": "ACCIDENTAL_DEATH",
    "name": "Accidental Death & Disablement",
    "description": "Lump sum claim for accidental death or permanent total/partial disablement",
    "default_sla_hours": 96,
    "required_docs": [
      {"code":"DEATH_CERTIFICATE",    "label":"Death Certificate",                              "mandatory":true},
      {"code":"AUTOPSY_REPORT",       "label":"Autopsy / Post-Mortem Report",                   "mandatory":false},
      {"code":"POLICE_FIR",           "label":"Police FIR",                                     "mandatory":true},
      {"code":"DISABILITY_CERTIFICATE","label":"Disability Certificate (for disablement claims)","mandatory":false},
      {"code":"ID_PROOF",             "label":"Nominee / Claimant ID Proof",                    "mandatory":true}
    ]
  },
  {
    "code": "OTHER",
    "name": "Other Claim",
    "description": "Any other covered claim not listed above",
    "default_sla_hours": 48,
    "required_docs": [
      {"code":"SUPPORTING_DOCS",     "label":"Supporting Documents",            "mandatory":true},
      {"code":"INCIDENT_DESCRIPTION","label":"Detailed Incident Description",   "mandatory":true}
    ]
  }
]',
 'JSON',
 'Claim type definitions: display names, default SLA hours, and required document checklists',
 'CLAIMS', TRUE),

-- =============================================================================
-- SLA Configuration by Priority  (group: SLA)
-- Generic priority bands; claim-type overrides are in claims.sla_overrides.
-- =============================================================================
('g1h2i3j4-2001-0000-0000-000000002001',
 'sla.claims.by_priority',
 '[
  {"priority":"CRITICAL", "resolution_hours":8,  "escalation_hours":4,  "description":"Critical claims (e.g., ongoing hospitalization)"},
  {"priority":"HIGH",     "resolution_hours":24, "escalation_hours":12, "description":"High priority claims requiring swift processing"},
  {"priority":"MEDIUM",   "resolution_hours":48, "escalation_hours":24, "description":"Standard claims — default priority"},
  {"priority":"LOW",      "resolution_hours":72, "escalation_hours":48, "description":"Low-complexity claims with flexible timeline"}
]',
 'JSON',
 'Claim SLA hours by priority band: resolution and escalation thresholds',
 'SLA', TRUE),

-- Per-type SLA overrides for critical claim types
('g1h2i3j4-2002-0000-0000-000000002002',
 'sla.claims.type_overrides',
 '[
  {"claim_type_code":"MEDICAL",          "priority":"HIGH",   "resolution_hours":12, "escalation_hours":6},
  {"claim_type_code":"MEDICAL",          "priority":"MEDIUM", "resolution_hours":24, "escalation_hours":12},
  {"claim_type_code":"ACCIDENTAL_DEATH", "priority":"HIGH",   "resolution_hours":48, "escalation_hours":24},
  {"claim_type_code":"ACCIDENTAL_DEATH", "priority":"MEDIUM", "resolution_hours":72, "escalation_hours":48}
]',
 'JSON',
 'Per-claim-type SLA overrides: tighter deadlines for medical and accidental death claims',
 'SLA', TRUE),

-- =============================================================================
-- Destination Zones  (group: ZONES)
-- Replaces removed destination_zones and zone_countries tables.
-- zone_codes match plans.zone_codes TEXT[] array.
-- =============================================================================
('g1h2i3j4-3001-0000-0000-000000003001',
 'zones.definitions',
 '[
  {"code":"ZONE_DOMESTIC",    "name":"Domestic (India)",                "premium_multiplier":0.5,  "countries":["IN"]},
  {"code":"ZONE_SE_ASIA",     "name":"South & Southeast Asia",          "premium_multiplier":0.8,  "countries":["BD","LK","NP","PK","TH","MY","SG","ID","PH","VN","MM","KH","LA"]},
  {"code":"ZONE_ME_AFRICA",   "name":"Middle East & Africa",            "premium_multiplier":1.0,  "countries":["AE","SA","QA","KW","BH","OM","EG","ZA","KE","NG","GH","TZ","ET"]},
  {"code":"ZONE_EUROPE",      "name":"Europe (Schengen + UK)",          "premium_multiplier":1.2,  "countries":["DE","FR","IT","ES","NL","BE","CH","AT","SE","NO","DK","FI","PL","PT","GR","CZ","HU","GB","IE"]},
  {"code":"ZONE_AUS_NZ",      "name":"Australia & New Zealand",         "premium_multiplier":1.4,  "countries":["AU","NZ"]},
  {"code":"ZONE_USA_CANADA",  "name":"USA & Canada",                    "premium_multiplier":1.8,  "countries":["US","CA"]},
  {"code":"ZONE_WORLDWIDE",   "name":"Worldwide (All Destinations)",    "premium_multiplier":2.0,  "countries":["ALL"]}
]',
 'JSON',
 'Destination zone definitions: codes, display names, premium multipliers, and country lists',
 'ZONES', TRUE)

ON CONFLICT (config_key) DO NOTHING;
