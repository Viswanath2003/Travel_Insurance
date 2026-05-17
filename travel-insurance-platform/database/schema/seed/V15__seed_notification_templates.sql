-- =============================================================================
-- V15__seed_notification_templates.sql
-- Schema: ins_notification
-- Description: Seed all 22 notification event templates.
--              {{variable}} placeholders resolved at trigger time.
-- =============================================================================

USE ins_notification;

INSERT INTO notification_templates (id, event_code, event_name, title_template, body_template, channels) VALUES

-- AUTH events
(UUID(), 'REGISTRATION_SUCCESS',
 'User Registration Successful',
 'Welcome to TravelSure, {{customerName}}!',
 'Dear {{customerName}},\n\nYour account has been created successfully. Your user ID is {{username}}.\n\nYou can now browse plans and get a quote.',
 'IN_APP,EMAIL'),

(UUID(), 'LOGIN_ACCOUNT_LOCKED',
 'Account Locked',
 'Your account has been locked',
 'Dear {{customerName}},\n\nYour account has been locked due to {{failedAttempts}} consecutive failed login attempts. Please reset your password to unlock your account.',
 'IN_APP,EMAIL'),

(UUID(), 'OTP_REQUESTED',
 'OTP Verification',
 'Your OTP for {{purpose}}',
 'Dear {{customerName}},\n\nYour One-Time Password (OTP) is: {{otp}}\n\nThis OTP is valid for 10 minutes. Do not share this with anyone.',
 'EMAIL'),

(UUID(), 'PASSWORD_RESET_SUCCESS',
 'Password Reset Successful',
 'Your password has been reset',
 'Dear {{customerName}},\n\nYour password has been successfully reset. If you did not initiate this, please contact support immediately.',
 'IN_APP,EMAIL'),

-- QUOTE / POLICY events
(UUID(), 'QUOTE_CREATED',
 'Quote Created',
 'Your quote {{quoteReference}} is ready',
 'Dear {{customerName}},\n\nYour travel insurance quote {{quoteReference}} has been generated.\n\nPlan: {{planName}}\nTotal Premium: {{totalPremium}}\nValid Until: {{expiresAt}}\n\nProceed to purchase before the quote expires.',
 'IN_APP,EMAIL'),

(UUID(), 'QUOTE_EXPIRING_SOON',
 'Quote Expiring Soon',
 'Your quote {{quoteReference}} expires in 6 hours',
 'Dear {{customerName}},\n\nYour quote {{quoteReference}} is about to expire. Log in now to complete your purchase.',
 'IN_APP,EMAIL'),

(UUID(), 'POLICY_PENDING_UW',
 'Policy Under Review',
 'Your policy {{policyNumber}} is under review',
 'Dear {{customerName}},\n\nYour travel insurance application {{policyNumber}} has been received and is currently undergoing our underwriting review process.\n\nWe will notify you of the outcome within {{slaHours}} hours.',
 'IN_APP,EMAIL'),

(UUID(), 'POLICY_ACTIVATED',
 'Policy Activated',
 'Congratulations! Your policy {{policyNumber}} is active',
 'Dear {{customerName}},\n\nYour travel insurance policy {{policyNumber}} is now active.\n\nCoverage: {{coverageSummary}}\nPolicy Period: {{startDate}} to {{endDate}}\nTotal Premium: {{totalPremium}}\n\nYour policy documents are available for download.',
 'IN_APP,EMAIL'),

(UUID(), 'POLICY_REJECTED',
 'Policy Application Declined',
 'Update on your policy application {{policyNumber}}',
 'Dear {{customerName}},\n\nAfter careful review, we are unable to provide coverage for your application {{policyNumber}} at this time.\n\nReason: {{rejectionReason}}\n\nPlease contact our support team if you have any questions.',
 'IN_APP,EMAIL'),

(UUID(), 'POLICY_RENEWAL_DUE',
 'Policy Renewal Reminder',
 'Your policy {{policyNumber}} expires in {{daysToExpiry}} days',
 'Dear {{customerName}},\n\nYour travel insurance policy {{policyNumber}} is due to expire on {{expiryDate}}.\n\nLog in to renew your policy and ensure continuous coverage.',
 'IN_APP,EMAIL'),

(UUID(), 'POLICY_CANCELLATION_REQUESTED',
 'Policy Cancellation Requested',
 'Cancellation request received for {{policyNumber}}',
 'Dear {{customerName}},\n\nYour request to cancel policy {{policyNumber}} has been received and is being processed.\n\nYou will be notified of the outcome within 2 business days.',
 'IN_APP,EMAIL'),

