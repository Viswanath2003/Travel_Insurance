package com.insurance.common.security;

public final class PermissionConstants {

    private PermissionConstants() {}

    // ---- Policy Management ----
    public static final String POLICY_VIEW_OWN          = "POLICY_VIEW_OWN";
    public static final String POLICY_VIEW_ALL          = "POLICY_VIEW_ALL";
    public static final String POLICY_CREATE            = "POLICY_CREATE";
    public static final String POLICY_CANCEL            = "POLICY_CANCEL";
    public static final String POLICY_ENDORSE           = "POLICY_ENDORSE";

    // ---- Quote Management ----
    public static final String QUOTE_CREATE             = "QUOTE_CREATE";
    public static final String QUOTE_VIEW               = "QUOTE_VIEW";

    // ---- Claims Management ----
    public static final String CLAIM_SUBMIT             = "CLAIM_SUBMIT";
    public static final String CLAIM_VIEW_OWN           = "CLAIM_VIEW_OWN";
    public static final String CLAIM_VIEW_ALL           = "CLAIM_VIEW_ALL";
    public static final String CLAIM_PROCESS            = "CLAIM_PROCESS";
    public static final String CLAIM_APPROVE            = "CLAIM_APPROVE";
    public static final String CLAIM_DECLINE            = "CLAIM_DECLINE";
    public static final String CLAIM_ASSIGN_OFFICER     = "CLAIM_ASSIGN_OFFICER";

    // ---- Underwriting ----
    public static final String UW_VIEW_QUEUE            = "UW_VIEW_QUEUE";
    public static final String UW_ASSIGN_CASE           = "UW_ASSIGN_CASE";
    public static final String UW_PROCESS_CASE          = "UW_PROCESS_CASE";
    public static final String UW_APPROVE               = "UW_APPROVE";
    public static final String UW_REJECT                = "UW_REJECT";
    public static final String UW_REFER_L2              = "UW_REFER_L2";
    public static final String UW_ESCALATE              = "UW_ESCALATE";

    // ---- Field Operations ----
    public static final String FIELD_VIEW_ASSIGNMENTS   = "FIELD_VIEW_ASSIGNMENTS";
    public static final String FIELD_SUBMIT_REPORT      = "FIELD_SUBMIT_REPORT";
    public static final String FIELD_ASSIGN_OFFICER     = "FIELD_ASSIGN_OFFICER";

    // ---- Product/Plan Management (Admin) ----
    public static final String PRODUCT_MANAGE           = "PRODUCT_MANAGE";
    public static final String PLAN_MANAGE              = "PLAN_MANAGE";
    public static final String ADDON_MANAGE             = "ADDON_MANAGE";
    public static final String COVERAGE_MANAGE          = "COVERAGE_MANAGE";
    public static final String ZONE_MANAGE              = "ZONE_MANAGE";

    // ---- Rule Engine (Admin) ----
    public static final String RULE_VIEW                = "RULE_VIEW";
    public static final String RULE_MANAGE              = "RULE_MANAGE";

    // ---- Document Management ----
    public static final String DOCUMENT_VIEW_OWN        = "DOCUMENT_VIEW_OWN";
    public static final String DOCUMENT_VIEW_ALL        = "DOCUMENT_VIEW_ALL";
    public static final String DOCUMENT_GENERATE        = "DOCUMENT_GENERATE";

    // ---- Payment (Finance) ----
    public static final String PAYMENT_PROCESS          = "PAYMENT_PROCESS";
    public static final String PAYMENT_VIEW             = "PAYMENT_VIEW";

    // ---- User/Role Management (Admin) ----
    public static final String USER_VIEW                = "USER_VIEW";
    public static final String USER_MANAGE              = "USER_MANAGE";
    public static final String ROLE_MANAGE              = "ROLE_MANAGE";

    // ---- Reports ----
    public static final String REPORT_VIEW              = "REPORT_VIEW";
    public static final String REPORT_EXPORT            = "REPORT_EXPORT";

    // ---- Audit ----
    public static final String AUDIT_VIEW               = "AUDIT_VIEW";

    // ---- Config ----
    public static final String CONFIG_MANAGE            = "CONFIG_MANAGE";
}
