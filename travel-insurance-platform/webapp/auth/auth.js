// =============================================================================
// auth.js — PolicyPilot authentication
// Domain-based role detection for staff. Direct login — no OTP flow.
// full_name derived from the email local-part (before the role-slug segment).
// =============================================================================

// ---------------------------------------------------------------------------
// Domain-to-role map
// Staff email pattern: firstname.lastname.<role-slug>@policypilot.com
// The last segment of the local-part (before @) is the role slug.
// ---------------------------------------------------------------------------
const DOMAIN_ROLE_MAP = {
  'agent':        'ROLE_AGENT',
  'underwriter':  'ROLE_UNDERWRITER',
  'claims':       'ROLE_CLAIMS_OFFICER',
  'field':        'ROLE_FIELD_OFFICER',
  'finance':      'ROLE_FINANCE',
  'rm':           'ROLE_RELATIONSHIP_MANAGER'
};

const STAFF_ROLE_LABELS = {
  ROLE_AGENT:                'Agent / Broker',
  ROLE_UNDERWRITER:          'Underwriter',
  ROLE_CLAIMS_OFFICER:       'Claims Officer',
  ROLE_FIELD_OFFICER:        'Field Officer',
  ROLE_FINANCE:              'Finance Officer',
  ROLE_RELATIONSHIP_MANAGER: 'Relationship Manager'
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract role from a staff @policypilot.com email. Returns null otherwise. */
function getRoleFromEmail(email) {
  if (!email || !email.toLowerCase().endsWith('@policypilot.com')) return null;
  const local = email.split('@')[0].toLowerCase();
  const parts = local.split('.');
  const slug  = parts[parts.length - 1];
  return DOMAIN_ROLE_MAP[slug] || null;
}

/**
 * Derive a display name from an email address.
 * staff:    john.smith.claims@policypilot.com  → "John Smith"  (drop last slug)
 * customer: jane.doe@gmail.com                → "Jane Doe"
 *           janedoe@example.com               → "Janedoe"
 */
function getFullNameFromEmail(email) {
  if (!email) return 'User';
  const local = email.split('@')[0];
  const parts = local.split('.');
  const role  = getRoleFromEmail(email);
  const nameParts = role ? parts.slice(0, -1) : parts;
  if (!nameParts.length) return local;
  return nameParts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

function setBtnLoading(btnId, textId, spinnerId, loading, defaultText) {
  const btn  = document.getElementById(btnId);
  const text = document.getElementById(textId);
  const spin = document.getElementById(spinnerId);
  if (!btn) return;
  btn.disabled = loading;
  if (text) text.textContent = loading ? 'Signing in…' : (defaultText || 'Sign In');
  if (spin) spin.classList.toggle('hidden', !loading);
}

// ---------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------
function switchLoginTab(tab) {
  document.getElementById('form-customer').classList.toggle('hidden', tab !== 'customer');
  document.getElementById('form-staff').classList.toggle('hidden', tab !== 'staff');
  document.getElementById('tab-customer').classList.toggle('active', tab === 'customer');
  document.getElementById('tab-staff').classList.toggle('active', tab === 'staff');
  ['c-email-err','c-pwd-err','s-email-err','s-pwd-err'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

// ---------------------------------------------------------------------------
// Real-time role badge (staff form)
// ---------------------------------------------------------------------------
function detectStaffRole() {
  const email = (document.getElementById('s-email')?.value || '').trim();
  const badge = document.getElementById('s-role-badge');
  if (!badge) return;
  const role = getRoleFromEmail(email);
  if (role) {
    badge.textContent = 'Portal: ' + STAFF_ROLE_LABELS[role];
    badge.classList.remove('hidden');
    badge.style.color = 'var(--primary, #00C2A8)';
  } else if (email.length > 3) {
    badge.textContent = email.includes('@policypilot.com')
      ? 'Unrecognised role slug in email'
      : 'Staff must use a @policypilot.com address';
    badge.classList.remove('hidden');
    badge.style.color = '#dc2626';
  } else {
    badge.classList.add('hidden');
  }
}

// ---------------------------------------------------------------------------
// Centralized validators (also exported via window.Validators for shared use)
// ---------------------------------------------------------------------------
const Validators = {
  email(v) {
    if (!v || !v.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address';
    return '';
  },
  passwordLogin(v) {
    if (!v) return 'Password is required';
    if (v.length < 6) return 'Password must be at least 6 characters';
    return '';
  },
  password(v) {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Must be at least 8 characters';
    if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter';
    if (!/[0-9]/.test(v)) return 'Include at least one number';
    if (!/[^A-Za-z0-9]/.test(v)) return 'Include at least one special character';
    return '';
  },
  name(v) {
    if (!v || !v.trim()) return 'Name is required';
    if (v.trim().length < 2) return 'Name is too short';
    return '';
  },
  phone(v) {
    if (!v || !v.trim()) return 'Phone number is required';
    if (!/^\+?[\d\s\-().]{8,15}$/.test(v.trim())) return 'Enter a valid phone number';
    return '';
  },
  dob(v) {
    if (!v) return 'Date of birth is required';
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'Enter a valid date';
    if (d >= new Date()) return 'Date of birth must be in the past';
    return '';
  },
  staffEmail(v) {
    const base = Validators.email(v);
    if (base) return base;
    if (!v.trim().toLowerCase().endsWith('@policypilot.com'))
      return 'Staff must use a @policypilot.com email address';
    if (!getRoleFromEmail(v.trim()))
      return 'Role not recognised — use: name.role@policypilot.com';
    return '';
  },
  required(v, label) {
    if (!v || !String(v).trim()) return (label || 'This field') + ' is required';
    return '';
  },
  minLength(v, min, label) {
    if (!v || v.length < min) return (label || 'Value') + ' must be at least ' + min + ' characters';
    return '';
  },
  passport(v) {
    if (!v || !v.trim()) return 'Passport number is required';
    if (!/^[A-Z0-9]{6,20}$/i.test(v.trim())) return 'Enter a valid passport number (6–20 alphanumeric)';
    return '';
  }
};

// Expose globally for shared use across portal files
window.Validators = Validators;

// ---------------------------------------------------------------------------
// Field-level validation (blur handlers)
// ---------------------------------------------------------------------------
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg || '';
}

function clearErr(id) {
  showErr(id, '');
}

function validateLoginEmail() {
  showErr('c-email-err', Validators.email((document.getElementById('c-email')?.value || '').trim()));
}

function validateLoginPwd() {
  showErr('c-pwd-err', Validators.passwordLogin(document.getElementById('c-password')?.value || ''));
}

function validateStaffEmail() {
  const v = (document.getElementById('s-email')?.value || '').trim();
  showErr('s-email-err', Validators.staffEmail(v));
  detectStaffRole();
}

function validateStaffPwd() {
  showErr('s-pwd-err', Validators.passwordLogin(document.getElementById('s-password')?.value || ''));
}

// ---------------------------------------------------------------------------
// Password toggle
// ---------------------------------------------------------------------------
function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  if (btn) btn.title = showing ? 'Show password' : 'Hide password';
}

// ---------------------------------------------------------------------------
// Customer login — email + password, direct portal redirect (no OTP)
// ---------------------------------------------------------------------------
function doCustomerLogin() {
  const email    = (document.getElementById('c-email')?.value || '').trim();
  const password = document.getElementById('c-password')?.value || '';

  const emailErr = Validators.email(email);
  const pwdErr   = Validators.passwordLogin(password);
  showErr('c-email-err', emailErr);
  showErr('c-pwd-err',   pwdErr);
  if (emailErr || pwdErr) return;

  setBtnLoading('c-login-btn', 'c-btn-text', 'c-spinner', true, 'Sign In');

  // TODO: replace with real API call — POST /api/auth/customer/login
  setTimeout(() => {
    setBtnLoading('c-login-btn', 'c-btn-text', 'c-spinner', false, 'Sign In');
    const fullName = getFullNameFromEmail(email);
    setSession({
      userId:   'cust-demo',
      email:    email,
      role:     'ROLE_CUSTOMER',
      fullName: fullName,
      name:     fullName
    });
    redirectToPortal('ROLE_CUSTOMER');
  }, 900);
}

// ---------------------------------------------------------------------------
// Staff login — domain-based role detection, direct portal redirect
// ---------------------------------------------------------------------------
function doStaffLogin() {
  const email    = (document.getElementById('s-email')?.value || '').trim();
  const password = document.getElementById('s-password')?.value || '';

  const emailErr = Validators.staffEmail(email);
  const pwdErr   = Validators.passwordLogin(password);
  showErr('s-email-err', emailErr);
  showErr('s-pwd-err',   pwdErr);
  if (emailErr || pwdErr) return;

  const role = getRoleFromEmail(email);
  if (!role) {
    showErr('s-email-err', 'Could not detect role from email domain');
    return;
  }

  setBtnLoading('s-login-btn', 's-btn-text', 's-spinner', true, 'Sign In to Portal');

  // TODO: replace with real API call — POST /api/auth/staff/login
  setTimeout(() => {
    setBtnLoading('s-login-btn', 's-btn-text', 's-spinner', false, 'Sign In to Portal');
    const fullName = getFullNameFromEmail(email);
    setSession({
      userId:   'staff-demo',
      email:    email,
      role:     role,
      fullName: fullName,
      name:     fullName
    });
    redirectToPortal(role);
  }, 900);
}
