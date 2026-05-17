/* ================================================================
   TRAVELINSURE – MAIN APPLICATION JAVASCRIPT
   Handles routing, page rendering, validation, and interactions
================================================================ */

// ===== STATE =====
const state = {
  currentPage: 'login',
  userType: null, // 'customer' | 'underwriter'
  selectedPlan: null,
  policyBuilderStep: 1,
  claimStep: 1,
  coverage: { tripCancellation: 75000, medicalExpenses: 150000, baggageLoss: 2500, tripDelay: 200 },
  addons: { adventureSports: true, pregnancy: false, cruise: true, rentalVehicle: false, gadgets: true },
  uwSelectedApp: 'TRV2505200014',
  otpTimer: null,
};

// ===== ROUTING =====
function showPage(id) {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.app-layout').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + id);
  if (el) el.classList.add('active');
  state.currentPage = id;
}

function showApp(type) {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.app-layout').forEach(p => p.classList.remove('active'));
  state.userType = type;
  if (type === 'customer') {
    document.getElementById('app-customer').classList.add('active');
    navigateTo('dashboard');
  } else {
    document.getElementById('app-underwriter').classList.add('active');
    uwNavigateTo('uw-dashboard');
  }
}

function navigateTo(section) {
  // Update sidebar active state
  document.querySelectorAll('#app-customer .sidebar-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#app-customer .nav-btn').forEach(b => b.classList.remove('active'));
  
  const sectionMap = {
    'dashboard': 0, 'my-policies': 1, 'marketplace': 2, 'policy-builder': 3,
    'claims': 4, 'claim-tracking': 5, 'profile': 7, 'notifications': 8, 'documents': 9, 'support': 10
  };
  const sidebarItems = document.querySelectorAll('#app-customer .sidebar-item');
  if (sectionMap[section] !== undefined && sidebarItems[sectionMap[section]]) {
    sidebarItems[sectionMap[section]].classList.add('active');
  }

  const main = document.getElementById('customer-main');
  main.innerHTML = '';
  
  switch(section) {
    case 'dashboard': main.innerHTML = renderDashboard(); break;
    case 'my-policies': main.innerHTML = renderMyPolicies(); break;
    case 'marketplace': main.innerHTML = renderMarketplace(); break;
    case 'policy-builder': state.policyBuilderStep=1; main.innerHTML = renderPolicyBuilder(); break;
    case 'claims': state.claimStep=1; main.innerHTML = renderClaimSubmission(); break;
    case 'claim-tracking': main.innerHTML = renderClaimTracking(); break;
    case 'profile': main.innerHTML = renderProfile(); break;
    case 'notifications': main.innerHTML = renderNotifications(); break;
    case 'documents': main.innerHTML = renderDocuments(); break;
    case 'support': main.innerHTML = renderSupport(); break;
    default: main.innerHTML = renderDashboard();
  }
  main.scrollTop = 0;
}

function uwNavigateTo(section) {
  document.querySelectorAll('#app-underwriter .sidebar-item').forEach(b => b.classList.remove('active'));
  const sectionMap = {'uw-dashboard':0,'uw-queue':1,'uw-review':2,'uw-escalations':3,'audit-trail':6};
  const items = document.querySelectorAll('#app-underwriter .sidebar-item');
  if (sectionMap[section] !== undefined && items[sectionMap[section]]) {
    items[sectionMap[section]].classList.add('active');
  }
  const main = document.getElementById('uw-main');
  main.innerHTML = '';
  switch(section) {
    case 'uw-dashboard': main.innerHTML = renderUWDashboard(); break;
    case 'uw-queue': main.innerHTML = renderUWQueue(); break;
    case 'uw-review': main.innerHTML = renderRiskDetails(); break;
    case 'uw-escalations': main.innerHTML = renderEscalation(); break;
    case 'audit-trail': main.innerHTML = renderAuditTrail(); break;
    default: main.innerHTML = renderUWDashboard();
  }
  main.scrollTop = 0;
}

// ===== AUTH FUNCTIONS =====
function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  let valid = true;
  document.getElementById('login-email-error').textContent = '';
  document.getElementById('login-password-error').textContent = '';
  if (!email) { document.getElementById('login-email-error').textContent = 'Email is required'; valid = false; }
  if (!password) { document.getElementById('login-password-error').textContent = 'Password is required'; valid = false; }
  if (!valid) return;
  
  const btn = document.querySelector('#page-login .btn-primary');
  btn.disabled = true;
  document.getElementById('login-btn-text').textContent = 'Signing in...';
  document.getElementById('login-spinner').classList.remove('hidden');
  
  setTimeout(() => {
    btn.disabled = false;
    document.getElementById('login-btn-text').textContent = 'Sign In';
    document.getElementById('login-spinner').classList.add('hidden');
    document.getElementById('otp-email-display').textContent = email;
    startOTPTimer();
    showPage('otp');
  }, 1200);
}

function doUWLogin() {
  showToast('Signing in to Underwriting Portal...', 'info');
  setTimeout(() => { showApp('underwriter'); }, 1000);
}

function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const pwd = document.getElementById('reg-password').value;
  const cpwd = document.getElementById('reg-confirm').value;
  const terms = document.getElementById('reg-terms').checked;
  let valid = true;
  ['reg-name-error','reg-email-error','reg-phone-error','reg-password-error','reg-confirm-error','reg-terms-error'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  if (!name) { document.getElementById('reg-name-error').textContent = 'Full name is required'; valid = false; }
  if (!email || !email.includes('@')) { document.getElementById('reg-email-error').textContent = 'Valid email is required'; valid = false; }
  if (!phone) { document.getElementById('reg-phone-error').textContent = 'Phone number is required'; valid = false; }
  if (!pwd || pwd.length < 6) { document.getElementById('reg-password-error').textContent = 'Password must be at least 6 characters'; valid = false; }
  if (pwd !== cpwd) { document.getElementById('reg-confirm-error').textContent = 'Passwords do not match'; valid = false; }
  if (!terms) { document.getElementById('reg-terms-error').textContent = 'You must agree to the Terms & Conditions'; valid = false; }
  if (!valid) return;
  
  document.getElementById('otp-email-display').textContent = email;
  startOTPTimer();
  showPage('otp');
}

function otpInput(el, idx) {
  el.classList.toggle('filled', el.value.length > 0);
  if (el.value.length === 1) {
    const inputs = document.querySelectorAll('.otp-input');
    if (idx < 5) inputs[idx + 1].focus();
  }
}

function verifyOTP() {
  const inputs = document.querySelectorAll('.otp-input');
  const otp = Array.from(inputs).map(i => i.value).join('');
  if (otp.length < 6) {
    document.getElementById('otp-error').textContent = 'Please enter all 6 digits';
    return;
  }
  document.getElementById('otp-error').textContent = '';
  showToast('OTP verified successfully!', 'success');
  clearInterval(state.otpTimer);
  setTimeout(() => showApp('customer'), 600);
}

function resendOTP() {
  showToast('OTP resent to your email', 'info');
  startOTPTimer();
}

function startOTPTimer() {
  clearInterval(state.otpTimer);
  let secs = 45;
  const el = document.getElementById('otp-timer');
  if (!el) return;
  el.textContent = '00:45';
  state.otpTimer = setInterval(() => {
    secs--;
    if (secs <= 0) { clearInterval(state.otpTimer); el.textContent = '00:00'; return; }
    el.textContent = '00:' + String(secs).padStart(2,'0');
  }, 1000);
}

function doForgotPassword() {
  const email = document.getElementById('forgot-email');
  if (email && !email.classList.contains('hidden') && !email.value.includes('@')) {
    document.getElementById('forgot-email-error').textContent = 'Please enter a valid email address';
    return;
  }
  document.getElementById('forgot-email-error').textContent = '';
  showToast('Reset link sent! Check your inbox.', 'success');
  setTimeout(() => showPage('login'), 1500);
}

function switchForgotTab(btn, type) {
  document.querySelectorAll('#page-forgot-password .tab-item').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('forgot-email-form').classList.toggle('hidden', type !== 'email');
  document.getElementById('forgot-mobile-form').classList.toggle('hidden', type !== 'mobile');
}