-- UNDERWRITING events
(UUID(), 'UW_INFO_REQUESTED',
 'Additional Information Required',
 'Additional information required for your policy {{policyNumber}}',
 'Dear {{customerName}},\n\nOur underwriting team requires additional information to complete the review of your policy application {{policyNumber}}.\n\nRequired Information:\n{{requestDetails}}\n\nPlease log in to provide the requested information.',
 'IN_APP,EMAIL'),

(UUID(), 'UW_CASE_ASSIGNED',
 'UW Case Assigned',
 'New underwriting case {{caseReference}} assigned to you',
 'Dear {{underwriterName}},\n\nA new underwriting case {{caseReference}} has been assigned to you.\n\nPolicy: {{policyNumber}}\nRisk Level: {{riskLevel}}\nRisk Score: {{riskScore}}\nSLA Due: {{slaDueAt}}\n\nPlease review at your earliest convenience.',
 'IN_APP'),

(UUID(), 'UW_SLA_BREACHED',
 'UW SLA Breach Alert',
 'URGENT: Underwriting case {{caseReference}} has breached SLA',
 'ALERT: Underwriting case {{caseReference}} for policy {{policyNumber}} has exceeded the {{slaHours}}-hour SLA.\n\nRisk Level: {{riskLevel}}\nCase has been escalated for immediate attention.',
 'IN_APP,EMAIL'),

-- CLAIMS events
(UUID(), 'CLAIM_SUBMITTED',
 'Claim Submitted',
 'Your claim {{claimReference}} has been received',
 'Dear {{customerName}},\n\nYour insurance claim {{claimReference}} has been submitted successfully.\n\nClaim Type: {{claimType}}\nClaimed Amount: {{claimedAmount}}\nPolicy: {{policyNumber}}\n\nWe will review your claim and keep you updated on its progress.',
 'IN_APP,EMAIL'),

(UUID(), 'CLAIM_DOCUMENT_REQUIRED',
 'Documents Required for Claim',
 'Additional documents required for claim {{claimReference}}',
 'Dear {{customerName}},\n\nTo process your claim {{claimReference}}, we require the following documents:\n\n{{missingDocuments}}\n\nPlease upload the required documents through your claims portal.',
 'IN_APP,EMAIL'),

(UUID(), 'CLAIM_UNDER_REVIEW',
 'Claim Under Review',
 'Your claim {{claimReference}} is under review',
 'Dear {{customerName}},\n\nYour claim {{claimReference}} is now being reviewed by our claims team.\n\nExpected decision within: {{slaHours}} hours.',
 'IN_APP'),

(UUID(), 'CLAIM_INVESTIGATION_ASSIGNED',
 'Claim Investigation',
 'Field investigation initiated for claim {{claimReference}}',
 'Dear {{customerName}},\n\nA field investigation has been initiated for your claim {{claimReference}}. Our field officer will contact you to schedule a visit.\n\nInvestigation Reference: {{assignmentReference}}',
 'IN_APP,EMAIL'),

(UUID(), 'CLAIM_DECISION_APPROVED',
 'Claim Approved',
 'Your claim {{claimReference}} has been approved',
 'Dear {{customerName}},\n\nWe are pleased to inform you that your claim {{claimReference}} has been approved.\n\nApproved Amount: {{approvedAmount}}\n\nThe payment will be processed to your registered account within 3-5 business days.',
 'IN_APP,EMAIL'),

(UUID(), 'CLAIM_DECISION_DECLINED',
 'Claim Decision',
 'Update on your claim {{claimReference}}',
 'Dear {{customerName}},\n\nAfter careful review of your claim {{claimReference}}, we are unable to approve this claim at this time.\n\nReason: {{decisionReason}}\n\nIf you disagree with this decision, you may appeal through our support portal.',
 'IN_APP,EMAIL'),

(UUID(), 'CLAIM_PAYMENT_PROCESSED',
 'Claim Payment Processed',
 'Payment of {{paymentAmount}} has been processed for claim {{claimReference}}',
 'Dear {{customerName}},\n\nThe payment of {{paymentAmount}} for your approved claim {{claimReference}} has been processed.\n\nPayment Reference: {{paymentReference}}\n\nPlease allow 3-5 business days for the amount to reflect in your account.',
 'IN_APP,EMAIL'),

-- FIELD events
(UUID(), 'FIELD_ASSIGNMENT_RECEIVED',
 'New Field Assignment',
 'New investigation assignment {{assignmentReference}}',
 'Dear {{officerName}},\n\nA new field investigation has been assigned to you.\n\nAssignment: {{assignmentReference}}\nClaim: {{claimReference}}\nPriority: {{priority}}\nDue Date: {{dueDate}}',
 'IN_APP'),

(UUID(), 'DOCUMENT_READY',
 'Document Ready for Download',
 'Your {{documentType}} is ready for download',
 'Dear {{customerName}},\n\nYour {{documentType}} for {{referenceNumber}} is ready.\n\nLog in to your portal to download the document.',
 'IN_APP');
