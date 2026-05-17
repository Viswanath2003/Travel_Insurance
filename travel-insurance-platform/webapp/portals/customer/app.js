/* ================================================================
   CUSTOMER PORTAL – Full Buy Policy Flow + All Sections
================================================================ */

// ===== PLAN DEFINITIONS =====
const PLANS = {
  basic: {
    id: 'basic', name: 'PolicyPilot Basic', tag: null, color: '#1E4FD8', bg: 'var(--blue-pale)',
    dailyRate: 150,
    tagline: 'Essential protection for budget-conscious travelers',
    inclusions: ['Emergency Medical Expenses', 'Trip Cancellation', 'Baggage Loss & Damage', 'Passport Loss', 'Personal Accident', 'Emergency Evacuation'],
    exclusions: ['Pre-existing Conditions', 'Adventure Sports', 'Business Equipment', 'Golf Equipment', 'Rental Car Damage'],
    limits: {
      'Emergency Medical': '₹25 Lakh',
      'Trip Cancellation': '₹50,000',
      'Baggage Loss': '₹25,000',
      'Passport Loss': '₹10,000',
      'Personal Accident': '₹10 Lakh',
      'Emergency Evacuation': '₹10 Lakh',
      'Daily Hospital Allowance': '₹500/day (max 15 days)',
    },
  },
  plus: {
    id: 'plus', name: 'PolicyPilot Plus', tag: 'Most Popular', color: '#00C2A8', bg: 'rgba(0,194,168,0.08)',
    dailyRate: 300,
    tagline: 'Comprehensive cover for the everyday explorer',
    inclusions: ['Emergency Medical Expenses', 'Trip Cancellation', 'Baggage Loss & Damage', 'Passport Loss', 'Personal Accident', 'Emergency Evacuation', 'Flight Delay (>4 hrs)', 'Pre-existing Conditions (partial)', 'Rental Car Damage', 'Home Burglary'],
    exclusions: ['Adventure Sports (extreme)', 'Golf Equipment', 'Business Equipment (>₹2L)'],
    limits: {
      'Emergency Medical': '₹75 Lakh',
      'Trip Cancellation': '₹1,50,000',
      'Baggage Loss': '₹75,000',
      'Passport Loss': '₹20,000',
      'Personal Accident': '₹30 Lakh',
      'Emergency Evacuation': '₹30 Lakh',
      'Flight Delay': '₹3,000 per 4 hrs (max ₹12,000)',
      'Pre-existing Conditions': '₹10 Lakh (listed conditions)',
      'Rental Car Damage': '₹75,000',
      'Home Burglary': '₹1,00,000',
      'Daily Hospital Allowance': '₹1,000/day (max 30 days)',
    },
  },
  pro: {
    id: 'pro', name: 'PolicyPilot Pro', tag: 'Premium', color: '#F97316', bg: 'rgba(249,115,22,0.08)',
    dailyRate: 550,
    tagline: 'Ultimate protection — no compromises, no exclusions',
    inclusions: ['Emergency Medical Expenses', 'Trip Cancellation', 'Baggage Loss & Damage', 'Passport Loss', 'Personal Accident', 'Emergency Evacuation', 'Flight Delay (>2 hrs)', 'All Pre-existing Conditions', 'Rental Car Damage', 'Home Burglary', 'Adventure Sports', 'Golf Equipment', 'Business Equipment', 'Legal Expenses', 'Hijack Allowance', 'Pet Care'],
    exclusions: ['Intentional Self-injury', 'War / Nuclear Events'],
    limits: {
      'Emergency Medical': '₹2 Crore',
      'Trip Cancellation': '₹3,00,000',
      'Baggage Loss': '₹2,00,000',
      'Passport Loss': '₹40,000',
      'Personal Accident': '₹1 Crore',
      'Emergency Evacuation': '₹1 Crore',
      'Flight Delay': '₹5,000 per 2 hrs (max ₹25,000)',
      'All Pre-existing Conditions': '₹30 Lakh',
      'Rental Car Damage': '₹2,00,000',
      'Adventure Sports': '₹50 Lakh',
      'Golf Equipment': '₹75,000',
      'Business Equipment': '₹5,00,000',
      'Legal Expenses': '₹3,00,000',
      'Hijack Allowance': '₹1,500/day (max 7 days)',
      'Daily Hospital Allowance': '₹2,500/day (max 60 days)',
    },
  },
};

const ADDONS = [
  { id: 'adventure', label: 'Adventure Sports Cover', desc: 'Skiing, scuba, bungee, paragliding & 50+ activities', price: 500, icon: '🏔️' },
  { id: 'rental',    label: 'Rental Car Protection',  desc: 'Collision damage waiver for rental vehicles', price: 400, icon: '🚗' },
  { id: 'golf',      label: 'Golf Equipment Cover',   desc: 'Equipment, green fees, hole-in-one', price: 350, icon: '⛳' },
  { id: 'business',  label: 'Business Equipment',     desc: 'Laptops, cameras, instruments up to ₹5L', price: 600, icon: '💼' },
  { id: 'preexist',  label: 'Pre-existing Conditions', desc: 'Extended cover for declared conditions', price: 800, icon: '❤️' },
  { id: 'home',      label: 'Home Burglary Cover',    desc: 'Protect your home while you travel', price: 300, icon: '🏠' },
];

const DESTINATIONS = [
  { label: 'India (Domestic)', value: 'india', mult: 0.7 },
  { label: 'South / South-East Asia', value: 'se_asia', mult: 1.0 },
  { label: 'Middle East / Africa', value: 'me_africa', mult: 1.3 },
  { label: 'Europe', value: 'europe', mult: 1.5 },
  { label: 'Australia / New Zealand', value: 'aus_nz', mult: 1.8 },
  { label: 'USA / Canada', value: 'usa_canada', mult: 2.0 },
  { label: 'Worldwide', value: 'worldwide', mult: 2.5 },
];

const TRIP_TYPES = [
  { label: 'Single Trip', value: 'single', mult: 1.0 },
  { label: 'Multi-trip (up to 3 trips)', value: 'multi', mult: 1.6 },
  { label: 'Annual Multi-trip', value: 'annual', mult: 2.8 },
];

// ===== BUY FLOW STATE =====
let buyState = {};

// ===== NAVIGATION =====
function navigate(section) {
  document.querySelectorAll('#sidebar .sidebar-item').forEach(b => {
    b.classList.toggle('active', b.dataset.section === section);
  });
  const main = document.getElementById('app-main');
  const renders = {
    dashboard:      renderDashboard,
    'my-policies':  renderMyPolicies,
    marketplace:    renderMarketplace,
    'buy-policy':   () => { buyState = {}; return renderBuyStep1(); },
    claims:         renderClaimSubmission,
    'track-claim':  renderClaimTracking,
    profile:        renderProfile,
    documents:      renderDocuments,
    support:        renderSupport,
  };
  main.innerHTML = (renders[section] || renderDashboard)();
  main.scrollTop = 0;
  const user = getSession();
  if (user) updateNotifBadge(user.role);
}

