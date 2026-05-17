/* ================================================================
   CLAIMS OFFICER PORTAL – Navigation + Page Renders
================================================================ */
function navigate(section) {
  document.querySelectorAll('#sidebar .sidebar-item').forEach(b => b.classList.toggle('active', b.dataset.section === section));
  const main = document.getElementById('app-main');
  const renders = { dashboard:renderDashboard, queue:renderQueue, review:renderReview, field:renderField, settled:renderSettled, reports:renderReports, audit:renderAudit };
  main.innerHTML = (renders[section] || renderDashboard)();
  main.scrollTop = 0;
}

let _reviewingClaimNo = null;

function renderDashboard() {
  const claims = getStoredClaims();
  const submitted  = claims.filter(c => c.status === 'Submitted').length;
  const underReview = claims.filter(c => c.status === 'Under Review').length;
  const approved   = claims.filter(c => c.status === 'Approved').length;
  const settled    = claims.filter(c => c.status === 'Settled').length;

  const claimStatusBadge = st => {
    const map = { 'Submitted':'badge-blue','Under Review':'badge-yellow','Approved':'badge-green','Rejected':'badge-red','Settled':'badge-green','Field Investigation':'badge-orange' };
    return map[st] || 'badge-blue';
  };

  const recent = [...claims].sort((a,b) => new Date(b.submittedOn||b.filed||0) - new Date(a.submittedOn||a.filed||0)).slice(0,5);

  const stats = [
    {val:submitted,   label:'Submitted',      color:'var(--blue)',  bg:'var(--blue-pale)'},
    {val:underReview, label:'Under Review',   color:'var(--yellow)',bg:'rgba(234,179,8,0.1)'},
    {val:approved,    label:'Approved',       color:'var(--green)', bg:'rgba(34,197,94,0.1)'},
    {val:settled,     label:'Settled',        color:'var(--navy)',  bg:'rgba(15,27,60,0.06)'},
  ];

  return `
  <div class="page-header"><h1 class="page-title">Claims Dashboard</h1><p class="page-sub">Your claims processing overview</p></div>
  <div class="grid-4" style="margin-bottom:20px">
    ${stats.map(s => `
      <div class="card stat-card">
        <div><div class="stat-value" style="color:${s.color}">${s.val}</div><div class="stat-label">${s.label}</div></div>
        <div class="stat-icon" style="background:${s.bg}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
      </div>
    `).join('')}
  </div>
  <div class="grid-2" style="gap:20px">
    <div class="card">
      <div class="card-header"><span class="card-title">Recent Claims</span><a href="#" onclick="navigate('queue');return false" style="font-size:12px;color:var(--blue);text-decoration:none">View all →</a></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Claim ID</th><th>Claimant</th><th>Type</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${recent.length ? recent.map(r => `
              <tr>
                <td><a href="#" class="link" onclick="reviewClaim('${r.claimNo}');return false" style="font-weight:600;color:var(--navy)">${r.claimNo}</a></td>
                <td>${r.userName||r.userEmail||'—'}</td>
                <td style="font-size:12px">${r.type||'—'}</td>
                <td style="font-weight:600">₹${Number(r.amount||0).toLocaleString('en-IN')}</td>
                <td><span class="badge ${claimStatusBadge(r.status)}">${r.status}</span></td>
                <td><button class="btn btn-primary btn-xs" onclick="reviewClaim('${r.claimNo}')">Review</button></td>
              </tr>
            `).join('') : `<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:20px">No claims found</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">SLA Status</h3>
      ${[['Within SLA','72%','var(--green)'],['At Risk','18%','var(--yellow)'],['Breached','10%','var(--red)']].map(([l,p,c]) => `
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span>${l}</span><span style="font-weight:600;color:var(--navy)">${p}</span></div>
          <div style="height:8px;background:var(--gray-100);border-radius:4px"><div style="height:100%;width:${p};background:${c};border-radius:4px"></div></div>
        </div>
      `).join('')}
      <div class="alert alert-info mt-3" style="font-size:12px">Avg processing time: <strong>3h 42m</strong> (target: 8h)</div>
    </div>
  </div>`;
}

function reviewClaim(claimNo) {
  _reviewingClaimNo = claimNo;
  navigate('review');
}

function renderQueue() {
  const claims = getStoredClaims();
  const sorted  = [...claims].sort((a,b) => new Date(b.submittedOn||b.filed||0) - new Date(a.submittedOn||a.filed||0));
  const claimStatusBadge = st => {
    const map = { 'Submitted':'badge-blue','Under Review':'badge-yellow','Approved':'badge-green','Rejected':'badge-red','Settled':'badge-green','Field Investigation':'badge-orange' };
    return map[st] || 'badge-blue';
  };
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">Claims Queue</h1><p class="page-sub">${sorted.length} claim${sorted.length!==1?'s':''} on file</p></div>
    <div style="display:flex;gap:10px">
      <select class="form-select" style="max-width:150px"><option>All Types</option><option>Medical</option><option>Baggage</option><option>Trip Cancel</option></select>
      <input type="text" class="form-input" style="max-width:200px" placeholder="Search claim ID...">
    </div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Claim ID</th><th>Claimant</th><th>Type</th><th>Amount</th><th>Filed On</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${sorted.length ? sorted.map(r => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${r.claimNo}</td>
              <td>${r.userName||r.userEmail||'—'}</td>
              <td style="font-size:12px">${r.type||'—'}</td>
              <td style="font-weight:600">₹${Number(r.amount||0).toLocaleString('en-IN')}</td>
              <td style="font-size:12px;color:var(--gray-400)">${r.submittedOn ? formatDate(r.submittedOn) : (r.filed ? formatDate(r.filed) : '—')}</td>
              <td><span class="badge ${claimStatusBadge(r.status)}">${r.status}</span></td>
              <td>
                <button class="btn btn-primary btn-xs" onclick="reviewClaim('${r.claimNo}')">Review</button>
                <button class="btn btn-secondary btn-xs" onclick="navigate('field')">Field Assign</button>
              </td>
            </tr>
          `).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--gray-400);padding:24px">No claims found in localStorage</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderReview() {
  const claimNo = _reviewingClaimNo;
  if (!claimNo) {
    const q = getStoredClaims().filter(c => c.status !== 'Approved' && c.status !== 'Rejected' && c.status !== 'Settled');
    if (q.length > 0) { _reviewingClaimNo = q[0].claimNo; return renderReview(); }
    return `<div class="page-header"><h1 class="page-title">Review</h1></div><div class="card card-body" style="text-align:center;padding:40px;color:var(--gray-400)">No claim selected. <a href="#" onclick="navigate('queue');return false" class="link">Go to Queue →</a></div>`;
  }
  const claim = getStoredClaims().find(c => c.claimNo === claimNo);
  if (!claim) return `<div style="padding:40px;text-align:center;color:var(--gray-400)">Claim not found.</div>`;

  return `
  <div class="page-header">
    <button class="btn btn-ghost btn-sm" onclick="navigate('queue')" style="color:var(--blue);padding-left:0;margin-bottom:8px">← Back to Queue</button>
    <h1 class="page-title">Claim Review – ${claim.claimNo}</h1>
    <p class="page-sub">${claim.userName||claim.userEmail||'Claimant'} • ${claim.type||'Claim'} • ₹${Number(claim.amount||0).toLocaleString('en-IN')}</p>
  </div>
  <div class="grid-2" style="gap:20px">
    <div>
      <div class="card card-body" style="margin-bottom:16px">
        <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">Claim Details</h3>
        ${[
          ['Claim ID',claim.claimNo],
          ['Policy',claim.policyNo||'—'],
          ['Claimant',claim.userName||claim.userEmail||'—'],
          ['Claim Type',claim.type||'—'],
          ['Date of Incident',claim.incidentDate ? formatDate(claim.incidentDate) : '—'],
          ['Amount Claimed','₹'+Number(claim.amount||0).toLocaleString('en-IN')],
          ['Filed On',claim.submittedOn ? formatDate(claim.submittedOn) : (claim.filed ? formatDate(claim.filed) : '—')]
        ].map(([k,v]) => `
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--gray-100)">
            <span style="color:var(--gray-400)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span>
          </div>
        `).join('')}
      </div>
      <div class="card card-body">
        <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:12px">Uploaded Documents</h3>
        ${['Hospital_Bill.pdf','Prescription.jpg','Payment_Receipt.pdf','ID_Proof.jpg'].map(f => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--gray-50);border-radius:6px;margin-bottom:6px;font-size:12px">
            <div style="display:flex;align-items:center;gap:8px"><span>${f.endsWith('.pdf')?'📄':'🖼'}</span> ${f}</div>
            <button class="btn btn-ghost btn-xs" onclick="showToast('Viewing ${f}...','info')">View</button>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:12px">Decision</h3>
      ${[
        {id:'Approve Claim',label:'Approve Claim',desc:'Documents verified, claim is valid',color:'var(--green)'},
        {id:'Partially Approve',label:'Partially Approve',desc:'Approve a portion of the claimed amount',color:'var(--yellow)'},
        {id:'Reject Claim',label:'Reject Claim',desc:'Claim does not meet policy terms',color:'var(--red)'},
        {id:'Assign Field Investigation',label:'Assign Field Investigation',desc:'Send a field officer for verification',color:'var(--blue)'},
      ].map((d, i) => `
        <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1.5px solid var(--gray-200);border-radius:8px;cursor:pointer;background:white;margin-bottom:8px" id="dec-lbl-${i}" onclick="document.querySelectorAll('[id^=dec-lbl]').forEach(l=>l.style.borderColor='var(--gray-200)');this.style.borderColor='${d.color}'">
          <input type="radio" name="claim-decision" value="${d.id}" style="margin-top:2px;accent-color:${d.color}">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--navy)">${d.label}</div>
            <div style="font-size:11px;color:var(--gray-500)">${d.desc}</div>
          </div>
        </label>
      `).join('')}
      <div class="form-group mt-3">
        <label class="form-label">Settlement Amount (if approving)</label>
        <input type="number" id="claim-settlement-amt" class="form-input" placeholder="Enter approved amount" value="${claim.amount||''}">
      </div>
      <div class="form-group">
        <label class="form-label">Remarks</label>
        <textarea id="claim-remarks" class="form-input" rows="3" placeholder="Enter remarks for your decision..."></textarea>
      </div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-secondary" onclick="navigate('queue')">Cancel</button>
        <button class="btn btn-primary" style="flex:1" onclick="submitClaimDecision('${claim.claimNo}')">Submit Decision</button>
      </div>
    </div>
  </div>`;
}