function doLogout() {
  showToast('You have been logged out', 'info');
  setTimeout(() => {
    document.querySelectorAll('.app-layout').forEach(p => p.classList.remove('active'));
    showPage('login');
  }, 600);
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success:'✓', error:'✗', info:'ℹ' };
  toast.innerHTML = `<span style="font-size:16px">${icons[type]||'ℹ'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(20px)'; toast.style.transition='all 0.3s'; setTimeout(()=>toast.remove(),300); }, 3000);
}

// ===== SVG ICONS =====
const icons = {
  dashboard: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  arrow: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  clock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  file: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  upload: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
};

// ===== CUSTOMER DASHBOARD =====
function renderDashboard() {
  return `
  <div class="page-header">
    <h1 class="page-title">Welcome back, John! 👋</h1>
    <p class="page-sub">Here's what's happening with your policies.</p>
  </div>
  <div class="grid-4" style="margin-bottom:20px">
    <div class="card stat-card">
      <div>
        <div class="stat-value" style="color:var(--blue)">3</div>
        <div class="stat-label">Active Policies</div>
        <a href="#" onclick="navigateTo('my-policies');return false" style="font-size:12px;color:var(--blue);text-decoration:none;margin-top:4px;display:block">View all →</a>
      </div>
      <div class="stat-icon" style="background:var(--blue-pale)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
    </div>
    <div class="card stat-card">
      <div>
        <div class="stat-value" style="color:var(--accent)">1</div>
        <div class="stat-label">Upcoming Trips</div>
        <a href="#" onclick="navigateTo('my-policies');return false" style="font-size:12px;color:var(--accent);text-decoration:none;margin-top:4px;display:block">View all →</a>
      </div>
      <div class="stat-icon" style="background:var(--accent-light)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><path d="M13 15h4M13 19h2"/></svg></div>
    </div>
    <div class="card stat-card">
      <div>
        <div class="stat-value" style="color:var(--orange)">2</div>
        <div class="stat-label">Active Claims</div>
        <a href="#" onclick="navigateTo('claim-tracking');return false" style="font-size:12px;color:var(--orange);text-decoration:none;margin-top:4px;display:block">View all →</a>
      </div>
      <div class="stat-icon" style="background:rgba(249,115,22,0.1)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
    </div>
    <div class="card stat-card">
      <div>
        <div class="stat-value" style="color:var(--navy);font-size:20px">₹24,560</div>
        <div class="stat-label">Total Premium</div>
        <a href="#" onclick="navigateTo('my-policies');return false" style="font-size:12px;color:var(--blue);text-decoration:none;margin-top:4px;display:block">View details →</a>
      </div>
      <div class="stat-icon" style="background:rgba(15,27,60,0.06)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
    </div>
  </div>
  
  <div class="grid-2" style="gap:20px">
    <div class="card">
      <div class="card-header" style="justify-content:space-between">
        <span class="card-title">Policy Summary</span>
        <a href="#" onclick="navigateTo('my-policies');return false" style="font-size:12px;color:var(--blue);text-decoration:none">View all policies →</a>
      </div>
      <div style="padding:16px 20px;display:flex;flex-direction:column;gap:12px">
        ${[
          {name:'Europe Travel Plan',no:'TRV123456',cover:'€50,000',valid:'Valid till 20 May 2025',status:'active',color:'var(--green)',bg:'rgba(34,197,94,0.08)'},
          {name:'Asia Adventure Plan',no:'TRV123457',cover:'$75,000',valid:'Valid till 10 Aug 2025',status:'active',color:'var(--green)',bg:'rgba(34,197,94,0.08)'},
          {name:'Annual Multi Trip',no:'TRV123458',cover:'$1,00,000',valid:'Valid till 05 Apr 2025',status:'expiring',color:'var(--orange)',bg:'rgba(249,115,22,0.08)'},
        ].map(p => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-100)">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;border-radius:8px;background:var(--blue-pale);display:flex;align-items:center;justify-content:center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--navy)">${p.name}</div>
                <div style="font-size:11px;color:var(--gray-400)">Policy No. ${p.no} &nbsp;•&nbsp; Cover: ${p.cover}</div>
                <div style="font-size:11px;color:var(--gray-400)">${p.valid}</div>
              </div>
            </div>
            <span class="badge" style="background:${p.bg};color:${p.color}">${p.status==='active'?'Active':'Expiring Soon'}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-header" style="justify-content:space-between">
        <span class="card-title">Recent Activity</span>
        <a href="#" style="font-size:12px;color:var(--blue);text-decoration:none">View all activity →</a>
      </div>
      <div style="padding:16px 20px">
        <div class="timeline">
          ${[
            {title:'Claim CLM20240512001 is under review',desc:'Your claim documents are being reviewed by our team.',time:'2 hours ago',active:true},
            {title:'Policy TRV123456 is active',desc:'Your Europe Travel Plan policy has been activated.',time:'1 day ago',active:false},
            {title:'Payment of ₹8,450 received',desc:'Payment confirmed for policy TRV123457.',time:'2 days ago',active:false},
            {title:'Your profile was updated',desc:'Personal information successfully updated.',time:'3 days ago',active:false},
          ].map((a,i) => `
            <div class="timeline-item">
              <div class="timeline-dot ${a.active?'active':'done'}" style="${!a.active?'background:var(--gray-100);border:2px solid var(--gray-200);color:var(--gray-400)':''}">
                ${a.active ? '●' : icons.check}
              </div>
              <div class="timeline-content">
                <div class="timeline-title">${a.title}</div>
                <div class="timeline-desc">${a.desc}</div>
                <div class="timeline-time">${a.time}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>

  <div style="margin-top:20px" class="card">
    <div class="card-header" style="justify-content:space-between">
      <span class="card-title">Quick Actions</span>
    </div>
    <div style="padding:20px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
      ${[
        {label:'Buy New Policy',icon:'🛡️',action:"navigateTo('marketplace')"},
        {label:'File a Claim',icon:'📋',action:"navigateTo('claims')"},
        {label:'Track Claim',icon:'🔍',action:"navigateTo('claim-tracking')"},
        {label:'Contact Support',icon:'💬',action:"navigateTo('support')"},
      ].map(q => `
        <button onclick="${q.action}" style="padding:20px 16px;border:1.5px solid var(--gray-200);border-radius:10px;background:white;cursor:pointer;text-align:center;transition:all 0.15s;font-family:inherit" onmouseover="this.style.borderColor='var(--blue)';this.style.background='var(--blue-pale)'" onmouseout="this.style.borderColor='var(--gray-200)';this.style.background='white'">
          <div style="font-size:26px;margin-bottom:8px">${q.icon}</div>
          <div style="font-size:12px;font-weight:600;color:var(--navy)">${q.label}</div>
        </button>
      `).join('')}
    </div>
  </div>`;
}

// ===== MY POLICIES =====
function renderMyPolicies() {
  const policies = [
    {name:'Europe Travel Plan',no:'TRV123456',cover:'€50,000',dest:'Europe (Schengen)',from:'20 Apr 2025',to:'20 May 2025',status:'Active',statusClass:'badge-green'},
    {name:'Asia Adventure Plan',no:'TRV123457',cover:'$75,000',dest:'Thailand, Singapore',from:'10 Jul 2025',to:'10 Aug 2025',status:'Active',statusClass:'badge-green'},
    {name:'Annual Multi Trip',no:'TRV123458',cover:'$1,00,000',dest:'Worldwide',from:'05 Apr 2024',to:'05 Apr 2025',status:'Expiring Soon',statusClass:'badge-orange'},
  ];
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">My Policies</h1><p class="page-sub">All your insurance policies in one place</p></div>
    <button class="btn btn-primary" onclick="navigateTo('marketplace')">+ Buy New Policy</button>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:16px">
    <select class="form-select" style="max-width:160px"><option>All Policies</option><option>Active</option><option>Expired</option></select>
    <select class="form-select" style="max-width:160px"><option>All Status</option><option>Active</option><option>Expiring Soon</option></select>
    <input type="text" class="form-input" style="max-width:220px" placeholder="Search policy or destination...">
  </div>
  <div style="display:flex;flex-direction:column;gap:14px">
    ${policies.map(p => `
      <div class="card" style="padding:0">
        <div style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:44px;height:44px;border-radius:10px;background:var(--blue-pale);display:flex;align-items:center;justify-content:center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--navy)">${p.name}</div>
              <div style="font-size:12px;color:var(--gray-400)">Policy No. ${p.no}</div>
            </div>
          </div>
          <div style="display:flex;gap:24px;flex-wrap:wrap">
            <div><div style="font-size:11px;color:var(--gray-400)">Cover Amount</div><div style="font-weight:600;color:var(--navy)">${p.cover}</div></div>
            <div><div style="font-size:11px;color:var(--gray-400)">Destination</div><div style="font-weight:600;color:var(--navy)">${p.dest}</div></div>
            <div><div style="font-size:11px;color:var(--gray-400)">Valid From</div><div style="font-weight:600;color:var(--navy)">${p.from}</div></div>
            <div><div style="font-size:11px;color:var(--gray-400)">To</div><div style="font-weight:600;color:var(--navy)">${p.to}</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="badge ${p.statusClass}">${p.status}</span>
            <button class="btn btn-outline btn-sm" onclick="showToast('Opening policy details...','info')">View Details</button>
          </div>
        </div>
      </div>
    `).join('')}
  </div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px">
    <span style="font-size:13px;color:var(--gray-500)">Showing 1-3 of 3 policies</span>
    <div style="display:flex;gap:6px">
      <button class="btn btn-secondary btn-sm">Previous</button>
      <button class="btn btn-primary btn-sm">1</button>
      <button class="btn btn-secondary btn-sm">2</button>
      <button class="btn btn-secondary btn-sm">Next</button>
    </div>
  </div>`;
}

// ===== MARKETPLACE =====
function renderMarketplace() {
  const plans = [
    {name:'Europe Travel Plan',tag:'Popular',tagColor:'var(--accent)',price:'€50.20',period:'/7 Days',desc:'Comprehensive protection for your trip to Europe',duration:'Up to 90 Days',cover:'Up to €50,000',medical:'Up to €100,000',baggage:'Up to €2,000'},
    {name:'Asia Adventure Plan',tag:'Best Value',tagColor:'var(--orange)',price:'$62.30',period:'/7 Days',desc:'Ideal for Asian countries with complete protection',duration:'Up to 90 Days',cover:'Up to $75,000',medical:'Up to $150,000',baggage:'Up to $3,000'},
    {name:'Annual Multi Trip Plan',tag:null,tagColor:'',price:'$199.00',period:'/Year',desc:'Multiple trips, one plan. Travel worry-free all year round.',duration:'Up to 365 Days',cover:'Up to $1,00,000',medical:'Up to $2,50,000',baggage:'Up to $5,000'},
  ];
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">Plan Marketplace</h1><p class="page-sub">Find the perfect travel insurance plan for your journey</p></div>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
    <input type="text" class="form-input" style="max-width:260px" placeholder="Search for plans, destinations...">
    <select class="form-select" style="max-width:160px"><option>All Destinations</option><option>Europe</option><option>Asia</option><option>USA</option></select>
    <select class="form-select" style="max-width:140px"><option>All Trip Types</option><option>Leisure</option><option>Business</option><option>Student</option></select>
    <select class="form-select" style="max-width:140px"><option>All Durations</option><option>1-7 Days</option><option>8-30 Days</option><option>30+ Days</option></select>
    <button class="btn btn-secondary btn-sm">More Filters</button>
  </div>
  <div style="font-size:13px;color:var(--gray-500);margin-bottom:16px;font-weight:500">Recommended Plans <span style="color:var(--blue);font-size:12px;cursor:pointer"> Why these? ℹ</span></div>
  <div style="display:flex;flex-direction:column;gap:16px">
    ${plans.map((p,i) => `
      <div class="plan-card ${i===0?'selected':''}" id="plan-${i}" onclick="selectPlan(${i})">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px">
          <div style="display:flex;align-items:flex-start;gap:14px;flex:1">
            <div style="width:44px;height:44px;border-radius:10px;background:var(--blue-pale);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span style="font-size:15px;font-weight:700;color:var(--navy)">${p.name}</span>
                ${p.tag ? `<span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:12px;background:${p.tag==='Popular'?'var(--accent-light)':'rgba(249,115,22,0.1)'};color:${p.tagColor}">${p.tag}</span>` : ''}
              </div>
              <div style="font-size:12px;color:var(--gray-500);margin-bottom:10px">${p.desc}</div>
              <div style="display:flex;gap:16px;flex-wrap:wrap">
                ${[['⏱',p.duration],['🛡',p.cover],['🏥',p.medical],['🧳',p.baggage]].map(([ic,val])=>`
                  <span style="font-size:12px;color:var(--gray-600);display:flex;align-items:center;gap:4px">${ic} ${val}</span>
                `).join('')}
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px">
            <div style="text-align:right">
              <span style="font-size:22px;font-weight:700;color:var(--navy)">${p.price}</span>
              <span style="font-size:12px;color:var(--gray-400)">${p.period}</span>
            </div>
            <div style="display:flex;gap:8px">
              <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--gray-500);cursor:pointer">
                <input type="checkbox"> Compare
              </label>
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();showPlanDetails(${i})">View Details</button>
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();startPolicyBuilder(${i})">Get a Quote</button>
            </div>
          </div>
        </div>
      </div>
    `).join('')}
  </div>
  <div style="margin-top:16px">
    <button class="btn btn-secondary btn-block" style="border-style:dashed">Compare Plans (0/3)</button>
  </div>`;
}

function selectPlan(idx) {
  document.querySelectorAll('.plan-card').forEach((c,i) => c.classList.toggle('selected', i===idx));
  state.selectedPlan = idx;
}

function showPlanDetails(idx) {
  showToast('Opening plan details...', 'info');
  setTimeout(() => {
    navigateTo('marketplace');
    const main = document.getElementById('customer-main');
    main.innerHTML = renderPlanDetails(idx);
  }, 200);
}

function renderPlanDetails(idx) {
  const plans = ['Europe Travel Plan','Asia Adventure Plan','Annual Multi Trip Plan'];
  const prices = ['€50.20','$62.30','$199.00'];
  return `
  <div style="margin-bottom:16px">
    <button class="btn btn-ghost btn-sm" onclick="navigateTo('marketplace')" style="color:var(--blue);padding-left:0">← Back to Marketplace</button>
  </div>
  <div class="card">
    <div class="card-body">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <h2 style="font-size:22px;font-weight:700;color:var(--navy)">${plans[idx]}</h2>
            ${idx<2?`<span class="badge badge-accent">${idx===0?'Popular':'Best Value'}</span>`:''}
          </div>
          <p style="color:var(--gray-500);font-size:13px">Comprehensive protection for your trip</p>
        </div>
        <div style="text-align:right">
          <div style="font-size:28px;font-weight:700;color:var(--navy)">${prices[idx]}</div>
          <div style="font-size:12px;color:var(--gray-400)">${idx===2?'/ Year':'/ 7 Days'}</div>
        </div>
      </div>
      <div class="tabs">
        <button class="tab-item active">Overview</button>
        <button class="tab-item" onclick="this.parentNode.querySelectorAll('.tab-item').forEach(t=>t.classList.remove('active'));this.classList.add('active')">Coverage Details</button>
        <button class="tab-item" onclick="this.parentNode.querySelectorAll('.tab-item').forEach(t=>t.classList.remove('active'));this.classList.add('active')">What's Covered</button>
        <button class="tab-item" onclick="this.parentNode.querySelectorAll('.tab-item').forEach(t=>t.classList.remove('active'));this.classList.add('active')">Exclusions</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
        ${[['⏱','Trip Duration','Up to 90 Days'],['🛡','Coverage','Up to €50,000'],['🏥','Medical Coverage','Up to €100,000'],['🧳','Baggage Loss','Up to €2,000']].map(([ic,label,val])=>`
          <div style="padding:16px;background:var(--gray-50);border-radius:8px;text-align:center">
            <div style="font-size:24px;margin-bottom:8px">${ic}</div>
            <div style="font-size:11px;color:var(--gray-400);margin-bottom:4px">${label}</div>
            <div style="font-size:13px;font-weight:600;color:var(--navy)">${val}</div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="navigateTo('marketplace')">← Back</button>
        <button class="btn btn-outline"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download Policy Wording</button>
        <button class="btn btn-primary" onclick="startPolicyBuilder(${idx})">Get a Quote →</button>
      </div>
    </div>
  </div>`;
}

function startPolicyBuilder(idx) {
  state.selectedPlan = idx;
  state.policyBuilderStep = 1;
  navigateTo('policy-builder');
}

// ===== POLICY BUILDER =====
function renderPolicyBuilder() {
  const steps = ['Coverage','Add-ons','Pricing','Risk','Purchase','Confirm'];
  const stepHtml = `
    <div class="steps">
      ${steps.map((s,i) => `
        <div class="step ${i+1 < state.policyBuilderStep ? 'completed' : i+1 === state.policyBuilderStep ? 'active' : ''}">
          <div class="step-circle">${i+1 < state.policyBuilderStep ? icons.check : i+1}</div>
          <div class="step-label">${s}</div>
        </div>
      `).join('')}
    </div>`;

  switch(state.policyBuilderStep) {
    case 1: return renderPBCoverage(stepHtml);
    case 2: return renderPBAddons(stepHtml);
    case 3: return renderPBPricing(stepHtml);
    case 4: return renderPBRisk(stepHtml);
    case 5: return renderPBPurchase(stepHtml);
    case 6: return renderPBConfirm();
    default: return renderPBCoverage(stepHtml);
  }
}

function pbNext() { state.policyBuilderStep++; document.getElementById('customer-main').innerHTML = renderPolicyBuilder(); document.getElementById('customer-main').scrollTop=0; }
function pbBack() { state.policyBuilderStep--; document.getElementById('customer-main').innerHTML = renderPolicyBuilder(); document.getElementById('customer-main').scrollTop=0; }

function renderPBCoverage(stepHtml) {
  return `
  <div class="page-header"><h1 class="page-title">Adaptive Policy Builder</h1><p class="page-sub">Customize Your Coverage</p></div>
  ${stepHtml}
  <div class="grid-2" style="gap:20px">
    <div class="card card-body">
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:20px">Customize Your Coverage</h3>
      <p style="font-size:13px;color:var(--gray-500);margin-bottom:20px">Adjust your coverage limits as per your needs</p>
      ${[
        {label:'Trip Cancellation',key:'tripCancellation',min:10000,max:1000000,rec:'Recommended: €50,000'},
        {label:'Medical Expenses',key:'medicalExpenses',min:25000,max:5000000,rec:'Recommended: €1,00,000'},
        {label:'Baggage Loss',key:'baggageLoss',min:500,max:10000,rec:'Recommended: €2,000'},
        {label:'Trip Delay',key:'tripDelay',min:50,max:500,rec:'Recommended: €150'},
      ].map(item => `
        <div style="margin-bottom:22px">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${item.label}</div>
              <div style="font-size:11px;color:var(--gray-400)">${item.rec}</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:var(--blue)">€${(state.coverage[item.key]/1000).toFixed(0)}K</div>
          </div>
          <input type="range" min="${item.min}" max="${item.max}" value="${state.coverage[item.key]}" step="${item.min}" 
            style="width:100%;accent-color:var(--blue)" 
            oninput="state.coverage['${item.key}']=parseInt(this.value);this.previousElementSibling.querySelector('div:last-child').textContent='€'+(parseInt(this.value)/1000).toFixed(0)+'K'">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--gray-400);margin-top:4px">
            <span>€${(item.min/1000).toFixed(0)}K</span><span>€${(item.max/1000000).toFixed(1)}M</span>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="card card-body">
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Your Selection</h3>
      <div style="background:var(--gray-50);border-radius:8px;padding:16px;margin-bottom:20px">
        <div style="display:flex;flex-direction:column;gap:8px;font-size:13px">
          ${[['Trip Duration','10 Days'],['Destination','Europe'],['Travelers','2 Adults'],['Policy Type','Leisure']].map(([k,v])=>`
            <div style="display:flex;justify-content:space-between"><span style="color:var(--gray-500)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span></div>
          `).join('')}
        </div>
      </div>
      <div style="background:var(--blue-pale);border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
        <div style="font-size:13px;color:var(--gray-500);margin-bottom:4px">Estimated Premium</div>
        <div style="font-size:32px;font-weight:700;color:var(--navy)">€312.45</div>
        <div style="font-size:12px;color:var(--gray-400)">for 10 Days (Taxes included)</div>
      </div>
      <button class="btn btn-primary btn-block" onclick="pbNext()">Next: Add-ons →</button>
    </div>
  </div>`;
}

function renderPBAddons(stepHtml) {
  const addons = [
    {key:'adventureSports',label:'Adventure Sports Cover',desc:'Covers risks for activities like skiing, scuba diving, etc.',price:25},
    {key:'pregnancy',label:'Pregnancy Cover',desc:'Covers pregnancy-related complications.',price:40},
    {key:'cruise',label:'Cruise Cover',desc:'Covers cruises and related risks.',price:30},
    {key:'rentalVehicle',label:'Rental Vehicle Excess Cover',desc:'Waiver for excess on rented vehicles.',price:20},
    {key:'gadgets',label:'Electronic Gadgets Cover',desc:'Covers loss/damage of gadgets.',price:15},
  ];
  return `
  <div class="page-header"><h1 class="page-title">Add-ons Selection</h1><p class="page-sub">Enhance Your Protection</p></div>
  ${stepHtml}
  <div class="grid-2" style="gap:20px">
    <div class="card card-body">
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:6px">Enhance Your Protection</h3>
      <p style="font-size:13px;color:var(--gray-500);margin-bottom:20px">Choose add-ons to tailor your policy</p>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${addons.map(a => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border:1.5px solid ${state.addons[a.key]?'var(--blue)':'var(--gray-200)'};border-radius:8px;background:${state.addons[a.key]?'var(--blue-pale)':'white'};cursor:pointer;transition:all 0.15s" onclick="state.addons['${a.key}']=!state.addons['${a.key}'];document.getElementById('customer-main').innerHTML=renderPolicyBuilder()">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${a.label}</div>
              <div style="font-size:12px;color:var(--gray-400)">${a.desc}</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;flex-shrink:0">
              <span style="font-size:14px;font-weight:700;color:var(--navy)">+€${a.price}</span>
              <div style="width:44px;height:24px;border-radius:12px;background:${state.addons[a.key]?'var(--blue)':'var(--gray-200)'};position:relative;transition:all 0.2s">
                <div style="width:20px;height:20px;border-radius:50%;background:white;position:absolute;top:2px;left:${state.addons[a.key]?'22px':'2px'};transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card card-body">
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Selected Add-ons</h3>
      ${addons.filter(a=>state.addons[a.key]).map(a=>`
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-100);font-size:13px">
          <span style="display:flex;align-items:center;gap:6px"><span style="color:var(--green)">${icons.check}</span>${a.label}</span>
          <span style="font-weight:600">€${a.price}</span>
        </div>
      `).join('')}
      <div style="background:var(--blue-pale);border-radius:10px;padding:16px;text-align:center;margin-top:16px">
        <div style="font-size:13px;color:var(--gray-500);margin-bottom:4px">Updated Premium</div>
        <div style="font-size:28px;font-weight:700;color:var(--navy)">€${(312.45+addons.filter(a=>state.addons[a.key]).reduce((s,a)=>s+a.price,0)).toFixed(2)}</div>
        <div style="font-size:12px;color:var(--gray-400)">for 10 Days (Taxes included)</div>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-secondary" onclick="pbBack()">← Back</button>
        <button class="btn btn-primary" style="flex:1" onclick="pbNext()">Next: Pricing →</button>
      </div>
    </div>
  </div>`;
}

function renderPBPricing(stepHtml) {
  const addonsTotal = (state.addons.adventureSports?25:0)+(state.addons.cruise?30:0)+(state.addons.gadgets?15:0)+(state.addons.pregnancy?40:0)+(state.addons.rentalVehicle?20:0);
  const total = 312.45 + addonsTotal;
  return `
  <div class="page-header"><h1 class="page-title">Dynamic Pricing</h1><p class="page-sub">Live Premium Breakdown</p></div>
  ${stepHtml}
  <div class="grid-2" style="gap:20px">
    <div class="card card-body" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:20px;align-self:flex-start">Premium updated based on your selections</h3>
      <div style="width:200px;height:200px;position:relative;margin-bottom:20px">
        <svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg)">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gray-100)" stroke-width="12"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--blue)" stroke-width="12" stroke-dasharray="${(312.45/total)*251} 251"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--accent)" stroke-width="12" stroke-dasharray="${(addonsTotal/total)*251} 251" stroke-dashoffset="-${(312.45/total)*251}"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--yellow)" stroke-width="12" stroke-dasharray="${(25/total)*251} 251" stroke-dashoffset="-${((312.45+addonsTotal)/total)*251}"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--red)" stroke-width="12" stroke-dasharray="${((-25)/total)*251} 251" stroke-dashoffset="-${((312.45+addonsTotal+25)/total)*251}"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div style="font-size:24px;font-weight:700;color:var(--navy)">€${total.toFixed(2)}</div>
          <div style="font-size:11px;color:var(--gray-400)">Total Premium</div>
        </div>
      </div>
      <div style="width:100%;display:flex;flex-direction:column;gap:8px">
        ${[['Base Premium','€312.45','var(--blue)'],['Add-ons',`€${addonsTotal}`,'var(--accent)'],['Taxes & Fees','€25.00','var(--yellow)'],['Discount','-€25.00','var(--red)']].map(([l,v,c])=>`
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--gray-100)">
            <span style="display:flex;align-items:center;gap:8px"><span style="width:10px;height:10px;border-radius:50%;background:${c};display:inline-block"></span>${l}</span>
            <span style="font-weight:600">${v}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card card-body">
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Trip Summary</h3>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
        ${[['Destination','Europe'],['Trip Duration','10 Days'],['Travelers','2 Adults'],['Policy Type','Leisure']].map(([k,v])=>`
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid var(--gray-100)">
            <span style="color:var(--gray-500)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span>
          </div>
        `).join('')}
      </div>
      <div style="background:var(--accent-light);border-radius:8px;padding:12px;font-size:12px;color:#0a9880;margin-bottom:20px">
        🎉 You are saving €25.00 with our online discount!
      </div>
      <div style="background:var(--navy);border-radius:10px;padding:20px;text-align:center;color:white;margin-bottom:16px">
        <div style="font-size:13px;opacity:0.7;margin-bottom:4px">Total Premium</div>
        <div style="font-size:32px;font-weight:700">€${total.toFixed(2)}</div>
        <div style="font-size:12px;opacity:0.6">(Taxes included)</div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary" onclick="pbBack()">← Back</button>
        <button class="btn btn-primary" style="flex:1" onclick="pbNext()">Next: Risk Indicator →</button>
      </div>
    </div>
  </div>`;
}

function renderPBRisk(stepHtml) {
  return `
  <div class="page-header"><h1 class="page-title">Risk Indicator</h1><p class="page-sub">Your Risk Assessment</p></div>
  ${stepHtml}
  <div class="grid-2" style="gap:20px">
    <div class="card card-body">
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:20px">Based on your trip details</h3>
      <div style="text-align:center;margin-bottom:24px">
        <div style="position:relative;width:200px;height:110px;margin:0 auto 16px">
          <svg viewBox="0 0 200 110" style="width:100%;height:100%">
            <defs><linearGradient id="riskGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#22C55E"/><stop offset="50%" stop-color="#EAB308"/><stop offset="100%" stop-color="#EF4444"/></linearGradient></defs>
            <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--gray-100)" stroke-width="20" stroke-linecap="round"/>
            <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#riskGrad)" stroke-width="16" stroke-linecap="round" opacity="0.8"/>
            <!-- Needle at 62% -->
            <line x1="100" y1="100" x2="${100+75*Math.cos(Math.PI*(1-0.62))}" y2="${100-75*Math.sin(Math.PI*(1-0.62))}" stroke="var(--navy)" stroke-width="3" stroke-linecap="round"/>
            <circle cx="100" cy="100" r="8" fill="var(--navy)"/>
          </svg>
        </div>
        <div style="font-size:22px;font-weight:700;color:var(--navy)">Medium Risk</div>
        <div style="font-size:13px;color:var(--gray-500)">Risk Score: 62/100</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${[['Destination Risk','Medium','var(--yellow)'],['Medical Risk','Low','var(--green)'],['Trip Risk','Medium','var(--yellow)'],['Weather Risk','Low','var(--green)'],['Security Risk','Medium','var(--yellow)']].map(([l,v,c])=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--gray-50);border-radius:6px;font-size:13px">
            <span style="color:var(--navy)">${l}</span>
            <span class="badge" style="background:${c}22;color:${c}">${v}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card card-body">
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Why this score?</h3>
      <div class="alert alert-warning" style="margin-bottom:16px">Your destination has moderate medical and weather risks.</div>
      <h4 style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:12px">Tips to Reduce Risk</h4>
      ${['Purchase higher medical coverage','Check travel advisories before you go','Avoid high-risk adventure activities'].map(t=>`
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--gray-100);font-size:13px;color:var(--gray-600)">
          <span style="color:var(--green)">${icons.check}</span> ${t}
        </div>
      `).join('')}
      <div style="margin-top:20px;background:var(--blue-pale);border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:12px;color:var(--gray-500)">Recommended coverage based on risk</div>
        <div style="font-size:20px;font-weight:700;color:var(--navy);margin:6px 0">€1,50,000 Medical Cover</div>
        <button class="btn btn-outline btn-sm" onclick="showToast('Coverage updated to recommended level!','success')">Apply Recommendation</button>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-secondary" onclick="pbBack()">← Back</button>
        <button class="btn btn-primary" style="flex:1" onclick="pbNext()">Next: Purchase →</button>
      </div>
    </div>
  </div>`;
}

function renderPBPurchase(stepHtml) {
  return `
  <div class="page-header"><h1 class="page-title">Policy Purchase</h1><p class="page-sub">Review & Pay</p></div>
  ${stepHtml}
  <div class="grid-2" style="gap:20px">
    <div class="card card-body">
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Policy Summary</h3>
      ${[['Destination','Europe'],['Trip Duration','10 Days (20 May – 30 May 2025)'],['Travelers','2 Adults'],['Policy Type','Leisure']].map(([k,v])=>`
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid var(--gray-100)">
          <span style="color:var(--gray-500)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span>
        </div>
      `).join('')}
      <div style="margin-top:16px">
        <div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:8px">Coverage Summary</div>
        ${[['Trip Cancellation','€75,000'],['Medical Expenses','€1,50,000'],['Baggage Loss','€2,500'],['Trip Delay','€200']].map(([k,v])=>`
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--gray-100)">
            <span style="color:var(--gray-600)">${k}</span><span style="font-weight:500;color:var(--navy)">${v}</span>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:16px">
        <div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:8px">Add-ons</div>
        ${[['Adventure Sports Cover','€25'],['Cruise Cover','€30'],['Electronic Gadgets Cover','€15']].map(([k,v])=>`
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--gray-100)">
            <span style="display:flex;align-items:center;gap:6px;color:var(--gray-600)"><span style="color:var(--blue)">${icons.check}</span>${k}</span><span style="font-weight:500;color:var(--navy)">${v}</span>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:16px;padding:14px;background:var(--gray-50);border-radius:8px">
        ${[['Base Premium','€312.45'],['Add-ons Total','€70.00'],['Taxes & Fees','€25.00'],['Discount','-€25.00']].map(([k,v])=>`
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0">
            <span style="color:var(--gray-500)">${k}</span><span style="font-weight:500">${v}</span>
          </div>
        `).join('')}
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:var(--navy);padding-top:8px;border-top:1.5px solid var(--gray-200);margin-top:4px">
          <span>Total Amount</span><span>€382.45</span>
        </div>
      </div>
    </div>
    <div class="card card-body">
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Payment Methods</h3>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
        ${[
          {id:'card',label:'Credit / Debit Card',sub:'Visa • Mastercard • RuPay',selected:true},
          {id:'netbanking',label:'Net Banking',sub:'All major banks supported',selected:false},
          {id:'upi',label:'UPI',sub:'GPay, PhonePe, Paytm',selected:false},
          {id:'wallet',label:'Wallets',sub:'Paytm, Amazon Pay',selected:false},
        ].map(m=>`
          <label style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:1.5px solid ${m.selected?'var(--blue)':'var(--gray-200)'};border-radius:8px;cursor:pointer;background:${m.selected?'var(--blue-pale)':'white'}">
            <input type="radio" name="payment" ${m.selected?'checked':''} style="accent-color:var(--blue)">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${m.label}</div>
              <div style="font-size:11px;color:var(--gray-400)">${m.sub}</div>
            </div>
          </label>
        `).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--gray-400);margin-bottom:16px">
        🔒 Your payment is secured
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary" onclick="pbBack()">← Back</button>
        <button class="btn btn-primary" style="flex:1;background:var(--green)" onclick="pbNext()">Pay €382.45 🔒</button>
      </div>
    </div>
  </div>`;
}

function renderPBConfirm() {
  return `
  <div style="max-width:600px;margin:40px auto">
    <div class="card card-body" style="text-align:center">
      <div style="width:72px;height:72px;border-radius:50%;background:var(--accent-light);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px">✓</div>
      <h2 style="font-size:24px;font-weight:700;color:var(--navy);margin-bottom:8px">Congratulations! 🎉</h2>
      <p style="color:var(--gray-500);margin-bottom:24px">Your policy has been purchased successfully.</p>
      <div style="background:var(--gray-50);border-radius:10px;padding:20px;margin-bottom:24px;text-align:left">
        <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">Policy Details</h3>
        ${[['Policy Number','TRV125240520001'],['Policy Start Date','20 May 2025'],['Policy End Date','30 May 2025'],['Total Premium','€382.45']].map(([k,v])=>`
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid var(--gray-100)">
            <span style="color:var(--gray-500)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px;font-size:13px;color:var(--gray-600)">
        <div style="display:flex;align-items:flex-start;gap:10px"><span>📧</span>You will receive policy confirmation on your registered email.</div>
        <div style="display:flex;align-items:flex-start;gap:10px"><span>📄</span>Keep your policy document handy while traveling.</div>
        <div style="display:flex;align-items:flex-start;gap:10px"><span>📍</span>Need help? Contact our 24/7 support.</div>
      </div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-secondary" onclick="showToast('Downloading policy...','info')">⬇ Download Policy</button>
        <button class="btn btn-outline" onclick="showToast('Policy shared!','success')">↗ Share Policy</button>
        <button class="btn btn-primary" onclick="navigateTo('my-policies')">Go to My Policies</button>
      </div>
    </div>
  </div>`;
}

// ===== CLAIM SUBMISSION =====
function renderClaimSubmission() {
  const claimSteps = ['Claim Details','Upload Documents','Review & Submit','Confirmation'];
  const stepHtml = `
    <div class="steps">
      ${claimSteps.map((s,i)=>`
        <div class="step ${i+1<state.claimStep?'completed':i+1===state.claimStep?'active':''}">
          <div class="step-circle">${i+1<state.claimStep?icons.check:i+1}</div>
          <div class="step-label">${s}</div>
        </div>
      `).join('')}
    </div>`;

  switch(state.claimStep) {
    case 1: return renderClaimDetails(stepHtml);
    case 2: return renderClaimDocuments(stepHtml);
    case 3: return renderClaimReview(stepHtml);
    case 4: return renderClaimConfirmation();
    default: return renderClaimDetails(stepHtml);
  }
}

function claimNext() { state.claimStep++; document.getElementById('customer-main').innerHTML=renderClaimSubmission(); document.getElementById('customer-main').scrollTop=0; }
function claimBack() { state.claimStep--; document.getElementById('customer-main').innerHTML=renderClaimSubmission(); document.getElementById('customer-main').scrollTop=0; }

function renderClaimDetails(stepHtml) {
  return `
  <div class="page-header"><h1 class="page-title">Claim Submission</h1><p class="page-sub">File a new insurance claim</p></div>
  ${stepHtml}
  <div class="card card-body" style="max-width:700px">
    <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:20px">Claim Type</h3>
    <div class="grid-4" style="margin-bottom:24px">
      ${[
        {label:'Medical Expense',desc:'Hospitalization, treatment expenses',icon:'🏥',selected:true},
        {label:'Trip Cancellation',desc:'Trip cancelled due to unforeseen events',icon:'✈️',selected:false},
        {label:'Baggage Loss',desc:'Loss or damage of baggage',icon:'🧳',selected:false},
        {label:'Others',desc:'Other claim types',icon:'📋',selected:false},
      ].map((t,i)=>`
        <div class="coverage-type ${t.selected?'selected':''}" onclick="this.parentNode.querySelectorAll('.coverage-type').forEach(c=>c.classList.remove('selected'));this.classList.add('selected')">
          <div class="coverage-type-icon">${t.icon}</div>
          <div style="font-size:13px;font-weight:600;color:var(--navy)">${t.label}</div>
          <div style="font-size:11px;color:var(--gray-400);margin-top:4px">${t.desc}</div>
        </div>
      `).join('')}
    </div>
    <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Policy Details</h3>
    <div class="grid-4" style="margin-bottom:20px">
      <div class="form-group">
        <label class="form-label">Policy Number</label>
        <select class="form-select"><option>TRV125240520001</option><option>TRV123456</option><option>TRV123457</option></select>
      </div>
      <div class="form-group">
        <label class="form-label">Policy Holder</label>
        <input type="text" class="form-input" value="John Doe" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">Policy Type</label>
        <input type="text" class="form-input" value="Annual Multi Trip" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">Policy Validity</label>
        <input type="text" class="form-input" value="20 May 2025 – 30 May 2026" readonly>
      </div>
    </div>
    <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Claim Details</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">
      <div class="form-group">
        <label class="form-label">Date of Incident</label>
        <input type="date" class="form-input" value="2025-05-19">
      </div>
      <div class="form-group">
        <label class="form-label">Place of Incident</label>
        <input type="text" class="form-input" value="Dubai, UAE">
      </div>
      <div class="form-group">
        <label class="form-label">Amount Claimed (EUR)</label>
        <input type="number" class="form-input" id="claim-amount" value="850.00">
      </div>
    </div>
    <div class="form-group" style="margin-bottom:20px">
      <label class="form-label">Description of Incident</label>
      <textarea class="form-input" rows="4" id="claim-desc" maxlength="500" style="resize:vertical">I was hospitalized due to severe stomach infection and treatment expenses were incurred.</textarea>
      <div style="font-size:11px;color:var(--gray-400);margin-top:4px;text-align:right">91 / 500</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-secondary" onclick="navigateTo('dashboard')">Cancel</button>
      <button class="btn btn-primary" onclick="validateClaimDetails()">Next: Upload Documents →</button>
    </div>
  </div>`;
}

function validateClaimDetails() {
  const amount = document.getElementById('claim-amount').value;
  const desc = document.getElementById('claim-desc').value.trim();
  if (!amount || parseFloat(amount) <= 0) { showToast('Please enter a valid claim amount', 'error'); return; }
  if (!desc || desc.length < 10) { showToast('Please provide a description of the incident', 'error'); return; }
  claimNext();
}

function renderClaimDocuments(stepHtml) {
  const files = [
    {name:'Hospital_Bill.pdf',type:'PDF',size:'1.2 MB'},
    {name:'Prescription.jpg',type:'JPG',size:'850 KB'},
    {name:'Payment_Receipt.pdf',type:'PDF',size:'1.0 MB'},
    {name:'ID_Proof.jpg',type:'JPG',size:'620 KB'},
  ];
  return `
  <div class="page-header"><h1 class="page-title">Upload Documents</h1><p class="page-sub">Please upload clear and legible documents</p></div>
  ${stepHtml}
  <div class="card card-body" style="max-width:700px">
    <div class="alert alert-info" style="margin-bottom:20px">Please upload clear and legible documents. Max file size: 5MB each. Supported: PDF, JPG, PNG</div>
    <div class="grid-2" style="gap:20px;margin-bottom:20px">
      <div>
        <div class="upload-area" onclick="showToast('File browser opened (demo)','info')">
          <div class="upload-icon">☁️</div>
          <div style="font-size:13px;color:var(--gray-600);margin-bottom:4px">Drag and drop files here or <span style="color:var(--blue);cursor:pointer">click to browse</span></div>
          <div style="font-size:11px;color:var(--gray-400)">PDF, JPG, PNG (Max 5MB each)</div>
        </div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--gray-500);margin-bottom:10px">Uploaded Files</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${files.map(f=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--gray-50);border-radius:6px;font-size:12px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:16px">${f.type==='PDF'?'📄':'🖼'}</span>
                <div><div style="font-weight:500;color:var(--navy)">${f.name}</div><div style="color:var(--gray-400)">${f.type} • ${f.size}</div></div>
              </div>
              <div style="display:flex;gap:6px">
                <button class="btn btn-ghost btn-xs" onclick="showToast('Viewing file...','info')">👁</button>
                <button class="btn btn-ghost btn-xs" onclick="this.closest('[style]').remove();showToast('File removed','info')" style="color:var(--red)">🗑</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-secondary" onclick="claimBack()">← Back</button>
      <button class="btn btn-primary" onclick="claimNext()">Next: Review & Submit →</button>
    </div>
  </div>`;
}

function renderClaimReview(stepHtml) {
  return `
  <div class="page-header"><h1 class="page-title">Review & Submit</h1><p class="page-sub">Review your claim details before submitting</p></div>
  ${stepHtml}
  <div class="card card-body" style="max-width:700px">
    <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Claim Summary</h3>
    <div style="background:var(--gray-50);border-radius:10px;padding:18px;margin-bottom:16px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        ${[['Claim Type','Medical Expense'],['Policy Number','TRV125240520001'],['Policy Holder','John Doe'],['Date of Incident','19 May 2025'],['Place of Incident','Dubai, UAE'],['Amount Claimed','€850.00']].map(([k,v])=>`
          <div><div style="font-size:11px;color:var(--gray-400);margin-bottom:2px">${k}</div><div style="font-size:13px;font-weight:600;color:var(--navy)">${v}</div></div>
        `).join('')}
      </div>
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:8px">Description</div>
      <p style="font-size:13px;color:var(--gray-600);background:var(--gray-50);padding:12px;border-radius:8px">I was hospitalized due to severe stomach infection and treatment expenses were incurred.</p>
    </div>
    <div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:8px">Uploaded Documents (4 files)</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${['Hospital_Bill.pdf','Prescription.jpg','Payment_Receipt.pdf','ID_Proof.jpg'].map(f=>`
          <span style="padding:5px 10px;background:var(--blue-pale);border-radius:16px;font-size:12px;color:var(--blue)">📎 ${f}</span>
        `).join('')}
      </div>
    </div>
    <div class="alert alert-info" style="margin-bottom:20px">
      By submitting, you confirm that all information provided is accurate and truthful. False claims may result in policy cancellation.
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-secondary" onclick="claimBack()">← Back</button>
      <button class="btn btn-primary btn-lg" onclick="claimNext()">Review & Submit →</button>
    </div>
  </div>`;
}

function renderClaimConfirmation() {
  return `
  <div style="max-width:600px;margin:40px auto">
    <div class="card card-body" style="text-align:center">
      <div style="font-size:56px;margin-bottom:16px">✅</div>
      <h2 style="font-size:24px;font-weight:700;color:var(--navy);margin-bottom:8px">Claim Submitted Successfully!</h2>
      <p style="color:var(--gray-500);margin-bottom:24px">Your claim has been received and is being processed.</p>
      <div style="background:var(--blue-pale);border-radius:10px;padding:20px;margin-bottom:24px;text-align:left">
        ${[['Claim ID','CLM125240520045'],['Policy Number','TRV125240520001'],['Claim Type','Medical Expense'],['Amount Claimed','€850.00'],['Status','Under Review'],['Submitted On','19 May 2025, 10:30 AM']].map(([k,v])=>`
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(30,79,216,0.1)">
            <span style="color:var(--gray-500)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;color:var(--gray-500);margin-bottom:20px">
        📧 You will receive email updates on your claim progress.
      </div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-outline" onclick="navigateTo('claim-tracking')">Track Claim →</button>
        <button class="btn btn-primary" onclick="navigateTo('dashboard')">Back to Dashboard</button>
      </div>
    </div>
  </div>`;
}

// ===== CLAIM TRACKING =====
function renderClaimTracking() {
  return `
  <div class="page-header"><h1 class="page-title">Claim Tracking</h1><p class="page-sub">Track your claim status in real-time</p></div>
  <div class="grid-2" style="gap:20px">
    <div>
      <div class="card" style="margin-bottom:16px">
        <div style="padding:16px 20px;background:var(--gray-50);border-bottom:1px solid var(--gray-100)">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px">
            ${[['Claim ID','CLM125240520045'],['Policy Number','TRV125240520001'],['Claim Type','Medical Expense'],['Claimed Amount','€850.00']].map(([k,v])=>`
              <div><div style="font-size:11px;color:var(--gray-400)">${k}</div><div style="font-size:13px;font-weight:600;color:var(--navy)">${v}</div></div>
            `).join('')}
          </div>
        </div>
        <div style="padding:16px 20px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <div>
              <span style="font-size:13px;color:var(--gray-500)">Current Status </span>
              <span class="badge badge-yellow" style="margin-left:4px">Under Review</span>
            </div>
          </div>
          <p style="font-size:13px;color:var(--gray-600);margin-bottom:20px">Your claim is being reviewed by our claims team.</p>
          
          <h4 style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:16px">Claim Progress</h4>
          <div style="display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding-bottom:8px">
            ${[
              {label:'Claim Submitted',date:'19 May 2025',time:'10:30 AM',status:'done'},
              {label:'Documents Received',date:'19 May 2025',time:'11:05 AM',status:'done'},
              {label:'Under Review',date:'20 May 2025',time:'02:15 PM',status:'active'},
              {label:'Assessment',date:'Pending',time:'',status:'pending'},
              {label:'Decision',date:'Pending',time:'',status:'pending'},
              {label:'Payment',date:'Pending',time:'',status:'pending'},
            ].map((s,i,arr)=>`
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;min-width:80px;position:relative">
                ${i<arr.length-1?`<div style="position:absolute;top:16px;left:50%;width:100%;height:2px;background:${s.status!=='pending'?'var(--blue)':'var(--gray-200)'};z-index:0"></div>`:''}
                <div style="width:32px;height:32px;border-radius:50%;z-index:1;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;
                  ${s.status==='done'?'background:var(--blue);color:white;':s.status==='active'?'background:var(--blue);color:white;box-shadow:0 0 0 4px rgba(30,79,216,0.15);':'background:white;border:2px solid var(--gray-200);color:var(--gray-400);'}">
                  ${s.status==='done'?icons.check:s.status==='active'?`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`:i+1}
                </div>
                <div style="font-size:10px;font-weight:600;color:${s.status==='pending'?'var(--gray-400)':'var(--navy)'};text-align:center;margin-top:6px;line-height:1.3">${s.label}</div>
                ${s.date!=='Pending'?`<div style="font-size:10px;color:var(--gray-400);text-align:center">${s.date}</div><div style="font-size:10px;color:var(--gray-400)">${s.time}</div>`:'<div style="font-size:10px;color:var(--gray-400)">Pending</div>'}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="card card-body">
        <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Timeline</h3>
        <div class="timeline">
          ${[
            {title:'Claim Submitted',desc:'Your claim has been submitted successfully.',date:'19 May 2025, 10:30 AM',status:'done'},
            {title:'Documents Received',desc:'We have received your claim documents.',date:'19 May 2025, 11:05 AM',status:'done'},
            {title:'Under Review',desc:'Your claim is under review by our claims team.',date:'20 May 2025, 02:15 PM',status:'active'},
            {title:'Assessment',desc:'We will assess your claim and may contact you if additional information is required.',date:'Pending',status:'pending'},
            {title:'Decision',desc:'The decision on your claim will be communicated.',date:'Pending',status:'pending'},
            {title:'Payment',desc:'Once approved, payment will be initiated.',date:'Pending',status:'pending'},
          ].map(t=>`
            <div class="timeline-item">
              <div class="timeline-dot ${t.status}">
                ${t.status==='done'?icons.check:t.status==='active'?'●':'○'}
              </div>
              <div class="timeline-content">
                <div class="timeline-title">${t.title}</div>
                <div class="timeline-desc">${t.desc}</div>
                <div class="timeline-time">${t.date}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div>
      <div class="card card-body" style="margin-bottom:16px">
        <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Claim Details</h3>
        ${[['Destination','Dubai, UAE'],['Date of Incident','19 May 2025'],['Policy Type','Annual Multi Trip'],['Travelers','2 Adults'],['Claimed Amount','€850.00']].map(([k,v])=>`
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid var(--gray-100)">
            <span style="color:var(--gray-400)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span>
          </div>
        `).join('')}
        <button class="btn btn-outline btn-block" style="margin-top:16px" onclick="showToast('Loading claim summary...','info')">👁 View Claim Summary</button>
      </div>
      <div class="card card-body">
        <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:8px">Need Help?</h3>
        <p style="font-size:13px;color:var(--gray-500);margin-bottom:14px">If you have any queries, feel free to contact our support team.</p>
        <button class="btn btn-primary btn-block" onclick="navigateTo('support')">💬 Contact Support</button>
        <div style="text-align:center;margin-top:12px;font-size:12px;color:var(--gray-400)">📧 You will receive email updates on your claim progress.</div>
      </div>
    </div>
  </div>`;
}

// ===== PROFILE =====
function renderProfile() {
  return `
  <div class="page-header"><h1 class="page-title">Profile Management</h1></div>
  <div class="tabs">
    <button class="tab-item active">Personal Information</button>
    <button class="tab-item" onclick="switchTab(this)">Contact Information</button>
    <button class="tab-item" onclick="switchTab(this)">Documents</button>
    <button class="tab-item" onclick="switchTab(this)">Change Password</button>
  </div>
  <div class="grid-2" style="gap:20px">
    <div class="card card-body">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Full Name</label><input type="text" class="form-input" value="John Doe"></div>
        <div class="form-group"><label class="form-label">Mobile Number</label><input type="text" class="form-input" value="+91 9876543210"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Date of Birth</label><input type="date" class="form-input" value="1990-06-15"></div>
        <div class="form-group"><label class="form-label">Nationality</label><select class="form-select"><option>Indian</option><option>American</option><option>British</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Gender</label><select class="form-select"><option>Male</option><option>Female</option><option>Other</option></select></div>
        <div class="form-group"><label class="form-label">Passport Number</label><input type="text" class="form-input" value="P1234567"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Email Address</label><input type="email" class="form-input" value="john.doe@example.com"></div>
        <div class="form-group"><label class="form-label">Passport Expiry</label><input type="date" class="form-input" value="2030-06-30"></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-primary" onclick="showToast('Profile updated successfully!','success')">Save Changes</button>
        <button class="btn btn-secondary">Cancel</button>
      </div>
    </div>
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:16px">Profile Completion</h3>
      <div style="position:relative;width:120px;height:120px;margin:0 auto 16px">
        <svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg)">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gray-100)" stroke-width="10"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--blue)" stroke-width="10" stroke-dasharray="${0.8*251} 251" stroke-linecap="round"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div style="font-size:22px;font-weight:700;color:var(--navy)">80%</div>
          <div style="font-size:10px;color:var(--gray-400)">Complete</div>
        </div>
      </div>
      ${[
        {label:'Personal Information',done:true},
        {label:'Contact Information',done:true},
        {label:'Identity Documents',done:true},
        {label:'Change Password',done:true},
        {label:'Communication Preferences',done:false},
      ].map(i=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-100);font-size:13px">
          <span style="color:var(--gray-700)">${i.label}</span>
          <span style="color:${i.done?'var(--green)':'var(--gray-300)'}">${i.done?icons.check:'○'}</span>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function switchTab(btn) {
  btn.closest('.tabs').querySelectorAll('.tab-item').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  showToast('Tab content loaded','info');
}

// ===== NOTIFICATIONS =====
function renderNotifications() {
  const notifs = [
    {title:'Your policy TRV123456 is now active.',sub:'Europe Travel Plan policy is successfully activated.',time:'20 May 2025, 10:30 AM',icon:'🛡',unread:true,type:'green'},
    {title:'Claim CLM20240512001 is under review.',sub:"We have received your documents and our team is reviewing your claim.",time:'20 May 2025, 09:15 AM',icon:'📋',unread:true,type:'orange'},
    {title:'Payment of ₹8,450 received.',sub:'Thank you! Your payment for policy TRV123457 is confirmed.',time:'19 May 2025, 05:40 PM',icon:'💰',unread:true,type:'green'},
    {title:'Upcoming trip reminder',sub:'Your Asia Adventure Plan policy will start in 20 days.',time:'18 May 2025, 11:20 AM',icon:'✈️',unread:false,type:'blue'},
    {title:'System Maintenance',sub:'Our system will be under maintenance on 25 May from 1:00 AM to 3:00 AM.',time:'17 May 2025, 04:00 PM',icon:'⚙️',unread:false,type:'gray'},
  ];
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">Notification Center</h1><p class="page-sub">Stay updated with your policies and claims</p></div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-secondary btn-sm" onclick="showToast('All notifications marked as read','success')">Mark all as read</button>
      <button class="btn btn-ghost btn-sm">⚙ Settings</button>
    </div>
  </div>
  <div class="tabs"><button class="tab-item active">All</button><button class="tab-item" onclick="switchTab(this)">Policy</button><button class="tab-item" onclick="switchTab(this)">Claims</button><button class="tab-item" onclick="switchTab(this)">Payments</button><button class="tab-item" onclick="switchTab(this)">System</button></div>
  <div class="card" style="overflow:hidden">
    ${notifs.map(n=>`
      <div style="padding:14px 20px;border-bottom:1px solid var(--gray-100);display:flex;align-items:flex-start;gap:14px;background:${n.unread?'rgba(30,79,216,0.02)':'white'};cursor:pointer" onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background='${n.unread?'rgba(30,79,216,0.02)':'white'}'">
        <div style="width:38px;height:38px;border-radius:10px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${n.icon}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:${n.unread?'600':'500'};color:var(--navy);margin-bottom:2px">${n.title}</div>
          <div style="font-size:12px;color:var(--gray-500)">${n.sub}</div>
          <div style="font-size:11px;color:var(--gray-400);margin-top:4px">${n.time}</div>
        </div>
        ${n.unread?`<div style="width:8px;height:8px;border-radius:50%;background:var(--blue);flex-shrink:0;margin-top:6px"></div>`:''}
      </div>
    `).join('')}
    <div style="padding:14px 20px;text-align:center">
      <button class="btn btn-ghost btn-sm" style="color:var(--blue)">View All Notifications →</button>
    </div>
  </div>`;
}

function renderDocuments() {
  return `
  <div class="page-header"><h1 class="page-title">My Documents</h1></div>
  <div class="card">
    <div class="card-header" style="justify-content:space-between">
      <span class="card-title">All Documents</span>
      <button class="btn btn-primary btn-sm" onclick="showToast('Upload dialog (demo)','info')">+ Upload Document</button>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Document Name</th><th>Type</th><th>Related To</th><th>Uploaded On</th><th>Size</th><th>Action</th></tr></thead><tbody>
      ${[
        ['Passport Copy','Identity','Profile','10 Jan 2025','2.1 MB'],
        ['Hospital_Bill.pdf','Claim','CLM125240520045','19 May 2025','1.2 MB'],
        ['Policy_TRV123456.pdf','Policy','TRV123456','20 Apr 2025','580 KB'],
        ['Prescription.jpg','Claim','CLM125240520045','19 May 2025','850 KB'],
      ].map(([name,type,rel,date,size])=>`
        <tr>
          <td style="font-weight:500;color:var(--navy)">${icons.file} ${name}</td>
          <td><span class="badge badge-blue">${type}</span></td>
          <td style="color:var(--blue);font-size:12px">${rel}</td>
          <td style="color:var(--gray-500)">${date}</td>
          <td style="color:var(--gray-500)">${size}</td>
          <td><button class="btn btn-ghost btn-xs" style="color:var(--blue)" onclick="showToast('Downloading...','info')">⬇ Download</button></td>
        </tr>
      `).join('')}
    </tbody></table></div>
  </div>`;
}

function renderSupport() {
  return `
  <div class="page-header"><h1 class="page-title">Support Center</h1></div>
  <div class="grid-2" style="gap:20px">
    <div class="card card-body">
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px">Get in Touch</h3>
      <div class="form-group"><label class="form-label">Subject</label><select class="form-select"><option>General Inquiry</option><option>Claim Support</option><option>Policy Query</option></select></div>
      <div class="form-group"><label class="form-label">Message</label><textarea class="form-input" rows="5" placeholder="Describe your issue..."></textarea></div>
      <button class="btn btn-primary" onclick="showToast('Support ticket submitted!','success')">Submit Ticket</button>
    </div>
    <div>
      <div class="card card-body" style="margin-bottom:16px">
        <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:12px">Contact Info</h3>
        ${[['📞','24/7 Helpline','+1-800-TRAVEL-1'],['📧','Email Support','support@travelinsure.com'],['💬','Live Chat','Available 9AM–9PM']].map(([ic,l,v])=>`
          <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--gray-100)">
            <span style="font-size:20px">${ic}</span>
            <div><div style="font-size:12px;color:var(--gray-400)">${l}</div><div style="font-size:13px;font-weight:600;color:var(--navy)">${v}</div></div>
          </div>
        `).join('')}
      </div>
      <div class="card card-body">
        <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:12px">FAQs</h3>
        ${['How do I file a claim?','What documents are required?','How long does claim processing take?','Can I extend my policy?'].map(q=>`
          <div style="padding:10px 0;border-bottom:1px solid var(--gray-100);font-size:13px;color:var(--blue);cursor:pointer" onclick="showToast('Opening FAQ...','info')">${q}</div>
        `).join('')}
      </div>
    </div>
  </div>`;
}

// ===== UNDERWRITER PAGES =====
function renderUWDashboard() {
  return `
  <div class="page-header">
    <h1 class="page-title">Underwriter Dashboard</h1>
    <p class="page-sub">John Doe (UW-001) — Manage your underwriting queue</p>
  </div>
  <div class="grid-4" style="margin-bottom:20px">
    ${[
      {label:'My Queue',val:'12',sub:'Cases',color:'var(--blue)',bg:'var(--blue-pale)'},
      {label:'In Review',val:'8',sub:'Cases',color:'var(--orange)',bg:'rgba(249,115,22,0.08)'},
      {label:'Escalated to L2',val:'3',sub:'Cases',color:'var(--red)',bg:'rgba(239,68,68,0.08)'},
      {label:'Completed Today',val:'15',sub:'Cases',color:'var(--green)',bg:'rgba(34,197,94,0.08)'},
    ].map(s=>`
      <div class="card stat-card">
        <div>
          <div class="stat-value" style="color:${s.color}">${s.val}</div>
          <div class="stat-label">${s.label}</div>
          <div style="font-size:12px;color:var(--gray-400);margin-top:4px">${s.sub}</div>
        </div>
        <div class="stat-icon" style="background:${s.bg}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
      </div>
    `).join('')}
  </div>
  <div class="card">
    <div class="card-header" style="justify-content:space-between">
      <span class="card-title">My Underwriting Queue</span>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm">⚙ Filter</button>
        <button class="btn btn-ghost btn-sm">↕ Sort</button>
      </div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Application ID</th><th>Applicant Name</th><th>Product</th><th>Sum Insured</th><th>Risk Score</th><th>Received On</th><th>SLA</th><th>Action</th></tr></thead>
      <tbody>
        ${[
          ['TRV2505200012','Rahul Verma','Europe Plan','€50,000','Low','20 May 2025','2h 15m'],
          ['TRV2505200013','Priya Sharma','Asia Plan','€75,000','Medium','20 May 2025','4h 20m'],
          ['TRV2505200014','Amit Kumar','Annual Multi Trip','€1,00,000','High','20 May 2025','1h 05m'],
          ['TRV2505200015','Neha Iyer','Europe Plan','€30,000','Low','19 May 2025','3h 40m'],
          ['TRV2505200016','Vikram Singh','Asia Plan','€60,000','Medium','19 May 2025','5h 20m'],
        ].map(([id,name,prod,sum,risk,date,sla])=>`
          <tr>
            <td style="font-weight:600;color:var(--blue);cursor:pointer" onclick="uwNavigateTo('uw-review')">${id}</td>
            <td>${name}</td>
            <td>${prod}</td>
            <td style="font-weight:600">${sum}</td>
            <td><span class="badge ${risk==='High'?'badge-red':risk==='Medium'?'badge-yellow':'badge-green'}">${risk}</span></td>
            <td style="color:var(--gray-500)">${date}</td>
            <td style="color:${sla<'2h'?'var(--red)':'var(--orange)'}">${sla}</td>
            <td><button class="btn btn-outline btn-xs" onclick="uwNavigateTo('uw-review')">View</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table></div>
    <div style="padding:14px 20px;text-align:center">
      <button class="btn btn-ghost btn-sm" style="color:var(--blue)" onclick="uwNavigateTo('uw-queue')">View All Queue →</button>
    </div>
  </div>`;
}

function renderUWQueue() {
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">My Queue</h1><p class="page-sub">All applications pending review</p></div>
  </div>
  <div style="display:flex;gap:2px;margin-bottom:16px">
    ${[['All','12','active'],['Pending Review','8',''],['Escalated','2',''],['On Hold','2','']].map(([l,c,a])=>`
      <button class="tab-item ${a}" onclick="this.parentNode.querySelectorAll('.tab-item').forEach(t=>t.classList.remove('active'));this.classList.add('active')">${l} <span style="background:${a?'var(--blue)':'var(--gray-200)'};color:${a?'white':'var(--gray-500)'};padding:1px 6px;border-radius:10px;font-size:11px;margin-left:4px">${c}</span></button>
    `).join('')}
  </div>
  ${renderUWDashboard().split('card-header')[1] ? '' : ''}
  <div class="card">
    <div style="padding:14px 16px;border-bottom:1px solid var(--gray-100);display:flex;gap:10px;flex-wrap:wrap">
      <input type="text" class="form-input" style="max-width:240px" placeholder="Search by Claim ID, Policy No., Insured">
      <select class="form-select" style="max-width:140px"><option>All Claim Types</option><option>Medical Expense</option><option>Trip Cancellation</option></select>
      <select class="form-select" style="max-width:130px"><option>All Priority</option><option>High</option><option>Medium</option><option>Low</option></select>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Application ID</th><th>Applicant</th><th>Product</th><th>Sum Insured</th><th>Risk Score</th><th>Received On</th><th>SLA</th><th>Action</th></tr></thead>
      <tbody>
        ${[
          ['TRV2505200012','Rahul Verma','Europe Plan','€50,000','Low','green','20 May 2025','2h 15m'],
          ['TRV2505200013','Priya Sharma','Asia Plan','€75,000','Medium','yellow','20 May 2025','4h 20m'],
          ['TRV2505200014','Amit Kumar','Annual Multi Trip','€1,00,000','High','red','20 May 2025','1h 05m'],
          ['TRV2505200015','Neha Iyer','Europe Plan','€30,000','Low','green','19 May 2025','3h 40m'],
          ['TRV2505200016','Vikram Singh','Asia Plan','€60,000','Medium','yellow','19 May 2025','5h 20m'],
        ].map(([id,name,prod,sum,risk,rc,date,sla])=>`
          <tr>
            <td style="font-weight:600;color:var(--blue);cursor:pointer" onclick="uwNavigateTo('uw-review')">${id}</td>
            <td>${name}</td><td>${prod}</td><td style="font-weight:600">${sum}</td>
            <td><span class="badge badge-${rc}">${risk}</span></td>
            <td style="color:var(--gray-500)">${date}</td><td>${sla}</td>
            <td><button class="btn btn-outline btn-xs" onclick="uwNavigateTo('uw-review')">View</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table></div>
  </div>`;
}

function renderRiskDetails() {
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">Risk Details & UW Decision</h1><p class="page-sub">Application: TRV2505200014 — Amit Kumar</p></div>
    <button class="btn btn-secondary btn-sm" onclick="uwNavigateTo('uw-queue')">← Back to Queue</button>
  </div>
  <div class="grid-2" style="gap:20px;margin-bottom:20px">
    <div class="card">
      <div style="padding:14px 20px;background:var(--gray-50);border-bottom:1px solid var(--gray-100);display:flex;gap:24px;flex-wrap:wrap">
        ${[['Application ID','TRV2505200014'],['Applicant Name','Amit Kumar'],['Received On','20 May 2025, 10:15 AM']].map(([k,v])=>`
          <div><div style="font-size:11px;color:var(--gray-400)">${k}</div><div style="font-size:13px;font-weight:600;color:var(--navy)">${v}</div></div>
        `).join('')}
      </div>
      <div class="card-body">
        <div class="tabs"><button class="tab-item active">Risk Overview</button><button class="tab-item" onclick="switchTab(this)">Applicant Information</button><button class="tab-item" onclick="switchTab(this)">Trip Details</button><button class="tab-item" onclick="switchTab(this)">History</button></div>
        <div class="grid-2" style="gap:20px">
          <div>
            <h4 style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:12px">Risk Score</h4>
            <div style="font-size:42px;font-weight:700;color:var(--red);line-height:1">72</div>
            <div style="font-size:13px;color:var(--gray-400);margin-bottom:8px">/ 100</div>
            <span class="badge badge-red">High Risk</span>
            <div style="margin-top:12px;background:var(--gray-100);border-radius:4px;height:10px;overflow:hidden">
              <div style="width:72%;height:100%;background:linear-gradient(90deg,var(--green),var(--yellow),var(--red));border-radius:4px"></div>
            </div>
            <div style="font-size:11px;font-weight:600;color:var(--navy);margin-top:16px;margin-bottom:8px">Risk Factors</div>
            ${[['Age','35 Years','green'],['Medical History','Asthma','yellow'],['Destination Risk','Russia','red'],['Trip Duration','45 Days','yellow'],['Previous Claims','1 Claim','green']].map(([k,v,c])=>`
              <div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid var(--gray-100)">
                <span style="color:var(--gray-600)">${k}</span>
                <span class="badge badge-${c}">${v}</span>
              </div>
            `).join('')}
          </div>
          <div>
            <h4 style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:12px">Rule Evaluation</h4>
            ${[
              {rule:'Destination Risk Rule',desc:'Travel to high risk country (Russia)',status:'Failed',color:'var(--red)',bg:'rgba(239,68,68,0.08)'},
              {rule:'Medical History Rule',desc:'Pre-existing condition: Asthma',status:'Partially Matched',color:'var(--yellow)',bg:'rgba(234,179,8,0.08)'},
              {rule:'Trip Duration Rule',desc:'Trip duration within acceptable limit',status:'Passed',color:'var(--green)',bg:'rgba(34,197,94,0.08)'},
              {rule:'Previous Claims Rule',desc:'No frequent claims in last 2 years',status:'Passed',color:'var(--green)',bg:'rgba(34,197,94,0.08)'},
            ].map(r=>`
              <div style="padding:10px;border-radius:8px;background:${r.bg};border-left:3px solid ${r.color};margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
                  <span style="font-size:12px;font-weight:600;color:var(--navy)">${r.rule}</span>
                  <span class="badge" style="background:${r.color}22;color:${r.color};font-size:10px">${r.status}</span>
                </div>
                <div style="font-size:11px;color:var(--gray-500)">${r.desc}</div>
              </div>
            `).join('')}
            <button class="btn btn-ghost btn-sm" style="color:var(--blue);padding-left:0" onclick="showToast('Loading rule engine details...','info')">View Rule Engine Details →</button>
          </div>
        </div>
      </div>
    </div>
    <div class="card card-body">
      <div style="display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap">
        ${[['Application ID','TRV2505200014'],['Applicant','Amit Kumar'],['Risk Score','72 / 100 – High Risk']].map(([k,v])=>`
          <div><div style="font-size:11px;color:var(--gray-400)">${k}</div><div style="font-size:13px;font-weight:600;color:var(--navy)">${v}</div></div>
        `).join('')}
      </div>
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:12px">Decision</h3>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${[
          {id:'approve',label:'Approve',desc:'Application meets underwriting guidelines',color:'var(--green)'},
          {id:'approve-cond',label:'Approve with Conditions',desc:'Approve with specific terms and conditions',color:'var(--yellow)'},
          {id:'reject',label:'Reject',desc:'Application does not meet underwriting guidelines',color:'var(--red)'},
          {id:'escalate',label:'Escalate to L2',desc:'Requires senior underwriter review',color:'var(--blue)',selected:true},
        ].map(d=>`
          <label style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1.5px solid ${d.selected?d.color:'var(--gray-200)'};border-radius:8px;cursor:pointer;background:${d.selected?d.color+'11':'white'}">
            <input type="radio" name="uw-decision" ${d.selected?'checked':''} style="margin-top:2px;accent-color:${d.color}">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${d.label}</div>
              <div style="font-size:11px;color:var(--gray-500)">${d.desc}</div>
            </div>
          </label>
        `).join('')}
      </div>
      <div class="form-group">
        <label class="form-label">Remarks (Optional)</label>
        <textarea class="form-input" rows="3" placeholder="Enter remarks for your decision..."></textarea>
      </div>
      <h4 style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:10px">Decision Summary</h4>
      <div style="background:var(--gray-50);border-radius:8px;padding:14px;margin-bottom:16px">
        ${[['Product','Annual Multi Trip'],['Sum Insured','€1,00,000'],['Trip Duration','45 Days'],['Destination','Russia, UAE'],['Policy Type','Leisure'],['Premium','€482.75']].map(([k,v])=>`
          <div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid var(--gray-100)">
            <span style="color:var(--gray-500)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary" onclick="uwNavigateTo('uw-queue')">Cancel</button>
        <button class="btn btn-primary" style="flex:1" onclick="submitUWDecision()">Submit Decision</button>
      </div>
    </div>
  </div>`;
}

function submitUWDecision() {
  showToast('Decision submitted successfully!', 'success');
  setTimeout(() => uwNavigateTo('uw-escalations'), 800);
}

function renderEscalation() {
  return `
  <div class="page-header"><h1 class="page-title">Escalation L2</h1><p class="page-sub">Cases requiring senior underwriter review</p></div>
  <div class="grid-2" style="gap:20px">
    <div class="card card-body">
      <div style="background:var(--gray-50);border-radius:8px;padding:14px;margin-bottom:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
          ${[['Application ID','TRV2505200014'],['Applicant','Amit Kumar'],['Escalated By','John Doe (UW-001)'],['Escalated On','20 May 2025, 11:30 AM'],['Reason','High Destination Risk']].map(([k,v])=>`
            <div><div style="font-size:11px;color:var(--gray-400)">${k}</div><div style="font-size:12px;font-weight:600;color:var(--navy)">${v}</div></div>
          `).join('')}
        </div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:8px">Escalation Notes</div>
        <p style="font-size:13px;color:var(--gray-600);background:var(--gray-50);padding:12px;border-radius:8px">Travel to high risk country (Russia) and medical history requires senior underwriter review.</p>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:8px">Previous UW Decision</div>
        <span class="badge badge-blue">Escalated to L2</span>
        <div style="font-size:12px;color:var(--gray-500);margin-top:8px">By John Doe (UW-001) on 20 May 2025, 11:30 AM</div>
        <div style="font-size:12px;color:var(--gray-400)">Remarks: High Destination Risk</div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:8px">Supporting Documents</div>
        ${['Applicant Medical Report.pdf','Travel Itinerary.pdf','Previous Policy.pdf'].map(f=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-100);font-size:13px">
            <span style="color:var(--blue)">${icons.file} ${f}</span>
            <button class="btn btn-ghost btn-xs" style="color:var(--blue)" onclick="showToast('Downloading...','info')">⬇ Download</button>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">L2 Underwriter Decision</h3>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${[
          {label:'Approve',desc:'Application meets underwriting guidelines',color:'var(--green)'},
          {label:'Approve with Conditions',desc:'Approve with specific terms and conditions',color:'var(--yellow)'},
          {label:'Reject',desc:'Application does not meet underwriting guidelines',color:'var(--red)'},
        ].map((d,i)=>`
          <label style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1.5px solid ${i===0?'var(--green)':'var(--gray-200)'};border-radius:8px;cursor:pointer;background:${i===0?'rgba(34,197,94,0.06)':'white'}">
            <input type="radio" name="l2-decision" ${i===0?'checked':''} style="margin-top:2px">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${d.label}</div>
              <div style="font-size:11px;color:var(--gray-500)">${d.desc}</div>
            </div>
          </label>
        `).join('')}
      </div>
      <div class="form-group">
        <label class="form-label">L2 Remarks (Mandatory)</label>
        <textarea class="form-input" rows="4" id="l2-remarks" placeholder="Enter remarks for L2 decision..."></textarea>
      </div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-secondary" onclick="uwNavigateTo('uw-review')">Send Back</button>
        <button class="btn btn-primary" style="flex:1" onclick="submitL2Decision()">Final Decision</button>
      </div>
    </div>
  </div>`;
}

function submitL2Decision() {
  const remarks = document.getElementById('l2-remarks').value;
  if (!remarks.trim()) { showToast('Please enter L2 remarks', 'error'); return; }
  showToast('L2 Final Decision submitted!', 'success');
  setTimeout(() => uwNavigateTo('audit-trail'), 800);
}

function renderAuditTrail() {
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">Audit Trail</h1><p class="page-sub">Track all system and workflow activities</p></div>
    <div style="display:flex;gap:10px">
      <input type="date" class="form-input" style="max-width:160px" value="2025-05-01">
      <input type="date" class="form-input" style="max-width:160px" value="2025-05-20">
      <button class="btn btn-secondary btn-sm">Filters</button>
      <button class="btn btn-outline btn-sm" onclick="showToast('Exporting audit log...','info')">⬇ Export</button>
    </div>
  </div>
  <div class="card" style="margin-bottom:16px">
    <div style="padding:14px 16px;background:var(--gray-50);border-bottom:1px solid var(--gray-100);display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:10px">
      ${[['Application ID','TRV2505200014'],['Applicant','Amit Kumar'],['Product','Annual Multi Trip'],['Sum Insured','€1,00,000'],['Current Status','Escalated to L2']].map(([k,v])=>`
        <div><div style="font-size:11px;color:var(--gray-400)">${k}</div><div style="font-size:13px;font-weight:600;color:var(--navy)">${v}</div></div>
      `).join('')}
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Date & Time</th><th>Action</th><th>By</th><th>Role</th><th>Remarks / Details</th></tr></thead>
      <tbody>
        ${[
          ['20 May 2025, 11:30 AM','Escalated to L2','John Doe','Underwriter','High destination risk (Russia) and medical history (Asthma)'],
          ['20 May 2025, 10:45 AM','Viewed Application','John Doe','Underwriter','Application reviewed'],
          ['20 May 2025, 10:20 AM','Risk Score Generated','System','System','Risk Score: 72/100 (High)'],
          ['20 May 2025, 10:15 AM','Application Submitted','Amit Kumar','Applicant','Application submitted by customer'],
        ].map(([dt,action,by,role,remarks])=>`
          <tr>
            <td style="color:var(--gray-500);white-space:nowrap">${dt}</td>
            <td style="font-weight:500;color:var(--blue)">${action}</td>
            <td>${by}</td>
            <td><span class="badge badge-navy" style="font-size:10px">${role}</span></td>
            <td style="color:var(--gray-600);font-size:12px">${remarks}</td>
          </tr>
        `).join('')}
      </tbody>
    </table></div>
    <div style="padding:14px 20px;text-align:center">
      <button class="btn btn-ghost btn-sm" style="color:var(--blue)">View Full Audit Log →</button>
    </div>
  </div>`;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  showPage('login');
  // Handle keyboard OTP navigation
  document.querySelectorAll('.otp-input').forEach((input, idx) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        const inputs = document.querySelectorAll('.otp-input');
        inputs[idx - 1].focus();
      }
    });
  });
});