// ===== DASHBOARD =====
function renderDashboard() {
  const user = getSession();
  const firstName = (user?.fullName || user?.name || 'there').split(' ')[0];
  const policies = getStoredPolicies(user?.email);
  const claims   = getStoredClaims(user?.email);
  const active   = policies.filter(p => p.status === 'Active');
  const totalPremium = policies.reduce((s, p) => s + (p.premiumTotal || 0), 0);
  const activeClaims = claims.filter(c => c.status !== 'Settled' && c.status !== 'Rejected');

  return `
  <div class="page-header flex justify-between items-center">
    <div>
      <h1 class="page-title">Welcome back, ${firstName}!</h1>
      <p class="page-sub">Here's an overview of your policies and claims.</p>
    </div>
    <button class="btn btn-primary" onclick="navigate('buy-policy')">+ Buy New Policy</button>
  </div>
  <div class="grid-4" style="margin-bottom:20px">
    ${[
      { val: String(active.length || 0), label: 'Active Policies', color: 'var(--blue)', bg: 'var(--blue-pale)', icon: 'shield', link: "navigate('my-policies')" },
      { val: String(policies.filter(p => { const d = new Date(p.endDate); return d > new Date() && (d - new Date()) < 30*86400000; }).length), label: 'Expiring Soon', color: 'var(--orange)', bg: 'rgba(249,115,22,0.1)', icon: 'clock', link: "navigate('my-policies')" },
      { val: String(activeClaims.length), label: 'Active Claims', color: 'var(--accent)', bg: 'var(--accent-light)', icon: 'clipboard', link: "navigate('track-claim')" },
      { val: totalPremium > 0 ? '₹' + totalPremium.toLocaleString('en-IN') : '₹0', label: 'Total Premium Paid', color: 'var(--navy)', bg: 'rgba(15,27,60,0.06)', icon: 'dollar', link: "navigate('my-policies')" },
    ].map(s => `
      <div class="card stat-card">
        <div>
          <div class="stat-value" style="color:${s.color};font-size:${s.val.length > 6 ? '18px' : '26px'}">${s.val}</div>
          <div class="stat-label">${s.label}</div>
          <a href="#" onclick="${s.link};return false" style="font-size:12px;color:${s.color};text-decoration:none;margin-top:4px;display:block">View all →</a>
        </div>
        <div class="stat-icon" style="background:${s.bg}">${Icons[s.icon] || ''}</div>
      </div>
    `).join('')}
  </div>

  <div class="grid-2" style="gap:20px;margin-bottom:20px">
    <div class="card">
      <div class="card-header">
        <span class="card-title">Recent Policies</span>
        <a href="#" onclick="navigate('my-policies');return false" style="font-size:12px;color:var(--blue);text-decoration:none">View all →</a>
      </div>
      <div style="padding:16px 20px;display:flex;flex-direction:column;gap:10px">
        ${policies.length === 0 ? `<div style="text-align:center;padding:24px;color:var(--gray-400);font-size:13px">No policies yet. <a href="#" onclick="navigate('buy-policy');return false" style="color:var(--blue)">Buy your first policy →</a></div>` :
          policies.slice(0, 3).map(p => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-100)">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;border-radius:8px;background:var(--blue-pale);display:flex;align-items:center;justify-content:center">${Icons.shield}</div>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--navy)">${p.planName}</div>
                <div style="font-size:11px;color:var(--gray-400)">${p.policyNo} • ₹${(p.premiumTotal||0).toLocaleString('en-IN')}</div>
                <div style="font-size:11px;color:var(--gray-400)">Expires ${formatDate(p.endDate)}</div>
              </div>
            </div>
            <span class="badge" style="background:${p.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)'};color:${p.status === 'Active' ? 'var(--green)' : 'var(--orange)'}">${p.status === 'Pending UW' || p.status === 'Pending Review' ? 'Under Review' : p.status}</span>
          </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Recent Claims</span>
        <a href="#" onclick="navigate('track-claim');return false" style="font-size:12px;color:var(--blue);text-decoration:none">View all →</a>
      </div>
      <div style="padding:16px 20px;display:flex;flex-direction:column;gap:10px">
        ${claims.length === 0 ? `<div style="text-align:center;padding:24px;color:var(--gray-400);font-size:13px">No claims filed yet.</div>` :
          claims.slice(0, 3).map(c => {
            const colors = { Submitted: ['var(--blue)', 'var(--blue-pale)'], 'Under Review': ['var(--orange)', 'rgba(249,115,22,0.1)'], Approved: ['var(--green)', 'rgba(34,197,94,0.1)'], Settled: ['var(--navy)', 'rgba(15,27,60,0.06)'], Rejected: ['var(--red)', 'rgba(239,68,68,0.1)'] };
            const [col, bg] = colors[c.status] || ['var(--gray-400)', 'var(--gray-50)'];
            return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-100)">
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--navy)">${c.type || 'Claim'}</div>
                <div style="font-size:11px;color:var(--gray-400)">${c.claimNo} • ₹${(c.amount||0).toLocaleString('en-IN')}</div>
                <div style="font-size:11px;color:var(--gray-400)">Filed ${c.filed || formatDate(new Date())}</div>
              </div>
              <span class="badge" style="background:${bg};color:${col}">${c.status}</span>
            </div>`;
          }).join('')}
      </div>
    </div>
  </div>

  <div class="card" style="padding:20px">
    <div class="card-header"><span class="card-title">Quick Actions</span></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px">
      ${[
        { label: '+ Buy New Policy', icon: 'shield', action: "navigate('buy-policy')", color: 'var(--blue)' },
        { label: '📋 File a Claim', icon: 'clipboard', action: "navigate('claims')", color: 'var(--orange)' },
        { label: '📄 My Documents', icon: 'file', action: "navigate('documents')", color: 'var(--accent)' },
        { label: '💬 Support', icon: 'clipboard', action: "navigate('support')", color: 'var(--navy)' },
      ].map(a => `<button class="btn btn-outline" onclick="${a.action}" style="color:${a.color};border-color:${a.color}">${a.label}</button>`).join('')}
    </div>
  </div>`;
}

// ===== MARKETPLACE =====
function renderMarketplace() {
  return `
  <div class="page-header">
    <h1 class="page-title">Travel Insurance Plans</h1>
    <p class="page-sub">Choose the plan that best fits your journey — all plans include 24/7 emergency assistance.</p>
  </div>

  <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
    <button class="btn btn-outline" onclick="showCompareModal()">⚖️ Compare All Plans</button>
  </div>

  <div class="centered-card-wrap" style="gap:24px;margin-bottom:32px">
    ${Object.values(PLANS).map(plan => `
    <div class="plan-card${plan.tag === 'Most Popular' ? ' plan-popular' : plan.tag === 'Premium' ? ' plan-pro' : ''}" style="position:relative;flex:1;min-width:280px;max-width:340px">
      ${plan.tag ? `<div class="plan-tag" style="background:${plan.color}">${plan.tag}</div>` : ''}
      <div style="margin-bottom:16px">
        <h3 style="font-size:18px;font-weight:700;color:var(--navy);margin:0 0 4px">${plan.name}</h3>
        <p style="font-size:12px;color:var(--gray-400);margin:0">${plan.tagline}</p>
      </div>
      <div style="margin-bottom:16px">
        <span style="font-size:28px;font-weight:700;color:${plan.color}">₹${plan.dailyRate}</span>
        <span style="font-size:12px;color:var(--gray-400)">/day/traveler</span>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Key Coverage</div>
        ${Object.entries(plan.limits).slice(0, 4).map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--gray-100)">
            <span style="color:var(--gray-500)">${k}</span>
            <span style="font-weight:600;color:var(--navy)">${v}</span>
          </div>`).join('')}
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Includes</div>
        ${plan.inclusions.slice(0, 5).map(inc => `
          <div style="display:flex;gap:6px;align-items:center;font-size:12px;padding:2px 0">
            <span style="color:var(--green);flex-shrink:0">${Icons.check}</span>
            <span style="color:var(--gray-600)">${inc}</span>
          </div>`).join('')}
        ${plan.inclusions.length > 5 ? `<div style="font-size:11px;color:var(--blue);margin-top:4px">+${plan.inclusions.length - 5} more included</div>` : ''}
      </div>
      <button class="btn btn-primary" style="width:100%;background:${plan.color};border-color:${plan.color}"
        onclick="startBuyFlow('${plan.id}')">Get ${plan.name} →</button>
    </div>`).join('')}
  </div>

  <div id="compare-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px">
    <div style="background:white;border-radius:16px;max-width:900px;width:100%;max-height:90vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid var(--gray-100)">
        <h2 style="margin:0;font-size:18px;color:var(--navy)">Plan Comparison</h2>
        <button onclick="document.getElementById('compare-modal').classList.add('hidden')" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--gray-400)">×</button>
      </div>
      <div style="overflow-x:auto;padding:24px">
        <table class="compare-table">
          <thead>
            <tr>
              <th style="text-align:left;min-width:180px">Feature</th>
              ${Object.values(PLANS).map(p => `<th style="color:${p.color}">${p.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr style="background:var(--gray-50)">
              <td style="font-weight:600">Daily Rate</td>
              ${Object.values(PLANS).map(p => `<td>₹${p.dailyRate}/day</td>`).join('')}
            </tr>
            ${getAllCoverageKeys().map((key, i) => `
            <tr style="${i % 2 === 0 ? '' : 'background:var(--gray-50)'}">
              <td>${key}</td>
              ${Object.values(PLANS).map(p => `<td>${p.limits[key] ? p.limits[key] : '<span class="compare-cross">—</span>'}</td>`).join('')}
            </tr>`).join('')}
            ${getAllInclusionItems().map((inc, i) => `
            <tr style="${i % 2 === 0 ? '' : 'background:var(--gray-50)'}">
              <td>${inc}</td>
              ${Object.values(PLANS).map(p => `<td>${p.inclusions.includes(inc) ? '<span class="compare-check">✓</span>' : '<span class="compare-cross">✗</span>'}</td>`).join('')}
            </tr>`).join('')}
            <tr>
              <td style="font-weight:600">Action</td>
              ${Object.values(PLANS).map(p => `<td><button class="btn btn-primary btn-sm" style="background:${p.color};border-color:${p.color}" onclick="document.getElementById('compare-modal').classList.add('hidden');startBuyFlow('${p.id}')">Select</button></td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function getAllCoverageKeys() {
  const keys = new Set();
  Object.values(PLANS).forEach(p => Object.keys(p.limits).forEach(k => keys.add(k)));
  return [...keys];
}

function getAllInclusionItems() {
  const items = new Set();
  Object.values(PLANS).forEach(p => p.inclusions.forEach(i => items.add(i)));
  return [...items];
}

function showCompareModal() {
  document.getElementById('compare-modal').classList.remove('hidden');
}

// ===== BUY POLICY FLOW =====
function startBuyFlow(planId) {
  buyState = { planId };
  document.getElementById('app-main').innerHTML = renderBuyStep1();
  document.getElementById('app-main').scrollTop = 0;
  document.querySelectorAll('#sidebar .sidebar-item').forEach(b => {
    b.classList.toggle('active', b.dataset.section === 'buy-policy');
  });
}

function stepHeader(current) {
  const steps = ['Trip Details', 'Choose Plan', 'Add-ons', 'Premium & Risk', 'Payment', 'Confirmation'];
  return `
  <div style="display:flex;align-items:center;gap:0;margin-bottom:28px;overflow-x:auto;padding-bottom:4px">
    ${steps.map((s, i) => `
      <div style="display:flex;align-items:center;flex-shrink:0">
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;
            background:${i < current ? 'var(--green)' : i === current ? 'var(--blue)' : 'var(--gray-100)'};
            color:${i <= current ? 'white' : 'var(--gray-400)'}">
            ${i < current ? '✓' : i + 1}
          </div>
          <div style="font-size:10px;font-weight:${i === current ? '600' : '400'};color:${i === current ? 'var(--navy)' : 'var(--gray-400)'}; white-space:nowrap">${s}</div>
        </div>
        ${i < steps.length - 1 ? `<div style="width:40px;height:2px;background:${i < current ? 'var(--green)' : 'var(--gray-100)'};margin:0 4px;margin-bottom:18px;flex-shrink:0"></div>` : ''}
      </div>`).join('')}
  </div>`;
}

// STEP 1 – TRIP DETAILS
function renderBuyStep1() {
  const d = buyState.step1 || {};
  const tomorrowStr = getTomorrowStr();
  return `
  <div class="page-header">
    <h1 class="page-title">Buy Travel Insurance</h1>
    <p class="page-sub">Get covered in minutes — fill in your trip details to get started.</p>
  </div>
  ${stepHeader(0)}
  <div class="centered-card" style="max-width:600px">
    <div style="font-size:16px;font-weight:700;color:var(--navy);margin-bottom:20px">Step 1: Trip Details</div>
    <div class="form-group">
      <label class="form-label">Destination Region *</label>
      <select id="bp-dest" class="form-input" onchange="updateDestLabel()">
        <option value="">Select destination...</option>
        ${DESTINATIONS.map(d => `<option value="${d.value}" ${(buyState.step1?.dest === d.value) ? 'selected' : ''}>${d.label}</option>`).join('')}
      </select>
      <div id="bp-dest-err" class="form-error"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="form-group">
        <label class="form-label">Departure Date *</label>
        <input type="date" id="bp-start" class="form-input" min="${tomorrowStr}" value="${d.startDate || ''}" onchange="updateDuration()">
        <div id="bp-start-err" class="form-error"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Return Date *</label>
        <input type="date" id="bp-end" class="form-input" min="${tomorrowStr}" value="${d.endDate || ''}" onchange="updateDuration()">
        <div id="bp-end-err" class="form-error"></div>
      </div>
    </div>
    <div id="bp-duration-display" style="font-size:13px;color:var(--blue);font-weight:600;margin-top:-8px;margin-bottom:12px"></div>
    <div class="form-group">
      <label class="form-label">Trip Type *</label>
      <select id="bp-triptype" class="form-input">
        ${TRIP_TYPES.map(t => `<option value="${t.value}" ${(d.tripType === t.value) ? 'selected' : ''}>${t.label}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Number of Travelers *</label>
      <select id="bp-travelers" class="form-input" onchange="enforceAgeGroupLimit()">
        ${[1,2,3,4,5,6,7,8,9,10].map(n => `<option value="${n}" ${(d.travelers == n) ? 'selected' : ''}>${n} traveler${n > 1 ? 's' : ''}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Purpose of Travel</label>
      <select id="bp-purpose" class="form-input">
        ${['Tourism / Leisure', 'Business', 'Education / Study', 'Medical Tourism', 'Adventure / Sports', 'Family Visit'].map(p =>
          `<option value="${p}" ${(d.purpose === p) ? 'selected' : ''}>${p}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Traveler Age Group(s)</label>
      <div id="age-group-hint" style="font-size:12px;color:var(--gray-400);margin-bottom:6px">Select all age groups present in your travel party.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px" id="age-group-wrap">
        ${[{ label: 'Child (0–17)', val: 'child' }, { label: 'Adult (18–60)', val: 'adult' }, { label: 'Senior (61+)', val: 'senior' }].map(ag => `
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;padding:6px 12px;border:1.5px solid var(--gray-200);border-radius:8px;transition:border-color .15s" id="age-lbl-${ag.val}">
            <input type="checkbox" value="${ag.val}" class="age-group-check" ${(d.ageGroups || []).includes(ag.val) ? 'checked' : ''} onchange="enforceAgeGroupLimit()"> ${ag.label}
          </label>`).join('')}
      </div>
      <div id="age-group-err" class="form-error" style="margin-top:6px"></div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-primary" onclick="goStep2()">Next: Choose Plan →</button>
    </div>
  </div>`;
}

function enforceAgeGroupLimit() {
  const travelers = parseInt(document.getElementById('bp-travelers')?.value || 1);
  const checks = document.querySelectorAll('.age-group-check');
  const checked = [...checks].filter(c => c.checked);
  const hint = document.getElementById('age-group-hint');
  if (travelers === 1) {
    if (checked.length > 1) {
      const last = checked[checked.length - 1];
      last.checked = false;
      document.getElementById('age-group-err').textContent = 'Only 1 age group allowed for a single traveler.';
      return;
    }
    if (hint) hint.textContent = 'Single traveler — select exactly one age group.';
  } else {
    if (hint) hint.textContent = 'Select all age groups present in your travel party.';
  }
  document.getElementById('age-group-err').textContent = '';
  checks.forEach(c => {
    const lbl = document.getElementById('age-lbl-' + c.value);
    if (lbl) lbl.style.borderColor = c.checked ? 'var(--blue)' : '';
  });
}

function updateDuration() {
  const s = document.getElementById('bp-start')?.value;
  const e = document.getElementById('bp-end')?.value;
  const el = document.getElementById('bp-duration-display');
  if (!el) return;
  if (s && e) {
    const days = Math.ceil((new Date(e) - new Date(s)) / 86400000);
    if (days > 0) el.textContent = `Trip duration: ${days} day${days > 1 ? 's' : ''}`;
    else el.textContent = 'Return date must be after departure date';
  } else { el.textContent = ''; }
}

function goStep2() {
  const dest      = document.getElementById('bp-dest').value;
  const startDate = document.getElementById('bp-start').value;
  const endDate   = document.getElementById('bp-end').value;
  let valid = true;
  const tomorrowStr2 = getTomorrowStr();
  if (!dest) { document.getElementById('bp-dest-err').textContent = 'Please select a destination.'; valid = false; }
  else document.getElementById('bp-dest-err').textContent = '';
  if (!startDate) { document.getElementById('bp-start-err').textContent = 'Departure date is required.'; valid = false; }
  else if (startDate < tomorrowStr2) { document.getElementById('bp-start-err').textContent = 'Departure must be from tomorrow or later.'; valid = false; }
  else document.getElementById('bp-start-err').textContent = '';
  if (!endDate) { document.getElementById('bp-end-err').textContent = 'Return date is required.'; valid = false; }
  else if (endDate <= startDate) { document.getElementById('bp-end-err').textContent = 'Return date must be after departure.'; valid = false; }
  else document.getElementById('bp-end-err').textContent = '';
  if (!valid) return;

  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000);
  const travelersCount = parseInt(document.getElementById('bp-travelers').value);
  const ageGroups = [...document.querySelectorAll('.age-group-check:checked')].map(c => c.value);
  if (ageGroups.length === 0) { document.getElementById('age-group-err').textContent = 'Please select at least one age group.'; valid = false; }
  if (travelersCount === 1 && ageGroups.length > 1) { document.getElementById('age-group-err').textContent = 'Only 1 age group allowed for a single traveler.'; valid = false; }
  if (!valid) return;
  const destObj = DESTINATIONS.find(d => d.value === dest);
  const tripObj = TRIP_TYPES.find(t => t.value === document.getElementById('bp-triptype').value);
  buyState.step1 = {
    dest, destLabel: destObj?.label, destMult: destObj?.mult || 1,
    startDate, endDate, days,
    tripType: document.getElementById('bp-triptype').value, tripMult: tripObj?.mult || 1,
    travelers: parseInt(document.getElementById('bp-travelers').value),
    purpose: document.getElementById('bp-purpose').value,
    ageGroups,
  };
  document.getElementById('app-main').innerHTML = renderBuyStep2();
  document.getElementById('app-main').scrollTop = 0;
}

// STEP 2 – CHOOSE PLAN
function renderBuyStep2() {
  const { destLabel, days, travelers } = buyState.step1;
  return `
  <div class="page-header">
    <h1 class="page-title">Buy Travel Insurance</h1>
    <p class="page-sub">Trip to <strong>${destLabel}</strong> · ${days} days · ${travelers} traveler${travelers > 1 ? 's' : ''}</p>
  </div>
  ${stepHeader(1)}
  <div style="margin-bottom:16px;font-size:15px;font-weight:600;color:var(--navy)">Step 2: Choose Your Plan</div>
  <div class="centered-card-wrap" style="gap:20px;margin-bottom:24px">
    ${Object.values(PLANS).map(plan => {
      const base = calcBase(plan, buyState.step1);
      return `
    <div class="plan-card${plan.tag === 'Most Popular' ? ' plan-popular' : plan.tag === 'Premium' ? ' plan-pro' : ''}${buyState.planId === plan.id ? ' selected' : ''}"
      style="cursor:pointer;flex:1;min-width:260px;max-width:320px;${buyState.planId === plan.id ? 'border:2px solid ' + plan.color + ';' : ''}"
      onclick="selectPlan('${plan.id}')">
      ${plan.tag ? `<div class="plan-tag" style="background:${plan.color}">${plan.tag}</div>` : ''}
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin:0 0 2px">${plan.name}</h3>
          <p style="font-size:11px;color:var(--gray-400);margin:0">${plan.tagline}</p>
        </div>
        <div style="width:22px;height:22px;border-radius:50%;border:2px solid ${plan.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:8px">
          ${buyState.planId === plan.id ? `<div style="width:12px;height:12px;border-radius:50%;background:${plan.color}"></div>` : ''}
        </div>
      </div>
      <div style="margin-bottom:12px;padding:10px;background:${plan.bg};border-radius:8px">
        <div style="font-size:11px;color:var(--gray-500)">Estimated premium</div>
        <div style="font-size:22px;font-weight:700;color:${plan.color}">₹${base.toLocaleString('en-IN')}</div>
        <div style="font-size:11px;color:var(--gray-400)">incl. GST · excl. add-ons</div>
      </div>
      ${Object.entries(plan.limits).slice(0, 3).map(([k, v]) => `
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--gray-100)">
          <span style="color:var(--gray-500)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span>
        </div>`).join('')}
    </div>`;}).join('')}
  </div>
  <div style="display:flex;justify-content:space-between;max-width:980px;margin:0 auto">
    <button class="btn btn-outline" onclick="document.getElementById('app-main').innerHTML=renderBuyStep1();document.getElementById('app-main').scrollTop=0">← Back</button>
    <button class="btn btn-primary" onclick="goStep3()">Next: Add-ons →</button>
  </div>`;
}

function calcBase(plan, step1) {
  const tMult = step1.travelers === 1 ? 1 : step1.travelers <= 4 ? 1 + (step1.travelers - 1) * 0.6 : 1 + 3 * 0.6 + (step1.travelers - 4) * 0.4;
  const raw = plan.dailyRate * step1.days * tMult * step1.destMult * step1.tripMult;
  const discounted = raw * 0.95;
  return Math.round(discounted * 1.18);
}

function selectPlan(id) {
  buyState.planId = id;
  document.getElementById('app-main').innerHTML = renderBuyStep2();
  document.getElementById('app-main').scrollTop = 0;
}

function goStep3() {
  if (!buyState.planId) { showToast('Please select a plan to continue.', 'warning'); return; }
  document.getElementById('app-main').innerHTML = renderBuyStep3();
  document.getElementById('app-main').scrollTop = 0;
}

// STEP 3 – ADD-ONS
function renderBuyStep3() {
  const plan = PLANS[buyState.planId];
  const alreadyIncluded = plan.inclusions;
  const selectedAddons = buyState.addons || [];
  return `
  <div class="page-header">
    <h1 class="page-title">Buy Travel Insurance</h1>
    <p class="page-sub">Enhance your <strong>${plan.name}</strong> with optional add-ons.</p>
  </div>
  ${stepHeader(2)}
  <div style="max-width:680px;margin:0 auto">
    <div style="font-size:15px;font-weight:600;color:var(--navy);margin-bottom:16px">Step 3: Optional Add-ons</div>
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
      ${ADDONS.map(addon => {
        const included = alreadyIncluded.some(i => i.toLowerCase().includes(addon.label.toLowerCase().split(' ')[0].toLowerCase()));
        const checked = selectedAddons.includes(addon.id);
        return `
        <div class="addon-card${checked ? ' selected' : ''}${included ? ' included' : ''}" onclick="${included ? '' : `toggleAddon('${addon.id}')`}" style="cursor:${included ? 'default' : 'pointer'}">
          <div style="display:flex;align-items:center;gap:12px;flex:1">
            <span style="font-size:24px">${addon.icon}</span>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${addon.label} ${included ? '<span style="font-size:11px;color:var(--green);font-weight:400">(Included in plan)</span>' : ''}</div>
              <div style="font-size:12px;color:var(--gray-400);margin-top:2px">${addon.desc}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              ${included ? `<div style="font-size:12px;color:var(--green);font-weight:600">FREE</div>` :
                `<div style="font-size:15px;font-weight:700;color:var(--navy)">₹${addon.price}</div>
                 <div style="font-size:11px;color:var(--gray-400)">per trip</div>`}
            </div>
          </div>
          ${!included ? `<div class="toggle-switch${checked ? ' on' : ''}" style="margin-left:12px;flex-shrink:0">
            <div class="toggle-knob"></div>
          </div>` : ''}
        </div>`;}).join('')}
    </div>
    <div style="display:flex;justify-content:space-between">
      <button class="btn btn-outline" onclick="document.getElementById('app-main').innerHTML=renderBuyStep2();document.getElementById('app-main').scrollTop=0">← Back</button>
      <button class="btn btn-primary" onclick="goStep4()">Next: Coverage & Premium →</button>
    </div>
  </div>`;
}

function toggleAddon(id) {
  if (!buyState.addons) buyState.addons = [];
  const idx = buyState.addons.indexOf(id);
  if (idx >= 0) buyState.addons.splice(idx, 1);
  else buyState.addons.push(id);
  document.getElementById('app-main').innerHTML = renderBuyStep3();
  document.getElementById('app-main').scrollTop = 0;
}

// COVERAGE LIMIT SLIDER CONFIG
const COVERAGE_SLIDERS = {
  basic: [
    { key: 'medical', label: 'Emergency Medical', base: 2500000, unit: '₹', fmt: v => '₹' + (v/100000).toFixed(0) + 'L' },
    { key: 'trip_cancel', label: 'Trip Cancellation', base: 50000, unit: '₹', fmt: v => '₹' + v.toLocaleString('en-IN') },
    { key: 'baggage', label: 'Baggage Loss', base: 25000, unit: '₹', fmt: v => '₹' + v.toLocaleString('en-IN') },
  ],
  plus: [
    { key: 'medical', label: 'Emergency Medical', base: 7500000, unit: '₹', fmt: v => '₹' + (v/100000).toFixed(0) + 'L' },
    { key: 'trip_cancel', label: 'Trip Cancellation', base: 150000, unit: '₹', fmt: v => '₹' + v.toLocaleString('en-IN') },
    { key: 'baggage', label: 'Baggage Loss', base: 75000, unit: '₹', fmt: v => '₹' + v.toLocaleString('en-IN') },
    { key: 'preexist', label: 'Pre-existing Conditions', base: 1000000, unit: '₹', fmt: v => '₹' + (v/100000).toFixed(0) + 'L' },
  ],
  pro: [
    { key: 'medical', label: 'Emergency Medical', base: 20000000, unit: '₹', fmt: v => '₹' + (v/10000000).toFixed(1) + 'Cr' },
    { key: 'trip_cancel', label: 'Trip Cancellation', base: 300000, unit: '₹', fmt: v => '₹' + v.toLocaleString('en-IN') },
    { key: 'baggage', label: 'Baggage Loss', base: 200000, unit: '₹', fmt: v => '₹' + v.toLocaleString('en-IN') },
    { key: 'preexist', label: 'Pre-existing Conditions', base: 3000000, unit: '₹', fmt: v => '₹' + (v/100000).toFixed(0) + 'L' },
    { key: 'adventure', label: 'Adventure Sports', base: 5000000, unit: '₹', fmt: v => '₹' + (v/100000).toFixed(0) + 'L' },
  ],
};

function getRiskMultiplier(riskScore) {
  if (riskScore <= 30) return 1.5;
  if (riskScore <= 50) return 1.25;
  if (riskScore <= 70) return 1.1;
  return 1.0;
}

function getLimitLoadingPct(sliderPct) {
  return sliderPct === 1.0 ? 0 : sliderPct <= 1.1 ? 0.03 : sliderPct <= 1.25 ? 0.07 : sliderPct <= 1.35 ? 0.12 : 0.18;
}

function updatePremiumFromSliders() {
  const plan = PLANS[buyState.planId];
  const step1 = buyState.step1;
  const selectedAddons = buyState.addons || [];
  const riskScore = buyState.risk?.score || calcRisk(step1, selectedAddons);
  const sliders = COVERAGE_SLIDERS[buyState.planId] || [];
  let loadingPct = 0;
  sliders.forEach(sl => {
    const el = document.getElementById('sl-' + sl.key);
    if (!el) return;
    const val = parseInt(el.value);
    const ratio = val / sl.base;
    loadingPct += getLimitLoadingPct(ratio);
    const disp = document.getElementById('sl-val-' + sl.key);
    if (disp) disp.textContent = sl.fmt(val);
  });
  const { base, addonTotal, discount, gst, total } = calcPremiumBreakdown(plan, step1, selectedAddons, loadingPct);
  buyState.premium = { base, addonTotal, discount, gst, total, loadingPct };
  const totalEl = document.getElementById('premium-total-display');
  if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');
  const breakEl = document.getElementById('premium-loading-row');
  if (breakEl) breakEl.style.display = loadingPct > 0 ? '' : 'none';
  const loadEl = document.getElementById('premium-loading-val');
  if (loadEl) loadEl.textContent = `₹${Math.round(base * loadingPct).toLocaleString('en-IN')} (+${(loadingPct * 100).toFixed(0)}%)`;
}

// STEP 4 – PREMIUM & RISK ASSESSMENT
function renderBuyStep4() {
  const plan = PLANS[buyState.planId];
  const step1 = buyState.step1;
  const selectedAddons = buyState.addons || [];
  const riskScore = calcRisk(step1, selectedAddons);
  const riskMult = getRiskMultiplier(riskScore);
  const { base, addonTotal, discount, gst, total } = calcPremiumBreakdown(plan, step1, selectedAddons, 0);
  const { level, color, icon, action } = getRiskInfo(riskScore);
  buyState.premium = { base, addonTotal, discount, gst, total, loadingPct: 0 };
  buyState.risk = { score: riskScore, level };
  const sliders = COVERAGE_SLIDERS[buyState.planId] || [];
  const canAdjust = riskScore <= 70;
  return `
  <div class="page-header">
    <h1 class="page-title">Buy Travel Insurance</h1>
    <p class="page-sub">Customise your coverage limits and review your premium.</p>
  </div>
  ${stepHeader(3)}
  <div style="max-width:780px;margin:0 auto">
    <div style="font-size:15px;font-weight:600;color:var(--navy);margin-bottom:16px">Step 4: Coverage Limits & Premium</div>

    <div class="grid-2" style="gap:20px;margin-bottom:20px">
      <!-- LEFT: Coverage sliders -->
      <div class="card" style="padding:22px">
        <div style="font-size:13px;font-weight:600;color:var(--gray-500);margin-bottom:4px">ADJUST COVERAGE LIMITS</div>
        <div style="font-size:12px;color:var(--gray-400);margin-bottom:16px">
          ${canAdjust ? 'Adjust your coverage limits based on your needs. Premium updates automatically.'
            : 'Coverage limits are fixed for your trip profile.'}
        </div>
        ${sliders.map(sl => {
          const maxVal = Math.round(sl.base * riskMult);
          const curVal = buyState.sliderValues?.[sl.key] || sl.base;
          return `
          <div class="coverage-slider-wrap">
            <div class="coverage-slider-label">
              <span class="coverage-slider-name">${sl.label}</span>
              <span class="coverage-slider-value" id="sl-val-${sl.key}">${sl.fmt(curVal)}</span>
            </div>
            <input type="range" id="sl-${sl.key}" min="${sl.base}" max="${maxVal}" step="${Math.round(sl.base * 0.05)}"
              value="${curVal}" ${!canAdjust ? 'disabled' : ''} oninput="updatePremiumFromSliders()">
            <div class="coverage-slider-range"><span>Base: ${sl.fmt(sl.base)}</span><span>Max: ${sl.fmt(maxVal)}</span></div>
          </div>`;}).join('')}
        ${sliders.length === 0 ? '<p style="font-size:13px;color:var(--gray-400)">No adjustable limits for this plan.</p>' : ''}
      </div>

      <!-- RIGHT: Premium + Risk -->
      <div>
        <div class="card" style="padding:22px;margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;color:var(--gray-500);margin-bottom:14px">PREMIUM BREAKDOWN</div>
          ${[
            ['Plan', plan.name, ''],
            ['Base Premium', `₹${base.toLocaleString('en-IN')}`, 'var(--navy)'],
            selectedAddons.length ? [`Add-ons (${selectedAddons.length})`, `₹${addonTotal.toLocaleString('en-IN')}`, 'var(--navy)'] : null,
          ].filter(Boolean).map(([l, v, c]) => `
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--gray-100)">
              <span style="color:var(--gray-500)">${l}</span>
              <span style="font-weight:500;color:${c || 'var(--gray-600)'};">${v}</span>
            </div>`).join('')}
          <div id="premium-loading-row" style="display:none;display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--gray-100)">
            <span style="color:var(--gray-500)">Coverage loading</span>
            <span style="font-weight:500;color:var(--orange)" id="premium-loading-val"></span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--gray-100)">
            <span style="color:var(--gray-500)">Online Discount (5%)</span>
            <span style="font-weight:500;color:var(--green)">-₹${discount.toLocaleString('en-IN')}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0">
            <span style="color:var(--gray-500)">GST (18%)</span>
            <span style="font-weight:500;color:var(--gray-400)">₹${gst.toLocaleString('en-IN')}</span>
          </div>
          <div class="premium-display" style="margin-top:14px">
            <div style="font-size:11px;opacity:.7;margin-bottom:4px">TOTAL PAYABLE (auto-updates)</div>
            <div style="font-size:32px;font-weight:800" id="premium-total-display">₹${total.toLocaleString('en-IN')}</div>
            <div style="font-size:11px;opacity:.7">incl. all taxes for ${step1.days} days</div>
          </div>
        </div>
        <div class="card" style="padding:22px">
          <div style="font-size:13px;font-weight:600;color:var(--gray-500);margin-bottom:12px">POLICY ACTIVATION</div>
          <div style="text-align:center;margin-bottom:16px">
            <div style="font-size:36px;margin-bottom:8px">${icon}</div>
            <div style="font-size:14px;font-weight:600;color:var(--navy)">${action}</div>
          </div>
          <div style="font-size:12px;color:var(--gray-500);line-height:1.6;padding:10px;background:var(--gray-50);border-radius:8px">
            <strong>Trip summary</strong><br>
            ${step1.destLabel} · ${step1.days} day${step1.days > 1 ? 's' : ''} · ${step1.travelers} traveler${step1.travelers > 1 ? 's' : ''}<br>
            ${step1.ageGroups.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')} age group(s) · ${step1.purpose}
          </div>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between">
      <button class="btn btn-outline" onclick="document.getElementById('app-main').innerHTML=renderBuyStep3();document.getElementById('app-main').scrollTop=0">← Back</button>
      <button class="btn btn-primary" onclick="goStep5()">Proceed to Payment →</button>
    </div>
  </div>`;
}

function goStep4() {
  document.getElementById('app-main').innerHTML = renderBuyStep4();
  document.getElementById('app-main').scrollTop = 0;
}

function calcPremiumBreakdown(plan, step1, selectedAddons, loadingPct = 0) {
  const tMult = step1.travelers === 1 ? 1 : step1.travelers <= 4 ? 1 + (step1.travelers - 1) * 0.6 : 1 + 3 * 0.6 + (step1.travelers - 4) * 0.4;
  const rawBase = plan.dailyRate * step1.days * tMult * step1.destMult * step1.tripMult;
  const loading  = Math.round(rawBase * loadingPct);
  const addonTotal = selectedAddons.reduce((s, id) => s + (ADDONS.find(a => a.id === id)?.price || 0), 0) * step1.travelers;
  const discount = Math.round((rawBase + loading + addonTotal) * 0.05);
  const subtotal = rawBase + loading + addonTotal - discount;
  const gst = Math.round(subtotal * 0.18);
  const total = Math.round(subtotal + gst);
  return { base: Math.round(rawBase), loading, addonTotal, discount, gst, total };
}

function calcRisk(step1, selectedAddons) {
  let score = 10;
  if (step1.ageGroups?.includes('senior')) score += 25;
  if (step1.ageGroups?.includes('child')) score += 5;
  const highDest = ['usa_canada', 'aus_nz', 'worldwide'];
  const medDest  = ['europe', 'me_africa'];
  if (highDest.includes(step1.dest)) score += 20;
  else if (medDest.includes(step1.dest)) score += 10;
  if (step1.days > 30) score += 15;
  else if (step1.days > 14) score += 7;
  if (step1.travelers >= 5) score += 5;
  if (step1.purpose === 'Adventure / Sports') score += 20;
  if (step1.purpose === 'Medical Tourism') score += 15;
  if (selectedAddons.includes('adventure')) score += 10;
  if (step1.tripMult > 1.5) score += 8;
  return Math.min(score, 100);
}

function getRiskFactors(step1, selectedAddons) {
  const factors = [];
  factors.push({ label: 'Base Score', points: 10 });
  if (step1.ageGroups?.includes('senior')) factors.push({ label: 'Senior traveler (61+)', points: 25 });
  if (step1.ageGroups?.includes('child')) factors.push({ label: 'Child traveler', points: 5 });
  const highDest = ['usa_canada', 'aus_nz', 'worldwide'];
  const medDest  = ['europe', 'me_africa'];
  if (highDest.includes(step1.dest)) factors.push({ label: 'High-risk destination', points: 20 });
  else if (medDest.includes(step1.dest)) factors.push({ label: 'Medium-risk destination', points: 10 });
  if (step1.days > 30) factors.push({ label: 'Long trip (>30 days)', points: 15 });
  else if (step1.days > 14) factors.push({ label: 'Extended trip (>14 days)', points: 7 });
  if (step1.travelers >= 5) factors.push({ label: 'Large group (5+ travelers)', points: 5 });
  if (step1.purpose === 'Adventure / Sports') factors.push({ label: 'Adventure / Sports travel', points: 20 });
  if (step1.purpose === 'Medical Tourism') factors.push({ label: 'Medical tourism', points: 15 });
  if (selectedAddons.includes('adventure')) factors.push({ label: 'Adventure sports add-on', points: 10 });
  if (step1.tripMult > 1.5) factors.push({ label: 'Multi-trip plan', points: 8 });
  return factors;
}

function getRiskInfo(score) {
  if (score <= 30) return { level: 'Standard', color: 'var(--green)', icon: '✅', action: 'Your policy will be activated immediately after payment.' };
  if (score <= 50) return { level: 'Standard', color: 'var(--green)', icon: '✅', action: 'Policy will be reviewed by our team within 1 business day.' };
  if (score <= 70) return { level: 'Extended', color: 'var(--orange)', icon: '🔶', action: 'Policy will be reviewed by our underwriting team within 2–3 business days.' };
  return { level: 'Extended', color: 'var(--orange)', icon: '🔶', action: 'Your application will be reviewed and our team may contact you for additional information.' };
}

// STEP 5 – PAYMENT
function renderBuyStep5() {
  const { total } = buyState.premium;
  const selMethod = buyState.payMethod || 'upi';
  const methods = [
    { id: 'upi', label: 'UPI', icon: '📱', desc: 'Pay via UPI ID or scan QR' },
    { id: 'netbanking', label: 'Net Banking', icon: '🏦', desc: 'Direct bank transfer' },
    { id: 'card', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
    { id: 'wallet', label: 'Digital Wallet', icon: '👝', desc: 'Paytm, PhonePe, Amazon Pay' },
  ];
  return `
  <div class="page-header">
    <h1 class="page-title">Buy Travel Insurance</h1>
    <p class="page-sub">Almost there! Complete your payment to activate the policy.</p>
  </div>
  ${stepHeader(4)}
  <div style="max-width:600px;margin:0 auto">
    <div style="font-size:15px;font-weight:600;color:var(--navy);margin-bottom:16px">Step 5: Payment</div>
    <div class="card" style="padding:20px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:13px;color:var(--gray-500)">${PLANS[buyState.planId].name} — ${buyState.step1.days} days · ${buyState.step1.travelers} traveler${buyState.step1.travelers > 1 ? 's' : ''}</span>
      </div>
      <div style="font-size:28px;font-weight:800;color:var(--navy)">₹${total.toLocaleString('en-IN')} <span style="font-size:13px;font-weight:400;color:var(--gray-400)">Total payable (incl. GST)</span></div>
    </div>
    <div style="font-size:13px;font-weight:600;color:var(--gray-500);margin-bottom:12px">SELECT PAYMENT METHOD</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
      ${methods.map(m => `
        <div class="pay-method${selMethod === m.id ? ' selected' : ''}" onclick="selectPayMethod('${m.id}')">
          <span style="font-size:22px">${m.icon}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600;color:var(--navy)">${m.label}</div>
            <div style="font-size:12px;color:var(--gray-400)">${m.desc}</div>
          </div>
          <div style="width:18px;height:18px;border-radius:50%;border:2px solid ${selMethod === m.id ? 'var(--blue)' : 'var(--gray-300)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            ${selMethod === m.id ? '<div style="width:10px;height:10px;border-radius:50%;background:var(--blue)"></div>' : ''}
          </div>
        </div>`).join('')}
    </div>
    ${renderPaymentFields(selMethod)}
    <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--gray-400);margin-bottom:20px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      256-bit SSL secured · Your data is encrypted and safe
    </div>
    <div style="display:flex;justify-content:space-between">
      <button class="btn btn-outline" onclick="document.getElementById('app-main').innerHTML=renderBuyStep4();document.getElementById('app-main').scrollTop=0">← Back</button>
      <button class="btn btn-primary" style="min-width:180px" onclick="processPayment()">Pay ₹${total.toLocaleString('en-IN')} →</button>
    </div>
  </div>`;
}

function renderPaymentFields(method) {
  if (method === 'upi') return `
    <div class="form-group" style="margin-bottom:16px">
      <label class="form-label">UPI ID</label>
      <input type="text" class="form-input" id="pay-upi" placeholder="yourname@upi" value="${buyState.payData?.upi || ''}">
    </div>`;
  if (method === 'card') return `
    <div class="form-group" style="margin-bottom:12px">
      <label class="form-label">Card Number</label>
      <input type="text" class="form-input" id="pay-card-no" placeholder="0000 0000 0000 0000" maxlength="19" oninput="this.value=this.value.replace(/\\D/g,'').replace(/(\\d{4})/g,'$1 ').trim()">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="form-group">
        <label class="form-label">Expiry (MM/YY)</label>
        <input type="text" class="form-input" id="pay-expiry" placeholder="MM/YY" maxlength="5">
      </div>
      <div class="form-group">
        <label class="form-label">CVV</label>
        <input type="password" class="form-input" id="pay-cvv" placeholder="•••" maxlength="3">
      </div>
    </div>
    <div class="form-group" style="margin-bottom:16px">
      <label class="form-label">Cardholder Name</label>
      <input type="text" class="form-input" id="pay-name" placeholder="As on card">
    </div>`;
  if (method === 'netbanking') return `
    <div class="form-group" style="margin-bottom:16px">
      <label class="form-label">Select Bank</label>
      <select class="form-input" id="pay-bank">
        ${['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Other'].map(b => `<option>${b}</option>`).join('')}
      </select>
    </div>`;
  if (method === 'wallet') return `
    <div class="form-group" style="margin-bottom:16px">
      <label class="form-label">Select Wallet</label>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik'].map(w => `
          <button class="btn btn-outline btn-sm" style="font-size:12px" onclick="this.closest('.form-group').querySelector('[data-sel]')?.removeAttribute('style');this.style.background='var(--blue)';this.style.color='white'">${w}</button>`).join('')}
      </div>
    </div>`;
  return '';
}

function selectPayMethod(id) {
  buyState.payMethod = id;
  document.getElementById('app-main').innerHTML = renderBuyStep5();
  document.getElementById('app-main').scrollTop = 0;
}

function goStep5() {
  if (!buyState.payMethod) buyState.payMethod = 'upi';
  document.getElementById('app-main').innerHTML = renderBuyStep5();
  document.getElementById('app-main').scrollTop = 0;
}

function processPayment() {
  const btn = document.querySelector('[onclick="processPayment()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }
  setTimeout(() => {
    const user = getSession();
    const plan = PLANS[buyState.planId];
    const policyNo = generatePolicyNo();
    const riskScore = buyState.risk.score;
    const riskLevel = buyState.risk.level;

    // Risk-based routing: Low → Active, Medium → Pending Review, High → Pending UW
    let policyStatus, statusLabel, reviewNote;
    if (riskScore <= 30) {
      policyStatus = 'Active'; statusLabel = 'Activated immediately.';
      reviewNote = null;
    } else if (riskScore <= 50) {
      policyStatus = 'Pending Review';
      statusLabel = 'Under review by our team. Expected within 1 business day.';
      reviewNote = 'ROLE_CLAIMS_OFFICER';
    } else {
      policyStatus = 'Pending UW';
      statusLabel = 'Under review by our underwriting team. Expected within 2–3 business days.';
      reviewNote = 'ROLE_UNDERWRITER';
    }

    const policy = {
      policyNo,
      planId: buyState.planId,
      planName: plan.name,
      userEmail: user.email,
      userName: user.fullName || user.name,
      dest: buyState.step1.destLabel,
      startDate: buyState.step1.startDate,
      endDate: buyState.step1.endDate,
      days: buyState.step1.days,
      travelers: buyState.step1.travelers,
      tripType: buyState.step1.tripType,
      purpose: buyState.step1.purpose,
      ageGroups: buyState.step1.ageGroups,
      addons: buyState.addons || [],
      premiumTotal: buyState.premium.total,
      status: policyStatus,
      riskLevel,
      riskScore,
      purchasedOn: new Date().toISOString(),
      payMethod: buyState.payMethod || 'upi',
      reviewNote,
    };
    storePolicy(policy);

    const activeMsg = policyStatus === 'Active' ? 'is now active' : 'is pending review';
    const custName = user.fullName || user.name;
    addNotification('ROLE_CUSTOMER', { title: policyStatus === 'Active' ? 'Policy Active!' : 'Policy Submitted for Review', body: `${plan.name} (${policyNo}) ${activeMsg}. ${statusLabel}` });
    addNotification('ROLE_FINANCE', { title: 'Premium Received', body: `₹${buyState.premium.total.toLocaleString('en-IN')} collected for policy ${policyNo} (${plan.name})` });
    addNotification('ROLE_AGENT', { title: 'New Policy Sold', body: `${custName} purchased ${plan.name} — ₹${buyState.premium.total.toLocaleString('en-IN')}` });
    addNotification('ROLE_RELATIONSHIP_MANAGER', { title: 'New Policy Sold', body: `${custName} purchased ${plan.name} — ₹${buyState.premium.total.toLocaleString('en-IN')}` });
    if (reviewNote === 'ROLE_CLAIMS_OFFICER') {
      addNotification('ROLE_CLAIMS_OFFICER', { title: 'Policy Requires Review', body: `${policyNo} · ${plan.name} · Customer: ${custName}` });
    }
    if (reviewNote === 'ROLE_UNDERWRITER') {
      addNotification('ROLE_UNDERWRITER', { title: 'New Policy in Queue', body: `${policyNo} · ${plan.name} · ${custName}` });
    }

    buyState.completedPolicy = policy;
    buyState.completedPolicy.statusLabel = statusLabel;
    document.getElementById('app-main').innerHTML = renderBuyStep6();
    document.getElementById('app-main').scrollTop = 0;
    updateNotifBadge('ROLE_CUSTOMER');
  }, 2000);
}

// STEP 6 – SUCCESS
function renderBuyStep6() {
  const policy = buyState.completedPolicy;
  const plan   = PLANS[policy.planId];
  const { level, color, icon } = getRiskInfo(buyState.risk.score);
  const isActive = policy.status === 'Active';
  return `
  ${stepHeader(5)}
  <div style="max-width:600px;margin:0 auto;text-align:center;padding:24px 0">
    <div class="success-icon" style="margin:0 auto 20px;background:${isActive ? 'var(--green)' : 'var(--orange)'}">
      ${isActive ? '✓' : '⏳'}
    </div>
    <h2 style="font-size:24px;font-weight:800;color:var(--navy);margin:0 0 8px">
      ${isActive ? 'Policy Issued Successfully!' : 'Application Submitted!'}
    </h2>
    <p style="font-size:14px;color:var(--gray-400);margin-bottom:28px">
      ${isActive
        ? 'Your travel insurance is now active. A confirmation has been sent to your registered email.'
        : policy.statusLabel + ' A confirmation has been sent to your email.'}
    </p>
    ${!isActive ? `<div style="padding:12px 16px;background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);border-radius:10px;font-size:13px;color:var(--orange);margin-bottom:24px;text-align:left">
      <strong>What happens next?</strong> Our review team will assess your application and send you a decision. Your premium has been held and will be refunded if the policy cannot be issued.
    </div>` : ''}
    <div class="card" style="text-align:left;padding:24px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <div style="font-size:18px;font-weight:800;color:var(--navy)">${plan.name}</div>
          <div style="font-size:12px;color:var(--gray-400)">${policy.dest} · ${policy.days} days · ${policy.travelers} traveler${policy.travelers > 1 ? 's' : ''}</div>
        </div>
        <span class="badge" style="background:rgba(34,197,94,0.1);color:var(--green);font-size:12px">Active</span>
      </div>
      ${[
        ['Policy Number', policy.policyNo],
        ['Trip Dates', `${formatDate(policy.startDate)} – ${formatDate(policy.endDate)}`],
        ['Total Premium', `₹${policy.premiumTotal.toLocaleString('en-IN')} (incl. GST)`],
        ['Payment Method', policy.payMethod?.toUpperCase()],
        ['Issued On', formatDate(new Date())],
      ].map(([l, v]) => `
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid var(--gray-100)">
          <span style="color:var(--gray-500)">${l}</span>
          <span style="font-weight:600;color:var(--navy)">${v}</span>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="navigate('my-policies')">View My Policies</button>
      <button class="btn btn-outline" onclick="navigate('dashboard')">Go to Dashboard</button>
      <button class="btn btn-outline" onclick="navigate('buy-policy')">Buy Another Policy</button>
    </div>
  </div>`;
}

// ===== MY POLICIES =====
function renderMyPolicies() {
  const user = getSession();
  const policies = getStoredPolicies(user?.email);
  return `
  <div class="page-header flex justify-between items-center">
    <div>
      <h1 class="page-title">My Policies</h1>
      <p class="page-sub">Manage all your active and past travel insurance policies.</p>
    </div>
    <button class="btn btn-primary" onclick="navigate('buy-policy')">+ Buy New Policy</button>
  </div>
  ${policies.length === 0 ? `
    <div class="card" style="padding:48px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">🛡️</div>
      <h3 style="color:var(--navy);margin:0 0 8px">No policies yet</h3>
      <p style="color:var(--gray-400);font-size:13px;margin-bottom:20px">Purchase your first travel insurance policy to get protected.</p>
      <button class="btn btn-primary" onclick="navigate('buy-policy')">Browse Plans →</button>
    </div>` :
    policies.map(p => {
      const plan = PLANS[p.planId] || {};
      return `
      <div class="card" style="margin-bottom:16px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:44px;height:44px;border-radius:10px;background:${plan.bg || 'var(--blue-pale)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${plan.color || 'var(--blue)'}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div style="font-size:16px;font-weight:700;color:var(--navy)">${p.planName}</div>
              <div style="font-size:12px;color:var(--gray-400)">${p.policyNo} · ${p.dest}</div>
              <div style="font-size:12px;color:var(--gray-400)">${formatDate(p.startDate)} – ${formatDate(p.endDate)} · ${p.travelers} traveler${p.travelers > 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="badge" style="background:${p.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)'};color:${p.status === 'Active' ? 'var(--green)' : 'var(--orange)'}">${p.status === 'Pending UW' || p.status === 'Pending Review' ? 'Under Review' : p.status}</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;padding:12px;background:var(--gray-50);border-radius:8px;margin-bottom:12px">
          ${Object.entries(PLANS[p.planId]?.limits || {}).slice(0, 4).map(([k, v]) => `
            <div>
              <div style="font-size:11px;color:var(--gray-400)">${k}</div>
              <div style="font-size:12px;font-weight:700;color:var(--navy)">${v}</div>
            </div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:13px;color:var(--gray-500)">Premium: <strong style="color:var(--navy)">₹${(p.premiumTotal||0).toLocaleString('en-IN')}</strong> · Add-ons: ${p.addons?.length || 0}</div>
          <button class="btn btn-outline btn-sm" onclick="navigate('claims')">File Claim</button>
        </div>
      </div>`;}).join('')}`;
}

// ===== CLAIM SUBMISSION =====
function renderClaimSubmission() {
  const user    = getSession();
  const policies = getStoredPolicies(user?.email).filter(p => p.status === 'Active');
  return `
  <div class="page-header">
    <h1 class="page-title">File a Claim</h1>
    <p class="page-sub">Submit a claim for your travel insurance policy. We aim to respond within 24 hours.</p>
  </div>
  <div style="max-width:640px;margin:0 auto">
    <div class="card" style="padding:24px">
      <div class="form-group">
        <label class="form-label">Select Policy *</label>
        <select id="claim-policy" class="form-input">
          <option value="">Choose a policy...</option>
          ${policies.map(p => `<option value="${p.policyNo}">${p.policyNo} · ${p.planName} · ${p.dest}</option>`).join('')}
          ${policies.length === 0 ? '<option disabled>No active policies</option>' : ''}
        </select>
        <div id="claim-policy-err" class="form-error"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Claim Type *</label>
        <select id="claim-type" class="form-input">
          <option value="">Select claim type...</option>
          ${['Medical Emergency', 'Trip Cancellation', 'Baggage Loss', 'Flight Delay', 'Accident', 'Emergency Evacuation', 'Rental Car Damage', 'Passport Loss', 'Other'].map(t => `<option>${t}</option>`).join('')}
        </select>
        <div id="claim-type-err" class="form-error"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="form-group">
          <label class="form-label">Incident Date *</label>
          <input type="date" id="claim-date" class="form-input" max="${new Date().toISOString().split('T')[0]}">
          <div id="claim-date-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Claim Amount (₹) *</label>
          <input type="number" id="claim-amount" class="form-input" placeholder="0" min="1">
          <div id="claim-amount-err" class="form-error"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description *</label>
        <textarea id="claim-desc" class="form-input" rows="4" placeholder="Describe what happened, when, and what documents you have..." style="resize:vertical"></textarea>
        <div id="claim-desc-err" class="form-error"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Supporting Documents</label>
        <div style="border:2px dashed var(--gray-200);border-radius:8px;padding:20px;text-align:center;color:var(--gray-400);font-size:13px">
          <div style="font-size:24px;margin-bottom:6px">📎</div>
          <div>Drag & drop files here or <span style="color:var(--blue);cursor:pointer">browse</span></div>
          <div style="font-size:11px;margin-top:4px">PDF, JPG, PNG up to 10MB each</div>
        </div>
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:8px">
        <button class="btn btn-outline" onclick="navigate('dashboard')">Cancel</button>
        <button class="btn btn-primary" onclick="submitClaim()">Submit Claim →</button>
      </div>
    </div>
  </div>`;
}

function submitClaim() {
  const policyNo = document.getElementById('claim-policy').value;
  const type     = document.getElementById('claim-type').value;
  const date     = document.getElementById('claim-date').value;
  const amount   = document.getElementById('claim-amount').value;
  const desc     = document.getElementById('claim-desc').value.trim();
  let valid = true;
  if (!policyNo) { document.getElementById('claim-policy-err').textContent = 'Please select a policy.'; valid = false; }
  else document.getElementById('claim-policy-err').textContent = '';
  if (!type) { document.getElementById('claim-type-err').textContent = 'Please select claim type.'; valid = false; }
  else document.getElementById('claim-type-err').textContent = '';
  if (!date) { document.getElementById('claim-date-err').textContent = 'Incident date is required.'; valid = false; }
  else document.getElementById('claim-date-err').textContent = '';
  if (!amount || parseInt(amount) < 1) { document.getElementById('claim-amount-err').textContent = 'Enter a valid amount.'; valid = false; }
  else document.getElementById('claim-amount-err').textContent = '';
  if (!desc || desc.length < 20) { document.getElementById('claim-desc-err').textContent = 'Please provide at least 20 characters of description.'; valid = false; }
  else document.getElementById('claim-desc-err').textContent = '';
  if (!valid) return;

  const user = getSession();
  const claimNo = generateClaimNo();
  const claim = {
    claimNo, policyNo, type, incidentDate: date,
    amount: parseInt(amount), description: desc,
    userEmail: user.email, userName: user.fullName || user.name,
    filed: formatDate(new Date()), status: 'Submitted',
    submittedOn: new Date().toISOString(),
  };
  storeClaim(claim);

  addNotification('ROLE_CUSTOMER', { title: 'Claim Submitted', body: `${claimNo} for ${type} (₹${parseInt(amount).toLocaleString('en-IN')}) has been received.` });
  addNotification('ROLE_CLAIMS_OFFICER', { title: 'New Claim Filed', body: `${claimNo} · ${type} · ₹${parseInt(amount).toLocaleString('en-IN')} · ${user.fullName || user.name}` });
  addNotification('ROLE_UNDERWRITER', { title: 'Claim Notification', body: `${claimNo} submitted by ${user.fullName || user.name} for policy ${policyNo}` });

  showToast('Claim submitted successfully!', 'success');
  setTimeout(() => navigate('track-claim'), 800);
}

// ===== CLAIM TRACKING =====
function renderClaimTracking() {
  const user   = getSession();
  const claims = getStoredClaims(user?.email);
  const statusSteps = { Submitted: 0, 'Under Review': 1, Approved: 2, Settled: 3, Rejected: -1 };
  return `
  <div class="page-header">
    <h1 class="page-title">Track My Claims</h1>
    <p class="page-sub">Monitor the status of your insurance claims in real time.</p>
  </div>
  ${claims.length === 0 ? `
    <div class="card" style="padding:48px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">📋</div>
      <h3 style="color:var(--navy);margin:0 0 8px">No claims filed</h3>
      <p style="color:var(--gray-400);font-size:13px;margin-bottom:20px">File a claim when you have an insured incident during your trip.</p>
      <button class="btn btn-primary" onclick="navigate('claims')">File a Claim</button>
    </div>` :
    claims.map(c => {
      const colors = { Submitted: 'var(--blue)', 'Under Review': 'var(--orange)', Approved: 'var(--green)', Settled: 'var(--navy)', Rejected: 'var(--red)' };
      const col = colors[c.status] || 'var(--gray-400)';
      const step = statusSteps[c.status] ?? 0;
      const sLabels = ['Submitted', 'Under Review', 'Approved', 'Settled'];
      return `
      <div class="card" style="margin-bottom:16px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:16px">
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--navy)">${c.type}</div>
            <div style="font-size:12px;color:var(--gray-400)">${c.claimNo} · Policy: ${c.policyNo}</div>
            <div style="font-size:12px;color:var(--gray-400)">Filed: ${c.filed} · Incident: ${formatDate(c.incidentDate)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:800;color:var(--navy)">₹${(c.amount||0).toLocaleString('en-IN')}</div>
            <span class="badge" style="background:${col}22;color:${col}">${c.status}</span>
          </div>
        </div>
        ${c.status !== 'Rejected' ? `
        <div style="display:flex;align-items:center;margin-bottom:12px">
          ${sLabels.map((s, i) => `
            <div style="display:flex;align-items:center;flex:1">
              <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1">
                <div style="width:24px;height:24px;border-radius:50%;border:2px solid ${i <= step ? 'var(--green)' : 'var(--gray-200)'};background:${i <= step ? 'var(--green)' : 'white'};display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:700">
                  ${i <= step ? '✓' : i + 1}
                </div>
                <div style="font-size:10px;color:${i <= step ? 'var(--navy)' : 'var(--gray-400)'};font-weight:${i === step ? '600' : '400'};text-align:center;white-space:nowrap">${s}</div>
              </div>
              ${i < sLabels.length - 1 ? `<div style="height:2px;width:30px;background:${i < step ? 'var(--green)' : 'var(--gray-200)'};margin-bottom:14px"></div>` : ''}
            </div>`).join('')}
        </div>` : `<div style="padding:10px;background:rgba(239,68,68,0.08);border-radius:8px;font-size:13px;color:var(--red);margin-bottom:12px">Claim rejected. Please contact support for more information.</div>`}
        <div style="font-size:12px;color:var(--gray-500);padding-top:8px;border-top:1px solid var(--gray-100)">${c.description}</div>
      </div>`;}).join('')}`;
}

// ===== PROFILE =====
function renderProfile() {
  const user = getSession();
  return `
  <div class="page-header">
    <h1 class="page-title">My Profile</h1>
    <p class="page-sub">Manage your personal details and account settings.</p>
  </div>
  <div style="max-width:600px;margin:0 auto">
    <div class="card" style="padding:24px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
        <div style="width:64px;height:64px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:white">
          ${(user?.fullName || user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div>
          <div style="font-size:18px;font-weight:700;color:var(--navy)">${user?.fullName || user?.name || 'User'}</div>
          <div style="font-size:13px;color:var(--gray-400)">${user?.email || ''}</div>
          <span class="badge" style="margin-top:4px">Customer</span>
        </div>
      </div>
      ${[
        ['Full Name', user?.fullName || user?.name || '—'],
        ['Email Address', user?.email || '—'],
        ['Phone', '+91 98765 43210'],
        ['Date of Birth', '15 Mar 1990'],
        ['Address', '123 Marine Drive, Mumbai, Maharashtra 400001'],
        ['Nationality', 'Indian'],
        ['Passport No.', 'P1234567'],
      ].map(([l, v]) => `
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:10px 0;border-bottom:1px solid var(--gray-100)">
          <span style="color:var(--gray-500)">${l}</span>
          <span style="font-weight:500;color:var(--navy)">${v}</span>
        </div>`).join('')}
      <div style="margin-top:16px"><button class="btn btn-outline" onclick="openProfileEditModal()">Edit Profile</button></div>
    </div>
    <div class="card" style="padding:24px">
      <div style="font-size:14px;font-weight:600;color:var(--navy);margin-bottom:16px">Security</div>
      ${[
        ['Two-Factor Authentication', 'Enabled', 'var(--green)'],
        ['Email Alerts', 'Enabled', 'var(--green)'],
        ['Last Login', 'Today, 9:42 AM', 'var(--gray-400)'],
      ].map(([l, v, c]) => `
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:10px 0;border-bottom:1px solid var(--gray-100)">
          <span style="color:var(--gray-500)">${l}</span>
          <span style="font-weight:600;color:${c}">${v}</span>
        </div>`).join('')}
      <div style="margin-top:16px"><button class="btn btn-outline" onclick="showToast('Password change email has been sent.','info')">Change Password</button></div>
    </div>
  </div>`;
}

// ===== DOCUMENTS =====
function renderDocuments() {
  const user = getSession();
  const policies = getStoredPolicies(user?.email);
  return `
  <div class="page-header">
    <h1 class="page-title">My Documents</h1>
    <p class="page-sub">Download your policy certificates, tax receipts, and claim documents.</p>
  </div>
  ${policies.length === 0 ? `
    <div class="card" style="padding:48px;text-align:center">
      <div style="font-size:48px;margin-bottom:12px">📄</div>
      <p style="color:var(--gray-400)">No documents yet. Purchase a policy to get started.</p>
    </div>` :
    `<div style="display:flex;flex-direction:column;gap:12px">
      ${policies.map(p => `
        <div class="card" style="padding:16px 20px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div style="display:flex;gap:10px;align-items:center">
              <div style="font-size:28px">📋</div>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--navy)">Policy Certificate — ${p.planName}</div>
                <div style="font-size:12px;color:var(--gray-400)">${p.policyNo} · Issued ${formatDate(p.purchasedOn)}</div>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="showToast('PDF download initiated','info')">⬇ Download PDF</button>
          </div>
        </div>
        <div class="card" style="padding:16px 20px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div style="display:flex;gap:10px;align-items:center">
              <div style="font-size:28px">🧾</div>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--navy)">GST Invoice — ₹${(p.premiumTotal||0).toLocaleString('en-IN')}</div>
                <div style="font-size:12px;color:var(--gray-400)">${p.policyNo} · ${formatDate(p.purchasedOn)}</div>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="showToast('Invoice download initiated','info')">⬇ Download PDF</button>
          </div>
        </div>`).join('')}
    </div>`}`;
}

// ===== SUPPORT =====
function renderSupport() {
  return `
  <div class="page-header">
    <h1 class="page-title">Customer Support</h1>
    <p class="page-sub">We're here 24/7. Reach us via your preferred channel.</p>
  </div>
  <div class="grid-2" style="gap:16px;margin-bottom:24px">
    ${[
      { icon: '📞', title: '24/7 Emergency Helpline', desc: 'Call us anytime for immediate assistance during your trip', cta: '+91 1800 123 4567', color: 'var(--green)' },
      { icon: '💬', title: 'Live Chat', desc: 'Chat with a support agent in real time — average wait < 2 min', cta: 'Start Chat', color: 'var(--blue)' },
      { icon: '📧', title: 'Email Support', desc: 'Send us your query and we\'ll respond within 24 hours', cta: 'support@PolicyPilot.in', color: 'var(--accent)' },
      { icon: '🏥', title: 'Cashless Hospital Network', desc: '5,000+ hospitals globally with direct billing', cta: 'Find a Hospital', color: 'var(--orange)' },
    ].map(s => `
      <div class="card" style="padding:20px">
        <div style="font-size:32px;margin-bottom:10px">${s.icon}</div>
        <div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:6px">${s.title}</div>
        <div style="font-size:12px;color:var(--gray-400);margin-bottom:12px">${s.desc}</div>
        <button class="btn btn-outline btn-sm" style="color:${s.color};border-color:${s.color}">${s.cta}</button>
      </div>`).join('')}
  </div>
  <div class="card" style="padding:24px">
    <div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:16px">Send a Support Request</div>
    <div class="form-group">
      <label class="form-label">Subject</label>
      <input type="text" class="form-input" placeholder="Brief description of your issue">
    </div>
    <div class="form-group">
      <label class="form-label">Message</label>
      <textarea class="form-input" rows="4" placeholder="Describe your issue in detail..." style="resize:vertical"></textarea>
    </div>
    <button class="btn btn-primary" onclick="showToast('Support request submitted. We will reply within 24 hours.','success')">Submit Request</button>
  </div>`;
}

// ===== PROFILE EDIT MODAL (Item 13) =====
function openProfileEditModal() {
  const existing = document.getElementById('profile-edit-overlay');
  if (existing) existing.remove();
  const user = getSession();
  const stored = JSON.parse(localStorage.getItem(`ti_profile_${user?.email}`) || '{}');
  const name     = stored.name     || user?.name || '';
  const phone    = stored.phone    || '+91 98765 43210';
  const dob      = stored.dob      || '1990-03-15';
  const address  = stored.address  || '123 Marine Drive, Mumbai, Maharashtra 400001';
  const nat      = stored.nat      || 'Indian';
  const passport = stored.passport || 'P1234567';

  const overlay = document.createElement('div');
  overlay.id = 'profile-edit-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.48);z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML = `
    <div class="card card-body" style="width:100%;max-width:520px;max-height:90vh;overflow-y:auto;position:relative">
      <button onclick="closeProfileEditModal()" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:22px;cursor:pointer;color:var(--gray-400);line-height:1">×</button>
      <h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:6px">Edit Profile</h3>
      <p style="font-size:12px;color:var(--gray-400);margin-bottom:18px">Changes will be reviewed by our team before taking effect.</p>
      <div id="profile-edit-success" style="display:none;padding:12px 14px;border-radius:8px;background:rgba(34,197,94,0.1);border:1px solid var(--green);color:var(--green);font-size:13px;margin-bottom:16px;align-items:center;gap:8px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Your changes have been submitted for review.
      </div>
      <div class="form-group"><label class="form-label">Full Name</label><input id="pe-name" type="text" class="form-input" value="${name}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Phone</label><input id="pe-phone" type="text" class="form-input" value="${phone}"></div>
        <div class="form-group"><label class="form-label">Date of Birth</label><input id="pe-dob" type="date" class="form-input" value="${dob}"></div>
      </div>
      <div class="form-group"><label class="form-label">Address</label><textarea id="pe-address" class="form-input" rows="2" style="resize:vertical">${address}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Nationality</label><input id="pe-nat" type="text" class="form-input" value="${nat}"></div>
        <div class="form-group"><label class="form-label">Passport No.</label><input id="pe-passport" type="text" class="form-input" value="${passport}"></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn btn-secondary" onclick="closeProfileEditModal()">Cancel</button>
        <button id="pe-submit-btn" class="btn btn-primary" onclick="submitProfileEdit()">Submit for Approval</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeProfileEditModal(); });
}

function submitProfileEdit() {
  const user = getSession();
  const name     = document.getElementById('pe-name')?.value.trim();
  const phone    = document.getElementById('pe-phone')?.value.trim();
  const dob      = document.getElementById('pe-dob')?.value;
  const address  = document.getElementById('pe-address')?.value.trim();
  const nat      = document.getElementById('pe-nat')?.value.trim();
  const passport = document.getElementById('pe-passport')?.value.trim();
  if (!name) { showToast('Full name is required.', 'error'); return; }

  const pending = { name, phone, dob, address, nat, passport, submittedAt: new Date().toLocaleString(), status: 'Pending Approval' };
  localStorage.setItem(`ti_profile_pending_${user?.email}`, JSON.stringify(pending));

  addNotification('ROLE_UNDERWRITER', {
    title: 'Profile Update Request',
    body: `Customer ${user?.fullName || user?.name || user?.email} has submitted profile changes for review.`,
  });

  const successEl = document.getElementById('profile-edit-success');
  if (successEl) { successEl.style.display = 'flex'; }
  const btn = document.getElementById('pe-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitted'; }
  showToast('Profile changes submitted for review.', 'success');
  setTimeout(closeProfileEditModal, 3000);
}

function closeProfileEditModal() {
  const el = document.getElementById('profile-edit-overlay');
  if (el) el.remove();
}