function submitClaimDecision(claimNo) {
  const dec = document.querySelector('input[name="claim-decision"]:checked')?.value;
  if (!dec) { showToast('Please select a decision.', 'warning'); return; }
  const remarks = document.getElementById('claim-remarks')?.value.trim();
  const amt = document.getElementById('claim-settlement-amt')?.value;
  
  const all = getStoredClaims();
  const idx = all.findIndex(c => c.claimNo === claimNo);
  if (idx > -1) {
    if (dec === 'Approve Claim') all[idx].status = 'Approved';
    else if (dec === 'Partially Approve') all[idx].status = 'Approved';
    else if (dec === 'Reject Claim') all[idx].status = 'Rejected';
    else if (dec === 'Assign Field Investigation') all[idx].status = 'Field Investigation';
    
    all[idx].remarks = remarks;
    if (dec === 'Approve Claim' || dec === 'Partially Approve') {
        all[idx].settledAmount = amt;
    }
    localStorage.setItem('ti_claims', JSON.stringify(all));
    showToast('Claim decision submitted!', 'success');
  }
  _reviewingClaimNo = null;
  setTimeout(() => navigate('queue'), 800);
}

function renderField() {
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">Field Assignments</h1><p class="page-sub">5 active field investigations</p></div>
    <button class="btn btn-primary" onclick="showToast('Assign new field officer','info')">+ New Assignment</button>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Claim ID</th><th>Claimant</th><th>Field Officer</th><th>Location</th><th>Assigned On</th><th>Status</th></tr></thead>
        <tbody>
          ${[
            {id:'CLM125240520044',claimant:'Priya K.',officer:'Ramesh G.',loc:'Mumbai, MH',date:'19 May 2025',st:'In Progress',stC:'badge-blue'},
            {id:'CLM125240520039',claimant:'Kumar S.',officer:'Divya R.',loc:'Chennai, TN',date:'18 May 2025',st:'Report Submitted',stC:'badge-green'},
            {id:'CLM125240520038',claimant:'Alice T.',officer:'Mohammed K.',loc:'Dubai, UAE',date:'17 May 2025',st:'In Progress',stC:'badge-blue'},
          ].map(r => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${r.id}</td>
              <td>${r.claimant}</td>
              <td>${r.officer}</td>
              <td style="font-size:12px">${r.loc}</td>
              <td style="font-size:12px;color:var(--gray-400)">${r.date}</td>
              <td><span class="badge ${r.stC}">${r.st}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderSettled() {
  return `
  <div class="page-header"><h1 class="page-title">Settled Claims</h1></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Claim ID</th><th>Claimant</th><th>Claimed</th><th>Settled</th><th>Decision</th><th>Date</th></tr></thead>
        <tbody>
          ${[
            {id:'CLM125240520042',name:'Sara W.',claimed:'₹1,200',settled:'₹1,200',dec:'Approved',decC:'badge-green',date:'20 May 2025'},
            {id:'CLM125240520037',name:'Nair M.',claimed:'₹25,000',settled:'₹18,000',dec:'Partially Approved',decC:'badge-yellow',date:'19 May 2025'},
            {id:'CLM125240520035',name:'Singh A.',claimed:'₹800',settled:'₹0',dec:'Rejected',decC:'badge-red',date:'18 May 2025'},
          ].map(r => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${r.id}</td>
              <td>${r.name}</td>
              <td>${r.claimed}</td>
              <td style="font-weight:700;color:var(--navy)">${r.settled}</td>
              <td><span class="badge ${r.decC}">${r.dec}</span></td>
              <td style="font-size:12px;color:var(--gray-400)">${r.date}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderReports() {
  return `
  <div class="page-header"><h1 class="page-title">Claims Reports</h1></div>
  <div class="grid-3" style="margin-bottom:20px">
    ${[{val:'28',label:'Claims Settled Today'},{val:'₹48,200',label:'Total Payout (MTD)'},{val:'82%',label:'Approval Rate (MTD)'}].map(s => `
      <div class="card stat-card"><div><div class="stat-value" style="color:var(--navy);font-size:${s.val.length>6?'18px':'26px'}">${s.val}</div><div class="stat-label">${s.label}</div></div></div>
    `).join('')}
  </div>
  <div class="grid-2" style="gap:16px">
    ${[
      {title:'Claims Summary Report',desc:'Total claims, decisions, and payouts by type',icon:'📋'},
      {title:'SLA Compliance Report',desc:'On-time decisions vs SLA breaches',icon:'⏱'},
      {title:'Field Investigation Report',desc:'Field officer performance and turnaround',icon:'🗺'},
      {title:'Fraud Risk Report',desc:'Flagged claims and suspicion indicators',icon:'🔍'},
    ].map(r => `
      <div class="card card-body" style="cursor:pointer" onclick="showToast('Generating ${r.title}...','info')">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="font-size:32px">${r.icon}</div>
          <div><div style="font-size:14px;font-weight:700;color:var(--navy)">${r.title}</div><div style="font-size:12px;color:var(--gray-500);margin-top:2px">${r.desc}</div></div>
        </div>
        <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="event.stopPropagation();showToast('Downloading...','info')">Download PDF</button>
      </div>
    `).join('')}
  </div>`;
}

function renderAudit() {
  return `
  <div class="page-header"><h1 class="page-title">Audit Trail</h1></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Timestamp</th><th>Claim</th><th>Action</th><th>Officer</th><th>Notes</th></tr></thead>
        <tbody>
          ${[
            {time:'20 May 11:00 AM',claim:'CLM125240520042',action:'Approved',officer:'Sarah Lee',notes:'All docs verified'},
            {time:'20 May 10:30 AM',claim:'CLM125240520044',action:'Field Assigned',officer:'Sarah Lee',notes:'Physical verification needed'},
            {time:'19 May 04:00 PM',claim:'CLM125240520037',action:'Partially Approved',officer:'John Doe',notes:'Deductible applied'},
          ].map(r => `
            <tr>
              <td style="font-size:12px;color:var(--gray-500)">${r.time}</td>
              <td style="font-weight:600;color:var(--navy)">${r.claim}</td>
              <td><span class="badge ${r.action.includes('Approved')?'badge-green':r.action.includes('Field')?'badge-blue':'badge-red'}">${r.action}</span></td>
              <td style="font-size:12px">${r.officer}</td>
              <td style="font-size:12px;color:var(--gray-500)">${r.notes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}
