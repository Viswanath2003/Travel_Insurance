/* ================================================================
   AGENT / BROKER PORTAL – Navigation + Page Renders
================================================================ */
function navigate(section) {
  document.querySelectorAll('#sidebar .sidebar-item').forEach(b => b.classList.toggle('active', b.dataset.section === section));
  const main = document.getElementById('app-main');
  const renders = { dashboard:renderDashboard, clients:renderClients, quote:renderQuote, policies:renderPolicies, renewals:renewals, commission:renderCommission, reports:renderReports };
  main.innerHTML = (renders[section] || renderDashboard)();
  main.scrollTop = 0;
}

function renderDashboard() {
  const user     = getSession();
  const policies = getStoredPolicies().filter(p => p.agentEmail === user.email);

  const commissionRate = p => SHARED_PLANS[p.planId]?.commissionRate || (p.planName?.toLowerCase().includes('pro') ? 0.15 : p.planName?.toLowerCase().includes('plus') ? 0.12 : 0.10);

  const totalPolicies   = policies.length;
  const totalPremium    = policies.reduce((s,p) => s + Number(p.premiumTotal||0), 0);
  const totalCommission = policies.reduce((s,p) => s + Number(p.commission || Number(p.premiumTotal||0) * commissionRate(p)), 0);

  const fmtINR = n => {
    if (n >= 10000000) return '₹' + (n/10000000).toFixed(1) + 'Cr';
    if (n >= 100000)   return '₹' + (n/100000).toFixed(1) + 'L';
    if (n >= 1000)     return '₹' + (n/1000).toFixed(1) + 'K';
    return '₹' + n.toLocaleString('en-IN');
  };

  const recentPolicies = [...policies]
    .sort((a,b) => new Date(b.purchasedOn||0) - new Date(a.purchasedOn||0))
    .slice(0, 5);

  const stats = [
    {val: totalPolicies,          label:'Total Policies Sold', color:'var(--blue)',  bg:'var(--blue-pale)'},
    {val: fmtINR(totalPremium),   label:'Total Premium (₹)',   color:'var(--green)', bg:'rgba(34,197,94,0.1)'},
    {val: fmtINR(totalCommission),label:'Commission Earned',   color:'var(--navy)',  bg:'rgba(15,27,60,0.06)'},
    {val: policies.filter(p=>p.status==='Active').length, label:'Active Policies', color:'var(--orange)', bg:'rgba(249,115,22,0.1)'},
  ];

  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">Agent Dashboard</h1><p class="page-sub">Welcome back, ${((user&&(user.fullName||user.name))||'Agent').split(' ')[0]}! Here's your portfolio overview.</p></div>
    <button class="btn btn-primary" onclick="navigate('quote')">+ New Quote</button>
  </div>
  <div class="grid-4" style="margin-bottom:20px">
    ${stats.map(s => `
      <div class="card stat-card">
        <div><div class="stat-value" style="color:${s.color};font-size:${String(s.val).length>5?'20px':'26px'}">${s.val}</div><div class="stat-label">${s.label}</div></div>
        <div class="stat-icon" style="background:${s.bg}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
      </div>
    `).join('')}
  </div>
  <div class="grid-2" style="gap:20px">
    <div class="card">
      <div class="card-header"><span class="card-title">Recent Policies</span><a href="#" onclick="navigate('policies');return false" style="font-size:12px;color:var(--blue);text-decoration:none">View all →</a></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Policy No</th><th>Policyholder</th><th>Plan</th><th>Premium</th><th>Status</th></tr></thead>
          <tbody>
            ${recentPolicies.length ? recentPolicies.map(p => {
              const rate = commissionRate(p);
              const comm = p.commission || Math.round(Number(p.premiumTotal||0) * rate);
              return `
              <tr>
                <td style="font-weight:600;color:var(--navy)">${p.policyNo}</td>
                <td><div style="font-weight:600;color:var(--navy)">${p.userName||'—'}</div><div style="font-size:11px;color:var(--gray-400)">${p.userEmail||''}</div></td>
                <td style="font-size:12px;color:var(--gray-500)">${p.planName||p.planId||'—'}</td>
                <td style="font-weight:600;color:var(--navy)">₹${Number(p.premiumTotal||0).toLocaleString('en-IN')}</td>
                <td><span class="badge ${p.status==='Active'?'badge-green':p.status==='Expired'?'badge-red':'badge-orange'}">${p.status||'—'}</span></td>
              </tr>`;
            }).join('') : `<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:20px">No policies found</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">Commission Breakdown by Plan</h3>
      ${Object.values(SHARED_PLANS).map(plan => {
        const grpPolicies = policies.filter(p => p.planId === plan.id);
        const premium = grpPolicies.reduce((s,p) => s + Number(p.premiumTotal||0), 0);
        const comm = Math.round(premium * plan.commissionRate);
        return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100)">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--navy)">${plan.name} <span style="color:var(--gray-400);font-weight:400">(${Math.round(plan.commissionRate*100)}%)</span></div>
            <div style="font-size:11px;color:var(--gray-400)">${grpPolicies.length} polic${grpPolicies.length!==1?'ies':'y'} · Premium: ₹${premium.toLocaleString('en-IN')}</div>
          </div>
          <span style="font-size:14px;font-weight:700;color:var(--green)">₹${comm.toLocaleString('en-IN')}</span>
        </div>`;}).join('')}
      <div style="padding-top:10px;font-size:13px;display:flex;justify-content:space-between;font-weight:700">
        <span>Total Commission</span><span style="color:var(--green)">${fmtINR(totalCommission)}</span>
      </div>
    </div>
  </div>`;
}

function getAgentClients() {
  return JSON.parse(localStorage.getItem('ti_agent_clients') || '[]');
}

function renderClients() {
  const clients = getAgentClients();
  const policies = getStoredPolicies();
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">My Clients</h1><p class="page-sub">${clients.length} client${clients.length !== 1 ? 's' : ''} in your portfolio</p></div>
    <button class="btn btn-primary" onclick="showAddClientForm()">+ Add Client</button>
  </div>
  <div id="add-client-form" style="display:none;margin-bottom:16px">
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">New Client Details</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" id="ac-name" class="form-input" placeholder="e.g. Ravi Sharma">
          <div id="ac-name-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input type="email" id="ac-email" class="form-input" placeholder="client@example.com">
          <div id="ac-email-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Phone *</label>
          <input type="text" id="ac-phone" class="form-input" placeholder="+91 9876543210">
          <div id="ac-phone-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Nationality</label>
          <input type="text" id="ac-nationality" class="form-input" placeholder="Indian">
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:12px">
        <button class="btn btn-outline" onclick="document.getElementById('add-client-form').style.display='none'">Cancel</button>
        <button class="btn btn-primary" onclick="saveClient()">Save Client</button>
      </div>
    </div>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:16px">
    <input type="text" id="client-search" class="form-input" style="max-width:280px" placeholder="Search by name or email..." oninput="filterClients()">
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Client</th><th>Phone</th><th>Policies</th><th>Total Premium</th><th>Actions</th></tr></thead>
        <tbody id="clients-tbody">
          ${renderClientsRows(clients, policies)}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderClientsRows(clients, policies) {
  if (clients.length === 0) return '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--gray-400)">No clients yet. Click "+ Add Client" to add your first client.</td></tr>';
  return clients.map(c => {
    const cPolicies = policies.filter(p => p.userEmail === c.email);
    const totalPremium = cPolicies.reduce((s, p) => s + Number(p.premiumTotal || 0), 0);
    return `
    <tr>
      <td><div style="font-weight:600;color:var(--navy)">${c.name}</div><div style="font-size:11px;color:var(--gray-400)">${c.email}</div></td>
      <td style="font-size:12px">${c.phone}</td>
      <td style="text-align:center;font-weight:600">${cPolicies.length}</td>
      <td style="font-weight:600">${totalPremium > 0 ? '₹' + totalPremium.toLocaleString('en-IN') : '—'}</td>
      <td>
        <button class="btn btn-primary btn-xs" onclick="startQuoteForClient('${c.email}','${c.name}')">Quote</button>
      </td>
    </tr>`;
  }).join('');
}

function showAddClientForm() {
  const form = document.getElementById('add-client-form');
  if (form) { form.style.display = form.style.display === 'none' ? 'block' : 'none'; }
}

function saveClient() {
  const name  = document.getElementById('ac-name')?.value?.trim();
  const email = document.getElementById('ac-email')?.value?.trim();
  const phone = document.getElementById('ac-phone')?.value?.trim();
  let valid = true;
  const nameErr  = V.name(name);
  const emailErr = V.email(email);
  const phoneErr = V.phone(phone);
  document.getElementById('ac-name-err').textContent  = nameErr  || '';
  document.getElementById('ac-email-err').textContent = emailErr || '';
  document.getElementById('ac-phone-err').textContent = phoneErr || '';
  if (nameErr || emailErr || phoneErr) return;

  const clients = getAgentClients();
  if (clients.find(c => c.email === email)) {
    document.getElementById('ac-email-err').textContent = 'A client with this email already exists.';
    return;
  }
  clients.push({ id: Date.now(), name, email, phone, nationality: document.getElementById('ac-nationality')?.value?.trim() || '', addedOn: new Date().toISOString() });
  localStorage.setItem('ti_agent_clients', JSON.stringify(clients));
  showToast(`Client "${name}" added successfully!`, 'success');
  navigate('clients');
}

function filterClients() {
  const q = (document.getElementById('client-search')?.value || '').toLowerCase();
  const clients = getAgentClients().filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  const tbody = document.getElementById('clients-tbody');
  if (tbody) tbody.innerHTML = renderClientsRows(clients, getStoredPolicies());
}

let _quoteClient = null;

function startQuoteForClient(email, name) {
  _quoteClient = { email, name };
  _agentQuoteState = { clientEmail: email };
  navigate('quote');
}

let _agentQuoteState = {};

function renderQuote() {
  const clients  = getAgentClients();
  const tomorrow = getTomorrowStr();
  const qs = _agentQuoteState;
  return `
  <div class="page-header"><h1 class="page-title">Generate Quote</h1><p class="page-sub">Create and bind a travel insurance quote for your client</p></div>
  <div class="grid-2" style="gap:20px">
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:16px">Client & Trip Details</h3>
      <div class="form-group">
        <label class="form-label">Client *</label>
        <select id="q-client" class="form-input" onchange="agentQuoteUpdate()">
          <option value="">— Select client —</option>
          ${clients.map(c => `<option value="${c.email}" data-name="${c.name}" ${qs.clientEmail === c.email ? 'selected':''} >${c.name} (${c.email})</option>`).join('')}
          <option value="__new__">+ New client (enter email below)</option>
        </select>
        <div id="q-client-err" class="form-error"></div>
      </div>
      <div id="q-new-client-fields" style="display:${qs.clientEmail === '__new__' ? 'block' : 'none'}">
        <div class="form-group">
          <label class="form-label">Client Name *</label>
          <input type="text" id="q-new-name" class="form-input" placeholder="Full name" value="${qs.newName || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Client Email *</label>
          <input type="email" id="q-new-email" class="form-input" placeholder="client@example.com" value="${qs.newEmail || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Destination *</label>
          <select id="q-dest" class="form-input" onchange="agentQuoteUpdate()">
            <option value="">Select destination...</option>
            ${SHARED_DESTINATIONS.map(d => `<option value="${d.value}" data-mult="${d.mult}" ${qs.dest === d.value ? 'selected':''}>${d.label}</option>`).join('')}
          </select>
          <div id="q-dest-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Travelers</label>
          <select id="q-travelers" class="form-input" onchange="agentQuoteUpdate()">
            ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${qs.travelers == n ? 'selected':''}>${n} traveler${n>1?'s':''}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Departure *</label>
          <input type="date" id="q-start" class="form-input" min="${tomorrow}" value="${qs.startDate || ''}" onchange="agentQuoteUpdate()">
          <div id="q-start-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Return *</label>
          <input type="date" id="q-end" class="form-input" min="${tomorrow}" value="${qs.endDate || ''}" onchange="agentQuoteUpdate()">
          <div id="q-end-err" class="form-error"></div>
        </div>
      </div>
      <div id="q-duration" style="font-size:13px;color:var(--blue);font-weight:600;margin-top:-8px;margin-bottom:8px"></div>
      <div class="form-group">
        <label class="form-label">Trip Purpose</label>
        <select id="q-purpose" class="form-input" onchange="agentQuoteUpdate()">
          ${['Tourism / Leisure','Business','Education / Study','Medical Tourism','Adventure / Sports','Family Visit'].map(p => `<option ${qs.purpose === p ? 'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">Select Plan & Premium</h3>
      ${Object.values(SHARED_PLANS).map(plan => {
        const premium = agentCalcPremium(plan.id, qs);
        const commission = Math.round(premium * plan.commissionRate);
        const selected = (qs.planId === plan.id);
        return `
        <div class="plan-card${selected ? ' selected' : ''}" style="margin-bottom:12px;cursor:pointer;border:2px solid ${selected ? plan.color : 'var(--gray-200)'};border-radius:12px;padding:14px"
          onclick="selectAgentPlan('${plan.id}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--navy)">${plan.name}</div>
              ${plan.tag ? `<span class="badge" style="background:${plan.color}22;color:${plan.color}">${plan.tag}</span>` : ''}
              <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">Your commission: ${Math.round(plan.commissionRate * 100)}% = ₹${commission > 0 ? commission.toLocaleString('en-IN') : '—'}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:16px;font-weight:700;color:${plan.color}">₹${plan.dailyRate}/day</div>
              ${premium > 0 ? `<div style="font-size:13px;font-weight:700;color:var(--navy)">Total: ₹${premium.toLocaleString('en-IN')}</div>` : ''}
            </div>
          </div>
        </div>`;}).join('')}
      <div id="q-plan-err" class="form-error" style="margin-bottom:8px"></div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-outline btn-block" onclick="emailAgentQuote()">Email Quote to Client</button>
        <button class="btn btn-primary btn-block" onclick="bindAgentPolicy()">Bind Policy →</button>
      </div>
    </div>
  </div>`;
}

function agentCalcPremium(planId, qs) {
  if (!qs.dest || !qs.startDate || !qs.endDate || qs.endDate <= qs.startDate) return 0;
  const days = Math.ceil((new Date(qs.endDate) - new Date(qs.startDate)) / 86400000);
  const destOpt = SHARED_DESTINATIONS.find(d => d.value === qs.dest);
  const mult = destOpt ? destOpt.mult : 1;
  return calcSharedPremium(planId, days, parseInt(qs.travelers) || 1, mult, 1, []);
}

function agentQuoteUpdate() {
  const sel = document.getElementById('q-client');
  const clientEmail = sel?.value;
  const newFields = document.getElementById('q-new-client-fields');
  if (newFields) newFields.style.display = clientEmail === '__new__' ? 'block' : 'none';

  _agentQuoteState = {
    ..._agentQuoteState,
    clientEmail,
    newName:    document.getElementById('q-new-name')?.value || _agentQuoteState.newName,
    newEmail:   document.getElementById('q-new-email')?.value || _agentQuoteState.newEmail,
    dest:       document.getElementById('q-dest')?.value,
    travelers:  document.getElementById('q-travelers')?.value || 1,
    startDate:  document.getElementById('q-start')?.value,
    endDate:    document.getElementById('q-end')?.value,
    purpose:    document.getElementById('q-purpose')?.value,
    planId:     _agentQuoteState.planId,
  };

  const s = _agentQuoteState.startDate, e = _agentQuoteState.endDate;
  const dur = document.getElementById('q-duration');
  if (dur && s && e && e > s) {
    const days = Math.ceil((new Date(e) - new Date(s)) / 86400000);
    dur.textContent = `Trip duration: ${days} day${days > 1 ? 's' : ''}`;
  } else if (dur) dur.textContent = '';

  // Re-render plan cards with updated premiums
  document.getElementById('app-main').innerHTML = renderQuote();
}

function selectAgentPlan(planId) {
  _agentQuoteState.planId = planId;
  agentQuoteUpdate();
}

function emailAgentQuote() {
  const qs = _agentQuoteState;
  const clientSel = document.getElementById('q-client');
  const clientName = clientSel?.selectedOptions[0]?.dataset?.name || qs.newName || 'the client';
  if (!qs.planId) { showToast('Please select a plan first.', 'warning'); return; }
  if (!qs.dest || !qs.startDate || !qs.endDate) { showToast('Please fill in all trip details.', 'warning'); return; }
  const premium = agentCalcPremium(qs.planId, qs);
  showToast(`Quote emailed to ${clientName} — ₹${premium.toLocaleString('en-IN')} for ${SHARED_PLANS[qs.planId]?.name}`, 'success');
}

function bindAgentPolicy() {
  const qs = _agentQuoteState;
  const tomorrow = getTomorrowStr();
  let valid = true;

  const clientSel = document.getElementById('q-client');
  const clientEmail = clientSel?.value;
  let clientName = '';

  if (!clientEmail || clientEmail === '') {
    document.getElementById('q-client-err').textContent = 'Please select a client.'; valid = false;
  } else {
    document.getElementById('q-client-err').textContent = '';
    if (clientEmail === '__new__') {
      const ne = document.getElementById('q-new-email')?.value?.trim();
      const nn = document.getElementById('q-new-name')?.value?.trim();
      if (!nn || !ne) { showToast('Enter client name and email for a new client.', 'warning'); return; }
      clientName = nn;
      qs.resolvedEmail = ne;
    } else {
      clientName = clientSel.selectedOptions[0]?.dataset?.name || '';
      qs.resolvedEmail = clientEmail;
    }
  }

  if (!qs.dest) { document.getElementById('q-dest-err').textContent = 'Select destination.'; valid = false; }
  else document.getElementById('q-dest-err').textContent = '';

  if (!qs.startDate || qs.startDate < tomorrow) {
    document.getElementById('q-start-err').textContent = 'Departure must be from tomorrow or later.'; valid = false;
  } else document.getElementById('q-start-err').textContent = '';

  if (!qs.endDate || qs.endDate <= qs.startDate) {
    document.getElementById('q-end-err').textContent = 'Return must be after departure.'; valid = false;
  } else document.getElementById('q-end-err').textContent = '';

  if (!qs.planId) { document.getElementById('q-plan-err').textContent = 'Please select a plan.'; valid = false; }
  else document.getElementById('q-plan-err').textContent = '';

  if (!valid) return;

  const user   = getSession();
  const plan   = SHARED_PLANS[qs.planId];
  const days   = Math.ceil((new Date(qs.endDate) - new Date(qs.startDate)) / 86400000);
  const premium = agentCalcPremium(qs.planId, qs);
  const commission = Math.round(premium * plan.commissionRate);
  const policyNo = 'AGT' + Date.now().toString().slice(-8);

  // Save new client if applicable
  if (clientEmail === '__new__') {
    const clients = getAgentClients();
    if (!clients.find(c => c.email === qs.resolvedEmail)) {
      clients.push({ id: Date.now(), name: clientName, email: qs.resolvedEmail, phone: '', nationality: '', addedOn: new Date().toISOString() });
      localStorage.setItem('ti_agent_clients', JSON.stringify(clients));
    }
  }

  // Determine risk score (simplified — agents get standard score)
  const riskScore = qs.purpose === 'Medical Tourism' ? 55 : qs.purpose === 'Adventure / Sports' ? 50 : 20;
  const policyStatus = riskScore <= 30 ? 'Active' : riskScore <= 50 ? 'Pending Review' : 'Pending UW';

  storePolicy({
    policyNo,
    planId: qs.planId,
    planName: plan.name,
    userEmail: qs.resolvedEmail,
    userName: clientName,
    dest: SHARED_DESTINATIONS.find(d => d.value === qs.dest)?.label || qs.dest,
    startDate: qs.startDate,
    endDate: qs.endDate,
    days,
    travelers: parseInt(qs.travelers) || 1,
    purpose: qs.purpose || '',
    ageGroups: [],
    addons: [],
    premiumTotal: premium,
    status: policyStatus,
    riskScore,
    riskLevel: riskScore <= 30 ? 'Low' : riskScore <= 50 ? 'Medium' : 'High',
    purchasedOn: new Date().toISOString(),
    agentEmail: user.email,
    agentName: user.fullName || user.name,
    commission,
  });

  addNotification('ROLE_FINANCE', { title: 'Premium Received (Agent)', body: `₹${premium.toLocaleString('en-IN')} for ${policyNo} (${plan.name}) — Agent: ${user.fullName || user.name}` });
  if (policyStatus === 'Pending UW') addNotification('ROLE_UNDERWRITER', { title: 'New Policy in Queue (Agent)', body: `${policyNo} · ${plan.name} · ${clientName} — Agent-bound` });
  if (policyStatus === 'Pending Review') addNotification('ROLE_CLAIMS_OFFICER', { title: 'Policy Requires Review (Agent)', body: `${policyNo} · ${plan.name} · ${clientName}` });

  showToast(`Policy ${policyNo} bound successfully! Premium: ₹${premium.toLocaleString('en-IN')} · Commission: ₹${commission.toLocaleString('en-IN')}`, 'success');
  _agentQuoteState = {};
  _quoteClient = null;
  setTimeout(() => navigate('policies'), 1200);
}

function renderPolicies() {
  const user = getSession();
  const allPolicies = getStoredPolicies();
  const agentPolicies = allPolicies.filter(p => p.agentEmail === user.email);
  return `
  <div class="page-header"><h1 class="page-title">Bound Policies</h1><p class="page-sub">${agentPolicies.length} polic${agentPolicies.length !== 1 ? 'ies' : 'y'} in your portfolio</p></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Policy No</th><th>Client</th><th>Plan</th><th>Premium</th><th>Status</th></tr></thead>
        <tbody>
          ${agentPolicies.length === 0
            ? '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--gray-400)">No bound policies yet. Use Generate Quote to bind your first policy.</td></tr>'
            : agentPolicies.sort((a,b) => new Date(b.purchasedOn||0) - new Date(a.purchasedOn||0)).map(p => {
                const stMap = { Active:'badge-green', 'Pending Review':'badge-yellow', 'Pending UW':'badge-orange', Rejected:'badge-red' };
                return `
                <tr>
                  <td style="font-weight:600;color:var(--navy)">${p.policyNo}</td>
                  <td><div style="font-weight:600;color:var(--navy)">${p.userName}</div><div style="font-size:11px;color:var(--gray-400)">${p.userEmail}</div></td>
                  <td style="font-size:12px;color:var(--gray-500)">${p.planName}</td>
                  <td style="font-weight:600">₹${Number(p.premiumTotal||0).toLocaleString('en-IN')}</td>
                  <td><span class="badge ${stMap[p.status] || 'badge-gray'}">${p.status === 'Pending UW' || p.status === 'Pending Review' ? 'Under Review' : p.status}</span></td>
                </tr>`;}).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renewals() {
  const user = getSession();
  const today = new Date();
  const in30  = new Date(); in30.setDate(in30.getDate() + 30);
  const expiring = getStoredPolicies()
    .filter(p => p.agentEmail === user.email && p.status === 'Active')
    .filter(p => { const d = new Date(p.endDate); return d >= today && d <= in30; })
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
  return `
  <div class="page-header"><h1 class="page-title">Renewals</h1><p class="page-sub">${expiring.length} polic${expiring.length !== 1 ? 'ies' : 'y'} expiring in the next 30 days</p></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Policy</th><th>Client</th><th>Expiry</th><th>Premium</th><th>Action</th></tr></thead>
        <tbody>
          ${expiring.length === 0
            ? '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--gray-400)">No policies expiring in the next 30 days.</td></tr>'
            : expiring.map(r => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${r.policyNo}</td>
              <td>${r.userName}</td>
              <td style="font-size:12px;color:var(--orange);font-weight:600">${formatDate(r.endDate)}</td>
              <td style="font-weight:600">₹${Number(r.premiumTotal||0).toLocaleString('en-IN')}</td>
              <td>
                <button class="btn btn-primary btn-xs" onclick="showToast('Renewal flow coming in Phase C','info')">Renew</button>
                <button class="btn btn-secondary btn-xs" onclick="showToast('Reminder sent to ${r.userName}','success')">Remind Client</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderCommission() {
  const user = getSession();
  const policies = getStoredPolicies().filter(p => p.agentEmail === user.email);
  const totalCommission = policies.reduce((s, p) => s + Number(p.commission || 0), 0);
  const activeCommission = policies.filter(p => p.status === 'Active').reduce((s, p) => s + Number(p.commission || 0), 0);
  const pendingCommission = policies.filter(p => p.status !== 'Active' && p.status !== 'Rejected').reduce((s, p) => s + Number(p.commission || 0), 0);
  return `
  <div class="page-header"><h1 class="page-title">My Commission</h1></div>
  <div class="grid-3" style="margin-bottom:20px">
    ${[
      { val: '₹' + totalCommission.toLocaleString('en-IN'),   label:'Total Commission',    sub:'All time' },
      { val: '₹' + activeCommission.toLocaleString('en-IN'),  label:'Earned (Active)',     sub:'On active policies' },
      { val: '₹' + pendingCommission.toLocaleString('en-IN'), label:'Pending',             sub:'Policies under review' },
    ].map(s => `<div class="card stat-card"><div><div class="stat-value" style="color:var(--navy);font-size:20px">${s.val}</div><div class="stat-label">${s.label}</div><div style="font-size:11px;color:var(--gray-400);margin-top:3px">${s.sub}</div></div></div>`).join('')}
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Commission Breakdown</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Policy</th><th>Client</th><th>Premium</th><th>Rate</th><th>Commission</th><th>Status</th></tr></thead>
        <tbody>
          ${policies.length === 0
            ? '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">No commission records yet. Bind policies to start earning.</td></tr>'
            : policies.sort((a,b) => new Date(b.purchasedOn||0) - new Date(a.purchasedOn||0)).map(p => {
                const rate = SHARED_PLANS[p.planId]?.commissionRate || 0.10;
                const comm = p.commission || Math.round(Number(p.premiumTotal || 0) * rate);
                return `
                <tr>
                  <td style="font-weight:600;color:var(--navy)">${p.policyNo}</td>
                  <td>${p.userName}</td>
                  <td>₹${Number(p.premiumTotal||0).toLocaleString('en-IN')}</td>
                  <td style="color:var(--blue);font-weight:600">${Math.round(rate * 100)}%</td>
                  <td style="font-weight:700;color:var(--navy)">₹${comm.toLocaleString('en-IN')}</td>
                  <td><span class="badge ${p.status === 'Active' ? 'badge-green' : 'badge-yellow'}">${p.status === 'Active' ? 'Earned' : 'Pending'}</span></td>
                </tr>`;}).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderReports() {
  return `
  <div class="page-header"><h1 class="page-title">Reports</h1></div>
  <div class="grid-2" style="gap:16px">
    ${[
      {title:'Policy Sales Report',desc:'Monthly sales volume and revenue by plan',icon:'📊'},
      {title:'Renewal Forecast',desc:'Upcoming renewals and projected premium',icon:'🔄'},
      {title:'Commission Statement',desc:'Detailed commission breakdown and payouts',icon:'💰'},
      {title:'Client Activity Report',desc:'Client engagement and policy activity',icon:'👥'},
    ].map(r => `
      <div class="card card-body" style="cursor:pointer" onclick="showToast('Generating ${r.title}...','info')">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="font-size:32px">${r.icon}</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--navy)">${r.title}</div>
            <div style="font-size:12px;color:var(--gray-500);margin-top:2px">${r.desc}</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" style="margin-top:12px;align-self:flex-start" onclick="event.stopPropagation();showToast('Downloading report...','info')">Download PDF</button>
      </div>
    `).join('')}
  </div>`;
}
