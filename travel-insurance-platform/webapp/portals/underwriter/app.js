/* ================================================================
   UNDERWRITER PORTAL – RBAC + localStorage-driven
   Single ROLE_UNDERWRITER (L1/L2 removed).
   Absorbs admin functions: product mgmt, rules, config, users, audit.
   "Forward" replaces "Escalate" throughout.
================================================================ */

function navigate(section) {
  document.querySelectorAll('#sidebar .sidebar-item').forEach(b => {
    b.classList.toggle('active', b.dataset.section === section);
  });
  const main = document.getElementById('app-main');
  const user  = getSession();
  const renders = {
    dashboard:    renderDashboard,
    queue:        renderQueue,
    review:       renderReview,
    forwarded:    renderForwarded,
    completed:    renderCompleted,
    reports:      renderReports,
    products:     renderProducts,
    rules:        renderRules,
    config:       renderConfig,
    users:        renderUsers,
    'audit-log':  renderAuditLog,
  };
  main.innerHTML = (renders[section] || renderDashboard)();
  main.scrollTop = 0;
  updateNotifBadge(user.role);
  updateSidebarBadges();
}

function getMyQueue() {
  const all = getStoredPolicies();
  return all.filter(p => p.status === 'Pending UW' || p.status === 'Pending UW Review');
}

function updateSidebarBadges() {
  const q = getMyQueue().length;
  const el = document.querySelector('[data-section="queue"] .badge');
  if (el) el.textContent = q;
}

