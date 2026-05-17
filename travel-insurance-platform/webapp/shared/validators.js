// =============================================================================
// validators.js — PolicyPilot centralized field validators
// Used across all portals and forms. Import after utils.js.
// Each validator returns an error string (non-empty = invalid) or '' (valid).
// =============================================================================

const V = {

  // ---------------------------------------------------------------------------
  // Primitive validators
  // ---------------------------------------------------------------------------

  required(v, label) {
    if (v === undefined || v === null || String(v).trim() === '')
      return (label || 'This field') + ' is required';
    return '';
  },

  email(v) {
    if (!v || !v.trim()) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address';
    return '';
  },

  phone(v) {
    if (!v || !v.trim()) return 'Phone number is required';
    if (!/^\+?[\d\s\-().]{8,15}$/.test(v.trim())) return 'Enter a valid phone number (8–15 digits)';
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

  confirmPassword(v, original) {
    if (!v) return 'Please confirm your password';
    if (v !== original) return 'Passwords do not match';
    return '';
  },

  name(v) {
    if (!v || !v.trim()) return 'Name is required';
    if (v.trim().length < 2) return 'Name must be at least 2 characters';
    if (v.trim().length > 120) return 'Name is too long (max 120 characters)';
    if (!/^[a-zA-Z\s'\-\.]+$/.test(v.trim())) return 'Name may only contain letters, spaces, hyphens, and apostrophes';
    return '';
  },

  dob(v) {
    if (!v) return 'Date of birth is required';
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'Enter a valid date';
    if (d >= new Date()) return 'Date of birth must be in the past';
    const age = Math.floor((Date.now() - d) / (365.25 * 24 * 3600 * 1000));
    if (age > 120) return 'Date of birth is too far in the past';
    return '';
  },

  futureDate(v, label) {
    if (!v) return (label || 'Date') + ' is required';
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'Enter a valid date';
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d < tomorrow) return (label || 'Date') + ' must be tomorrow or later';
    return '';
  },

  dateRange(start, end) {
    if (!start || !end) return 'Both start and end dates are required';
    const s = new Date(start), e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Enter valid dates';
    if (e < s) return 'End date must be on or after the start date';
    return '';
  },

  // ---------------------------------------------------------------------------
  // Insurance-domain validators
  // ---------------------------------------------------------------------------

  passport(v) {
    if (!v || !v.trim()) return 'Passport number is required';
    if (!/^[A-Z0-9]{6,20}$/i.test(v.trim())) return 'Enter a valid passport number (6–20 alphanumeric characters)';
    return '';
  },

  policyNumber(v) {
    if (!v || !v.trim()) return 'Policy number is required';
    if (!/^[A-Z0-9\-]{6,30}$/i.test(v.trim())) return 'Enter a valid policy number';
    return '';
  },

  claimAmount(v, maxLimit) {
    const n = parseFloat(v);
    if (isNaN(n) || n <= 0) return 'Enter a valid amount greater than 0';
    if (maxLimit !== undefined && n > maxLimit)
      return `Amount cannot exceed ₹${Number(maxLimit).toLocaleString('en-IN')}`;
    return '';
  },

  positiveNumber(v, label) {
    const n = parseFloat(v);
    if (isNaN(n) || n <= 0) return (label || 'Value') + ' must be a positive number';
    return '';
  },

  minLength(v, min, label) {
    const s = String(v || '').trim();
    if (s.length < min) return (label || 'Value') + ' must be at least ' + min + ' characters';
    return '';
  },

  maxLength(v, max, label) {
    const s = String(v || '');
    if (s.length > max) return (label || 'Value') + ' must be at most ' + max + ' characters';
    return '';
  },

  select(v, label) {
    if (!v || v === '' || v === '--' || v === 'null')
      return 'Please select ' + (label || 'an option');
    return '';
  },

  staffEmail(v) {
    const base = V.email(v);
    if (base) return base;
    if (!v.trim().toLowerCase().endsWith('@policypilot.com'))
      return 'Staff must use a @policypilot.com email address';
    return '';
  },

  incidentDate(v) {
    if (!v) return 'Incident date is required';
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'Enter a valid date';
    if (d > new Date()) return 'Incident date cannot be in the future';
    return '';
  },

  // ---------------------------------------------------------------------------
  // Form-wide helper: validate multiple fields at once
  // Returns { isValid: boolean, errors: {fieldId: message} }
  // rules: [{id, value, fn, args?, label?}]
  // ---------------------------------------------------------------------------
  validateForm(rules) {
    const errors = {};
    let isValid = true;
    rules.forEach(r => {
      let msg = '';
      if (typeof r.fn === 'function') {
        msg = r.args ? r.fn(r.value, ...r.args) : r.fn(r.value);
      } else if (typeof r.fn === 'string' && V[r.fn]) {
        msg = r.args ? V[r.fn](r.value, ...r.args) : V[r.fn](r.value);
      }
      if (msg) {
        errors[r.id] = msg;
        isValid = false;
        const el = document.getElementById(r.id + '-err') || document.getElementById(r.id);
        if (el && el.classList.contains('form-error')) el.textContent = msg;
      }
    });
    return { isValid, errors };
  },

  // Attach real-time blur validation to an input
  // usage: V.attachBlur('field-id', V.name)
  attachBlur(inputId, validatorFn, errId, ...args) {
    const input = document.getElementById(inputId);
    const errEl = document.getElementById(errId || (inputId + '-err'));
    if (!input || !errEl) return;
    const run = () => { errEl.textContent = args.length ? validatorFn(input.value, ...args) : validatorFn(input.value); };
    input.addEventListener('blur', run);
    input.addEventListener('input', () => { if (errEl.textContent) run(); });
  }
};

// Expose globally
window.V = V;