function renderDashboard() {
  const user  = getSession();
  const firstName = (user?.fullName || user?.name || 'Underwriter').split(' ')[0];
  const allPolicies = getStoredPolicies();
  const allClaims   = getStoredClaims();
  const queue = getMyQueue();
  const completed = allPolicies.filter(p => p.uwDecision);
  const forwarded = allPolicies.filter(p => p.status === 'Forwarded to Field');
  const approved = completed.filter(p => p.uwDecision === 'Approved').length;

  return `
  <div class="page-header flex">
    <div>
      <h1 class="page-title">Underwriter Dashboard</h1>
      <p class="page-sub">Welcome back, ${firstName}! Here is your workload and queue summary.</p>
    </div>
  </div>
  <div class="grid-4" style="margin-bottom:24px">
    ${[
      { val: String(queue.length), label: 'In UW Queue', color: 'var(--blue)', bg: 'var(--blue-pale)', icon: Icons.file },
      { val: String(forwarded.length), label: 'Forwarded to Field', color: 'var(--orange)', bg: 'rgba(249,115,22,0.1)', icon: Icons.warning },
      { val: String(approved), label: 'Approved Total', color: 'var(--green)', bg: 'rgba(34,197,94,0.1)', icon: Icons.check },
      { val: String(allClaims.filter(c => c.status === 'Under Review').length), label: 'Claims in Review', color: 'var(--orange)', bg: 'rgba(249,115,22,0.1)', icon: Icons.clipboard },
    ].map(s => `
      <div class="card stat-card">
        <div>
          <div class="stat-value" style="color:${s.color}">${s.val}</div>
          <div class="stat-label">${s.label}</div>
        </div>
        <div class="stat-icon" style="background:${s.bg}">${s.icon}</div>
      </div>`).join('')}
  </div>

  <div class="grid-2" style="gap:20px">
    <div class="card">
      <div class="card-header">
        <span class="card-title">Priority Queue${queue.length > 0 ? ` <span class="badge" style="background:var(--red);color:white;margin-left:6px">${queue.length}</span>` : ''}</span>
        <a href="#" onclick="navigate('queue');return false" style="font-size:12px;color:var(--blue);text-decoration:none">View all →</a>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Policy No</th><th>Customer</th><th>Plan</th><th>Risk</th><th>Action</th></tr></thead>
          <tbody>
            ${queue.slice(0, 5).map(p => {
              const { level, color } = getRiskInfo(p.riskScore || 0);
              return `
              <tr>
                <td style="font-weight:600;color:var(--navy)">${p.policyNo}</td>
                <td>${p.userName}</td>
                <td style="font-size:12px">${p.planName}</td>
                <td><span class="badge" style="background:${color}22;color:${color}">${level} (${p.riskScore})</span></td>
                <td><button class="btn btn-primary btn-xs" onclick="reviewPolicy('${p.policyNo}')">Review</button></td>
              </tr>`;}).join('') || '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--gray-400)">No applications in queue</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card card-body">
      <div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:16px">SLA & Performance</div>
      ${[
        { label: 'Applications Reviewed', val: String(completed.length), color: 'var(--navy)' },
        { label: 'Approved', val: String(approved), color: 'var(--green)' },
        { label: 'Rejected', val: String(completed.filter(p => p.uwDecision === 'Rejected').length), color: 'var(--red)' },
        { label: 'Current Queue', val: String(queue.length), color: 'var(--blue)' },
      ].map(s => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100)">
          <span style="font-size:13px;color:var(--gray-600)">${s.label}</span>
          <span style="font-size:16px;font-weight:700;color:${s.color}">${s.val}</span>
        </div>`).join('')}
      <div class="alert alert-info" style="margin-top:16px;font-size:12px">
        You review all forwarded applications. Forward to Field Investigation for cases requiring on-site verification.
      </div>
    </div>
  </div>`;
}

function renderQueue() {
  const queue = getMyQueue();
  return `
  <div class="page-header flex">
    <div>
      <h1 class="page-title">Underwriting Queue</h1>
      <p class="page-sub">${queue.length} application${queue.length !== 1 ? 's' : ''} pending review</p>
    </div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Policy No</th><th>Customer</th><th>Plan</th><th>Destination</th><th>Risk Score</th><th>Risk Level</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          ${queue.length === 0
            ? `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--gray-400)">🎉 Queue is empty — no pending applications.</td></tr>`
            : queue.map(p => {
              const { level, color } = getRiskInfo(p.riskScore || 0);
              return `
              <tr>
                <td style="font-weight:700;color:var(--navy)">${p.policyNo}</td>
                <td>${p.userName}</td>
                <td style="font-size:12px;color:var(--gray-600)">${p.planName}</td>
                <td style="font-size:12px">${p.dest}</td>
                <td><span style="font-size:14px;font-weight:700;color:${color}">${p.riskScore}</span></td>
                <td><span class="badge" style="background:${color}22;color:${color}">${level}</span></td>
                <td style="font-size:12px;color:var(--gray-400)">${formatDate(p.purchasedOn)}</td>
                <td>
                  <button class="btn btn-primary btn-xs" onclick="reviewPolicy('${p.policyNo}')">Review</button>
                </td>
              </tr>`;}).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

let _reviewingPolicyNo = null;

function reviewPolicy(policyNo) {
  _reviewingPolicyNo = policyNo;
  navigate('review');
}

function renderReview() {
  const user = getSession();
  const policyNo = _reviewingPolicyNo;
  if (!policyNo) {
    const q = getMyQueue();
    if (q.length > 0) { _reviewingPolicyNo = q[0].policyNo; return renderReview(); }
    return `<div class="page-header"><h1 class="page-title">Review</h1></div><div class="card card-body" style="text-align:center;padding:40px;color:var(--gray-400)">No application selected. <a href="#" onclick="navigate('queue');return false" class="link">Go to Queue →</a></div>`;
  }

  const all = getStoredPolicies();
  const policy = all.find(p => p.policyNo === policyNo);
  if (!policy) return `<div style="padding:40px;text-align:center;color:var(--gray-400)">Policy not found.</div>`;

  const { level, color, icon } = getRiskInfo(policy.riskScore || 0);
  const plan = { basic: 'PolicyPilot Basic', plus: 'PolicyPilot Plus', pro: 'PolicyPilot Pro' }[policy.planId] || policy.planName;

  return `
  <div class="page-header">
    <button class="btn btn-ghost btn-sm" onclick="navigate('queue')" style="color:var(--blue);padding-left:0;margin-bottom:8px">← Back to Queue</button>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <h1 class="page-title">Risk Review — ${policyNo}</h1>
      <span class="badge" style="background:${color}22;color:${color}">${level} Risk</span>
    </div>
    <p class="page-sub">${policy.userName} · ${plan} · ${policy.dest}</p>
  </div>

  <div class="grid-2" style="gap:20px">
    <div>
      <div class="card card-body" style="margin-bottom:16px">
        <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">Application Details</h3>
        ${[
          ['Policy No', policyNo],
          ['Customer', policy.userName],
          ['Email', policy.userEmail],
          ['Plan', plan],
          ['Destination', policy.dest],
          ['Trip Duration', policy.days + ' days'],
          ['Travelers', policy.travelers],
          ['Purpose', policy.purpose || '—'],
          ['Age Groups', (policy.ageGroups || []).join(', ') || '—'],
          ['Add-ons', (policy.addons || []).join(', ') || 'None'],
          ['Premium', '₹' + (policy.premiumTotal || 0).toLocaleString('en-IN')],
          ['Applied On', formatDate(policy.purchasedOn)],
        ].map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--gray-100)">
            <span style="color:var(--gray-400)">${k}</span>
            <span style="font-weight:600;color:var(--navy)">${v}</span>
          </div>`).join('')}
      </div>
    </div>

    <div>
      <div class="card card-body" style="margin-bottom:16px">
        <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:12px">Risk Analysis</h3>
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:48px;font-weight:800;color:${color};line-height:1">${policy.riskScore}</div>
          <div style="font-size:12px;color:var(--gray-400)">/ 100</div>
          <div style="margin-top:8px;display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;background:${color}22;color:${color}">${level} Risk</div>
          <div style="margin-top:8px;height:8px;background:var(--gray-100);border-radius:4px;overflow:hidden;max-width:200px;margin-left:auto;margin-right:auto">
            <div style="height:100%;width:${Math.min(policy.riskScore,100)}%;background:${color};border-radius:4px;transition:width 0.5s"></div>
          </div>
        </div>
        ${policy.riskLevel === 'Very High' ? `<div class="alert alert-error" style="font-size:12px;margin-bottom:12px">Very High Risk — senior underwriter review required before issuing.</div>` : ''}
        ${policy.riskLevel === 'High' ? `<div class="alert alert-warning" style="font-size:12px;margin-bottom:12px">High Risk — underwriter review required before policy can be issued.</div>` : ''}
      </div>

      <div class="card card-body">
        <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:12px">Decision</h3>
        ${[
          { id: 'approve', label: 'Approve', desc: 'Issue policy — meets underwriting guidelines', color: 'var(--green)' },
          { id: 'approve-cond', label: 'Approve with Conditions', desc: 'Issue with specific terms or exclusions', color: 'var(--yellow)' },
          { id: 'forward-field', label: 'Forward to Field Investigation', desc: 'Assign a field officer to verify details on-site', color: 'var(--blue)' },
          { id: 'reject', label: 'Reject', desc: 'Policy cannot be issued under current risk profile', color: 'var(--red)' },
        ].map((d, i) => `
          <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1.5px solid ${i === 0 ? d.color : 'var(--gray-200)'};border-radius:8px;cursor:pointer;background:${i === 0 ? d.color + '11' : 'white'};margin-bottom:8px" id="dec-lbl-${d.id}"
            onclick="document.querySelectorAll('[id^=dec-lbl]').forEach(l=>l.style.borderColor='var(--gray-200)');this.style.borderColor='${d.color}'">
            <input type="radio" name="uw-decision" value="${d.id}" ${i === 0 ? 'checked' : ''} style="margin-top:2px;accent-color:${d.color}">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${d.label}</div>
              <div style="font-size:11px;color:var(--gray-500)">${d.desc}</div>
            </div>
          </label>`).join('')}
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">Remarks *</label>
          <textarea id="uw-remarks" class="form-input" rows="3" placeholder="Enter your decision remarks..."></textarea>
        </div>
        <div style="display:flex;gap:10px;margin-top:12px">
          <button class="btn btn-outline" onclick="navigate('queue')">Cancel</button>
          <button class="btn btn-primary" style="flex:1" onclick="submitUWDecision('${policyNo}')">Submit Decision →</button>
        </div>
      </div>
    </div>
  </div>`;
}

function submitUWDecision(policyNo) {
  const decision = document.querySelector('input[name="uw-decision"]:checked')?.value;
  const remarks  = document.getElementById('uw-remarks')?.value?.trim();
  if (!remarks) { showToast('Please enter remarks for your decision.', 'warning'); return; }

  const user = getSession();
  const all  = JSON.parse(localStorage.getItem('ti_policies') || '[]');
  const idx  = all.findIndex(p => p.policyNo === policyNo);
  if (idx < 0) { showToast('Policy not found.', 'error'); return; }

  const policy = all[idx];
  if (decision === 'approve') {
    all[idx].status = 'Active'; all[idx].uwDecision = 'Approved';
    addNotification('ROLE_CUSTOMER', { title: 'Policy Approved!', body: `Your policy ${policyNo} has been approved and is now active. ${remarks}`, userEmail: policy.userEmail });
  } else if (decision === 'approve-cond') {
    all[idx].status = 'Active'; all[idx].uwDecision = 'Approved (Conditional)';
    addNotification('ROLE_CUSTOMER', { title: 'Policy Approved with Conditions', body: `Policy ${policyNo} approved. Conditions: ${remarks}`, userEmail: policy.userEmail });
  } else if (decision === 'forward-field') {
    all[idx].status = 'Forwarded to Field'; all[idx].uwDecision = 'Forwarded to Field';
    addNotification('ROLE_FIELD_OFFICER', { title: 'New Field Investigation Required', body: `${policyNo} · Risk: ${policy.riskLevel} · Forwarded by ${user.fullName || user.name}: ${remarks}` });
    addNotification('ROLE_CUSTOMER', { title: 'Application Under Review', body: `Policy ${policyNo} is under detailed review. Our field team will follow up shortly.`, userEmail: policy.userEmail });
  } else if (decision === 'reject') {
    all[idx].status = 'Rejected'; all[idx].uwDecision = 'Rejected';
    addNotification('ROLE_CUSTOMER', { title: 'Policy Application Rejected', body: `We regret to inform that policy ${policyNo} could not be approved. Reason: ${remarks}`, userEmail: policy.userEmail });
  }
  all[idx].uwRemarks = remarks;
  all[idx].uwDecidedBy = user.fullName || user.name;
  all[idx].uwDecidedOn = new Date().toISOString();
  localStorage.setItem('ti_policies', JSON.stringify(all));

  showToast('Decision submitted successfully!', 'success');
  _reviewingPolicyNo = null;
  setTimeout(() => navigate('queue'), 700);
}

function renderForwarded() {
  const fwd = getStoredPolicies().filter(p => p.status === 'Forwarded to Field');
  return `
  <div class="page-header">
    <h1 class="page-title">Forwarded to Field</h1>
    <p class="page-sub">${fwd.length} case${fwd.length !== 1 ? 's' : ''} pending field investigation</p>
  </div>
  ${fwd.length === 0
    ? `<div class="card card-body" style="text-align:center;padding:40px;color:var(--gray-400)">No cases currently forwarded to field.</div>`
    : fwd.map(p => {
      const { level, color } = getRiskInfo(p.riskScore || 0);
      return `
      <div class="card card-body" style="margin-bottom:14px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
              <span style="font-size:14px;font-weight:700;color:var(--navy)">${p.policyNo}</span>
              <span class="badge" style="background:${color}22;color:${color}">${level}</span>
            </div>
            <div style="font-size:13px;color:var(--gray-800);margin-bottom:4px">Customer: <strong>${p.userName}</strong> · ${p.planName}</div>
            <div style="font-size:12px;color:var(--gray-500)">Destination: ${p.dest} · ${p.days} days</div>
            ${p.uwRemarks ? `<div style="font-size:12px;color:var(--gray-400);margin-top:4px">UW Remarks: ${p.uwRemarks}</div>` : ''}
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <button class="btn btn-outline btn-sm" onclick="reviewPolicy('${p.policyNo}');navigate('review')">Review</button>
          </div>
        </div>
      </div>`;}).join('')}`;
}

function renderCompleted() {
  const completed = getStoredPolicies().filter(p => p.uwDecision && p.uwDecision !== 'Forwarded to Field');
  return `
  <div class="page-header">
    <h1 class="page-title">Completed Cases</h1>
    <p class="page-sub">${completed.length} decision${completed.length !== 1 ? 's' : ''} made</p>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Policy No</th><th>Customer</th><th>Plan</th><th>Decision</th><th>Risk Score</th><th>Decided By</th><th>Date</th></tr></thead>
        <tbody>
          ${completed.length === 0
            ? '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-400)">No completed cases yet.</td></tr>'
            : completed.map(p => {
              const dColors = { 'Approved': 'badge-green', 'Approved (Conditional)': 'badge-yellow', 'Rejected': 'badge-red' };
              return `
              <tr>
                <td style="font-weight:600;color:var(--navy)">${p.policyNo}</td>
                <td>${p.userName}</td>
                <td style="font-size:12px">${p.planName}</td>
                <td><span class="badge ${dColors[p.uwDecision] || 'badge-gray'}">${p.uwDecision}</span></td>
                <td><span style="font-weight:600">${p.riskScore || '—'}</span></td>
                <td style="font-size:12px;color:var(--gray-500)">${p.uwDecidedBy || user?.name}</td>
                <td style="font-size:12px;color:var(--gray-400)">${formatDate(p.uwDecidedOn)}</td>
              </tr>`;}).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderReports() {
  const all = getStoredPolicies();
  const uw  = all.filter(p => p.uwDecision);
  return `
  <div class="page-header">
    <h1 class="page-title">Underwriting Reports</h1>
    <p class="page-sub">Summary of underwriting activity and risk distribution.</p>
  </div>
  <div class="grid-4" style="margin-bottom:20px">
    ${[
      { val: String(all.length), label: 'Total Applications', color: 'var(--blue)', bg: 'var(--blue-pale)' },
      { val: String(uw.filter(p => p.uwDecision === 'Approved').length), label: 'Approved', color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' },
      { val: String(uw.filter(p => p.uwDecision === 'Rejected').length), label: 'Rejected', color: 'var(--red)', bg: 'rgba(239,68,68,0.1)' },
      { val: String(getMyQueue().length), label: 'Pending in Queue', color: 'var(--orange)', bg: 'rgba(249,115,22,0.1)' },
    ].map(s => `
      <div class="card stat-card">
        <div><div class="stat-value" style="color:${s.color}">${s.val}</div><div class="stat-label">${s.label}</div></div>
        <div class="stat-icon" style="background:${s.bg}">${Icons.file}</div>
      </div>`).join('')}
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Risk Distribution of All Policies</span></div>
    <div style="padding:20px;display:flex;gap:12px;flex-wrap:wrap">
      ${['Low','Medium','High','Very High'].map(level => {
        const cnt = all.filter(p => p.riskLevel === level).length;
        const colors = { Low: 'var(--green)', Medium: 'var(--yellow)', High: 'var(--orange)', 'Very High': 'var(--red)' };
        return `
        <div style="flex:1;min-width:120px;padding:16px;background:${colors[level]}11;border-radius:10px;border:1px solid ${colors[level]}33;text-align:center">
          <div style="font-size:24px;font-weight:800;color:${colors[level]}">${cnt}</div>
          <div style="font-size:12px;color:var(--gray-500);margin-top:4px">${level} Risk</div>
        </div>`;}).join('')}
    </div>
  </div>`;
}

function getRiskInfo(score) {
  if (score <= 30) return { level: 'Low',       color: 'var(--green)',  icon: '✅', action: 'Auto-approved.' };
  if (score <= 60) return { level: 'Medium',    color: 'var(--yellow)', icon: '⚠️', action: 'Claims review.' };
  if (score <= 80) return { level: 'High',      color: 'var(--orange)', icon: '🔶', action: 'UW review required.' };
  return           { level: 'Very High', color: 'var(--red)',    icon: '🔴', action: 'Field investigation may be needed.' };
}

// =====================================================================
// Admin sections (moved from removed admin portal to underwriter)
// =====================================================================

function renderProducts() {
  const overrides = JSON.parse(localStorage.getItem('ti_plan_overrides') || '{}');
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">Product & Plan Management</h1><p class="page-sub">Review and configure insurance plans, daily rates, and add-on catalog.</p></div>
  </div>
  <div style="margin-bottom:20px">
    <div class="card-header" style="padding:16px 20px 0"><span class="card-title" style="font-size:13px">PLANS</span></div>
    <div class="grid-3" style="gap:16px;padding:16px 0">
      ${Object.values(SHARED_PLANS).map(plan => {
        const ov = overrides[plan.id] || {};
        const rate = ov.dailyRate || plan.dailyRate;
        const active = ov.active !== undefined ? ov.active : true;
        return `
        <div class="card card-body" style="border-top:3px solid ${plan.color}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--navy)">${plan.name}</div>
              ${plan.tag ? `<span class="badge" style="background:${plan.color}22;color:${plan.color}">${plan.tag}</span>` : ''}
            </div>
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
              <input type="checkbox" ${active ? 'checked' : ''} onchange="togglePlanActive('${plan.id}',this.checked)"> Active
            </label>
          </div>
          ${[
            ['Daily Rate', `₹${rate}/day`],
            ['Commission', `${Math.round(plan.commissionRate * 100)}%`],
            ['Plan Code', plan.id.toUpperCase()],
          ].map(([k,v]) => `
            <div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid var(--gray-100)">
              <span style="color:var(--gray-500)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span>
            </div>`).join('')}
          <div style="margin-top:12px;display:flex;align-items:center;gap:8px">
            <label style="font-size:12px;color:var(--gray-500)">Daily Rate (₹):</label>
            <input type="number" id="rate-${plan.id}" value="${rate}" min="50" max="9999" class="form-input" style="width:90px;padding:4px 8px;font-size:12px">
            <button class="btn btn-primary btn-xs" onclick="savePlanRate('${plan.id}')">Save</button>
          </div>
        </div>`;}).join('')}
    </div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Add-on Catalog</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Add-on</th><th>Code</th><th>Price per Traveler</th></tr></thead>
        <tbody>
          ${SHARED_ADDONS.map(a => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${a.label}</td>
              <td style="font-size:12px;color:var(--gray-500);text-transform:uppercase">${a.id}</td>
              <td style="font-weight:600">₹${a.price}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function togglePlanActive(planId, active) {
  const overrides = JSON.parse(localStorage.getItem('ti_plan_overrides') || '{}');
  overrides[planId] = { ...(overrides[planId] || {}), active };
  localStorage.setItem('ti_plan_overrides', JSON.stringify(overrides));
  showToast(`${SHARED_PLANS[planId]?.name} ${active ? 'activated' : 'deactivated'}.`, active ? 'success' : 'warning');
}

function savePlanRate(planId) {
  const input = document.getElementById('rate-' + planId);
  const rate = parseInt(input?.value || 0);
  if (!rate || rate < 50) { showToast('Rate must be ≥ ₹50.', 'error'); return; }
  const overrides = JSON.parse(localStorage.getItem('ti_plan_overrides') || '{}');
  overrides[planId] = { ...(overrides[planId] || {}), dailyRate: rate };
  localStorage.setItem('ti_plan_overrides', JSON.stringify(overrides));
  showToast(`${SHARED_PLANS[planId]?.name} rate updated to ₹${rate}/day.`, 'success');
}

const SEED_RULES = [
  { code:'RULE_RISK_SENIOR_TRAVELER', name:'Senior Traveler Risk Uplift',     type:'RISK_SCORING',       priority:10, condition:'Any traveler age_group = senior',     action:'+25 risk score' },
  { code:'RULE_RISK_HIGH_DEST',       name:'High-Risk Destination Loading',   type:'RISK_SCORING',       priority:20, condition:'Destination zone IN USA/Canada, AUS/NZ, Worldwide', action:'+20 risk score' },
  { code:'RULE_RISK_LONG_TRIP',       name:'Long-Trip Duration Risk',         type:'RISK_SCORING',       priority:30, condition:'Trip >30 days OR 15–30 days',         action:'+15 / +7 risk score' },
  { code:'RULE_LOAD_ADVENTURE',       name:'Adventure Sports Premium Loading',type:'PREMIUM_LOADING',    priority:40, condition:'Adventure sports add-on selected',     action:'+10 risk score' },
  { code:'RULE_RISK_MEDICAL_TOURISM', name:'Medical Tourism Risk Uplift',     type:'RISK_SCORING',       priority:50, condition:'Trip purpose = Medical Tourism',       action:'+15 risk score' },
  { code:'RULE_AUTO_APPROVE_LOW_CLAIM',name:'Auto-Approve Low-Risk Claims',  type:'CLAIMS_AUTO_DECISION',priority:60, condition:'Claim ≤ ₹5,000 AND type FLIGHT_DELAY or BAGGAGE_LOSS', action:'SET STATUS = AUTO_APPROVED' },
  { code:'RULE_ELIG_VHR_GATE',        name:'Very High Risk Eligibility Gate', type:'ELIGIBILITY',        priority:70, condition:'Risk score ≥ 71',                     action:'FLAG = FIELD_FORWARD_RECOMMENDED (stop)' },
];

function renderRules() {
  const ruleOverrides = JSON.parse(localStorage.getItem('ti_rule_overrides') || '{}');
  const TYPE_COLORS = { RISK_SCORING:'var(--blue)', PREMIUM_LOADING:'var(--orange)', CLAIMS_AUTO_DECISION:'var(--green)', ELIGIBILITY:'var(--red)' };
  return `
  <div class="page-header"><h1 class="page-title">Rule Engine</h1><p class="page-sub">Risk scoring, premium loading, eligibility, and claims auto-decision rules.</p></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Priority</th><th>Rule Name</th><th>Type</th><th>Condition</th><th>Action</th><th>Status</th></tr></thead>
        <tbody>
          ${SEED_RULES.map(r => {
            const active = ruleOverrides[r.code]?.active !== false;
            const tc = TYPE_COLORS[r.type] || 'var(--navy)';
            return `
            <tr style="opacity:${active ? 1 : 0.5}">
              <td style="font-weight:700;color:var(--navy);text-align:center">${r.priority}</td>
              <td><div style="font-weight:600;color:var(--navy);font-size:13px">${r.name}</div><div style="font-size:11px;color:var(--gray-400)">${r.code}</div></td>
              <td><span class="badge" style="background:${tc}22;color:${tc};font-size:11px">${r.type}</span></td>
              <td style="font-size:12px;color:var(--gray-600);max-width:200px">${r.condition}</td>
              <td style="font-size:12px;font-weight:600;color:var(--navy)">${r.action}</td>
              <td>
                <label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer">
                  <input type="checkbox" ${active ? 'checked' : ''} onchange="toggleRule('${r.code}',this.checked)">
                  ${active ? 'Active' : 'Disabled'}
                </label>
              </td>
            </tr>`;}).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function toggleRule(code, active) {
  const overrides = JSON.parse(localStorage.getItem('ti_rule_overrides') || '{}');
  overrides[code] = { ...(overrides[code] || {}), active };
  localStorage.setItem('ti_rule_overrides', JSON.stringify(overrides));
  showToast(`Rule ${active ? 'enabled' : 'disabled'}.`, active ? 'success' : 'warning');
  navigate('rules');
}

const SEED_CONFIG = [
  { key:'pricing.gst_rate',                group:'PRICING',       label:'GST Rate',                     value:'0.18', note:'18%' },
  { key:'pricing.online_discount_rate',    group:'PRICING',       label:'Online Discount Rate',         value:'0.05', note:'5%' },
  { key:'pricing.traveler_mult_2to4_step', group:'PRICING',       label:'Traveler Multiplier (2–4)',    value:'0.60', note:'per additional traveler' },
  { key:'pricing.traveler_mult_5plus_step',group:'PRICING',       label:'Traveler Multiplier (5+)',     value:'0.40', note:'per additional traveler' },
  { key:'commission.rate_basic',           group:'PRICING',       label:'Commission — Basic',           value:'0.10', note:'10%' },
  { key:'commission.rate_plus',            group:'PRICING',       label:'Commission — Plus',            value:'0.12', note:'12%' },
  { key:'commission.rate_pro',             group:'PRICING',       label:'Commission — Pro',             value:'0.15', note:'15%' },
  { key:'risk_routing.auto_issue_max_score',group:'RISK_ROUTING', label:'Auto-Issue Max Score',         value:'30',   note:'≤30 → Active immediately' },
  { key:'risk_routing.co_review_max_score', group:'RISK_ROUTING', label:'Claims Review Max Score',      value:'50',   note:'31–50 → Claims Officer review' },
  { key:'sla.uw_review_hours',             group:'SLA',           label:'UW Review SLA (hours)',        value:'48',   note:'2 business days' },
  { key:'sla.claims_default_hours',        group:'SLA',           label:'Claims Default SLA (hours)',   value:'48',   note:'2 business days' },
  { key:'claims.high_value_threshold',     group:'CLAIMS',        label:'High-Value Claim Threshold',   value:'100000', note:'₹1 Lakh' },
  { key:'claims.auto_approve_max_amount',  group:'CLAIMS',        label:'Auto-Approve Max Amount',      value:'5000', note:'₹5,000 — Flight Delay & Baggage only' },
  { key:'security.max_login_attempts',     group:'SECURITY',      label:'Max Login Attempts',           value:'5',    note:'before lockout' },
  { key:'security.session_ttl_minutes',    group:'SECURITY',      label:'Session TTL (minutes)',        value:'480',  note:'8 hours' },
  { key:'security.password_min_length',    group:'SECURITY',      label:'Min Password Length',          value:'8',    note:'' },
];

function renderConfig() {
  const cfgOverrides = JSON.parse(localStorage.getItem('ti_config_overrides') || '{}');
  const groups = [...new Set(SEED_CONFIG.map(c => c.group))];
  return `
  <div class="page-header"><h1 class="page-title">Platform Configuration</h1><p class="page-sub">GST rates, risk routing thresholds, SLA targets, and security settings.</p></div>
  ${groups.map(grp => {
    const items = SEED_CONFIG.filter(c => c.group === grp);
    return `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><span class="card-title">${grp.replace(/_/g,' ')}</span></div>
      <div style="padding:0 20px 12px">
        ${items.map(c => {
          const val = cfgOverrides[c.key] !== undefined ? cfgOverrides[c.key] : c.value;
          return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--gray-100)">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${c.label}</div>
              ${c.note ? `<div style="font-size:11px;color:var(--gray-400)">${c.note}</div>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <input type="text" id="cfg-${c.key.replace(/\./g,'-')}" value="${val}" class="form-input" style="width:90px;padding:4px 8px;font-size:12px;text-align:right">
              <button class="btn btn-primary btn-xs" onclick="saveConfig('${c.key}')">Save</button>
            </div>
          </div>`;}).join('')}
      </div>
    </div>`;}).join('')}`;
}

function saveConfig(key) {
  const id = 'cfg-' + key.replace(/\./g, '-');
  const val = document.getElementById(id)?.value?.trim();
  if (!val) { showToast('Value cannot be empty.', 'error'); return; }
  const overrides = JSON.parse(localStorage.getItem('ti_config_overrides') || '{}');
  overrides[key] = val;
  localStorage.setItem('ti_config_overrides', JSON.stringify(overrides));
  showToast('Configuration saved.', 'success');
}

function renderUsers() {
  const policies = getStoredPolicies();
  const registered = JSON.parse(localStorage.getItem('ti_registered_users') || '[]');
  const customerEmails = [...new Set([
    ...policies.map(p => p.userEmail).filter(Boolean),
    ...registered.map(u => u.email).filter(Boolean),
  ])];
  const staffDemoAccounts = [
    { email:'john.smith.underwriter@policypilot.com', role:'ROLE_UNDERWRITER',          name:'John Smith' },
    { email:'priya.k.claims@policypilot.com',         role:'ROLE_CLAIMS_OFFICER',       name:'Priya K.' },
    { email:'amit.r.agent@policypilot.com',           role:'ROLE_AGENT',                name:'Amit R.' },
    { email:'sarah.j.field@policypilot.com',          role:'ROLE_FIELD_OFFICER',        name:'Sarah J.' },
    { email:'david.m.finance@policypilot.com',        role:'ROLE_FINANCE',              name:'David M.' },
    { email:'anita.v.rm@policypilot.com',             role:'ROLE_RELATIONSHIP_MANAGER', name:'Anita V.' },
  ];
  return `
  <div class="page-header"><h1 class="page-title">User Management</h1><p class="page-sub">Customer accounts and staff accounts registered on the platform.</p></div>
  <div class="grid-2" style="gap:20px">
    <div class="card">
      <div class="card-header"><span class="card-title">Customers (${customerEmails.length})</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Policies</th></tr></thead>
          <tbody>
            ${customerEmails.length === 0
              ? '<tr><td colspan="2" style="text-align:center;padding:20px;color:var(--gray-400)">No customers yet</td></tr>'
              : customerEmails.map(email => {
                  const reg = registered.find(u => u.email === email);
                  const name = reg?.fullName || email.split('@')[0].replace(/\./g,' ').replace(/\b\w/g,c=>c.toUpperCase());
                  const count = policies.filter(p => p.userEmail === email).length;
                  return `
                  <tr>
                    <td><div style="font-weight:600;color:var(--navy);font-size:13px">${name}</div><div style="font-size:11px;color:var(--gray-400)">${email}</div></td>
                    <td style="text-align:center;font-weight:600">${count}</td>
                  </tr>`;}).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Staff Accounts (${staffDemoAccounts.length})</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Role</th></tr></thead>
          <tbody>
            ${staffDemoAccounts.map(s => `
              <tr>
                <td><div style="font-weight:600;color:var(--navy);font-size:13px">${s.name}</div><div style="font-size:11px;color:var(--gray-400)">${s.email}</div></td>
                <td><span class="badge badge-blue" style="font-size:11px">${ROLE_LABELS[s.role] || s.role}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="alert alert-info" style="margin-top:16px;font-size:12px">
    In Phase C (backend), user creation and RBAC management will be handled via the auth-service API. Staff login is domain-based: <strong>firstname.lastname.&lt;role-slug&gt;@policypilot.com</strong>
  </div>`;
}

function renderAuditLog() {
  const policies = getStoredPolicies();
  const claims   = getStoredClaims();
  const stored   = JSON.parse(localStorage.getItem('ti_audit_log') || '[]');

  // Auto-generate audit entries from policy & claim state
  const policyEntries = policies.map(p => [
    { time: p.purchasedOn, actor: p.userName, role:'ROLE_CUSTOMER', action:`POLICY_CREATED`, entity:`Policy ${p.policyNo}`, result:'SUCCESS' },
    p.uwDecidedOn ? { time: p.uwDecidedOn, actor: p.uwDecidedBy || 'Underwriter', role:'ROLE_UNDERWRITER', action:`UW_DECISION_${(p.uwDecision||'').toUpperCase().replace(/\s+/g,'_')}`, entity:`Policy ${p.policyNo}`, result:'SUCCESS' } : null,
  ]).flat().filter(Boolean);

  const claimEntries = claims.map(c => [
    { time: c.submittedOn || c.filed, actor: c.userName, role:'ROLE_CUSTOMER', action:`CLAIM_SUBMITTED`, entity:`Claim ${c.claimNo}`, result:'SUCCESS' },
    c.decidedOn ? { time: c.decidedOn, actor: c.decidedBy || 'Claims Officer', role:'ROLE_CLAIMS_OFFICER', action:`CLAIM_${(c.status||'').toUpperCase().replace(/\s+/g,'_')}`, entity:`Claim ${c.claimNo}`, result:'SUCCESS' } : null,
  ]).flat().filter(Boolean);

  const allEntries = [...stored, ...policyEntries, ...claimEntries]
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
    .slice(0, 100);

  const roleColors = { 'ROLE_CUSTOMER':'var(--blue)', 'ROLE_UNDERWRITER':'var(--orange)', 'ROLE_CLAIMS_OFFICER':'var(--yellow)', 'ROLE_AGENT':'var(--accent)', 'ROLE_FIELD_OFFICER':'var(--green)' };

  return `
  <div class="page-header"><h1 class="page-title">Audit Log</h1><p class="page-sub">${allEntries.length} events recorded — policy creations, UW decisions, claim actions.</p></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Time</th><th>Actor</th><th>Role</th><th>Action</th><th>Entity</th><th>Result</th></tr></thead>
        <tbody>
          ${allEntries.length === 0
            ? '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">No audit events recorded yet. Actions taken in the platform will appear here.</td></tr>'
            : allEntries.map(e => {
                const rc = roleColors[e.role] || 'var(--gray-500)';
                return `
                <tr>
                  <td style="font-size:11px;color:var(--gray-400);white-space:nowrap">${e.time ? new Date(e.time).toLocaleString('en-IN', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                  <td style="font-size:12px;font-weight:600;color:var(--navy)">${e.actor || '—'}</td>
                  <td><span class="badge" style="background:${rc}22;color:${rc};font-size:10px">${(ROLE_LABELS[e.role] || e.role || '—').replace('ROLE_','')}</span></td>
                  <td style="font-size:12px;color:var(--gray-600);font-family:monospace">${e.action || '—'}</td>
                  <td style="font-size:12px;color:var(--navy)">${e.entity || '—'}</td>
                  <td><span class="badge ${e.result === 'SUCCESS' ? 'badge-green' : 'badge-red'}" style="font-size:10px">${e.result || '—'}</span></td>
                </tr>`;}).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}
