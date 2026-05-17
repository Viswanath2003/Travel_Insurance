/* ================================================================
   FIELD OFFICER PORTAL – Navigation + Page Renders
================================================================ */
function navigate(section) {
  document.querySelectorAll('#sidebar .sidebar-item').forEach(b => b.classList.toggle('active', b.dataset.section === section));
  const main = document.getElementById('app-main');
  const renders = { dashboard:renderDashboard, assignments:renderAssignments, 'submit-report':renderSubmitReport, completed:renderCompleted, profile:renderProfile };
  main.innerHTML = (renders[section] || renderDashboard)();
  main.scrollTop = 0;
}

function renderDashboard() {
  const user = getSession();
  return `
  <div class="page-header"><h1 class="page-title">Field Officer Dashboard</h1><p class="page-sub">Welcome, ${((user?.fullName||user?.name)||'Officer').split(' ')[0]}!</p></div>
  <div class="grid-3" style="margin-bottom:20px">
    ${[
      {val:'3',label:'Active Assignments',color:'var(--blue)',bg:'var(--blue-pale)'},
      {val:'1',label:'Reports Pending',color:'var(--orange)',bg:'rgba(249,115,22,0.1)'},
      {val:'12',label:'Completed (Month)',color:'var(--green)',bg:'rgba(34,197,94,0.1)'},
    ].map(s => `
      <div class="card stat-card">
        <div><div class="stat-value" style="color:${s.color}">${s.val}</div><div class="stat-label">${s.label}</div></div>
        <div class="stat-icon" style="background:${s.bg}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg></div>
      </div>
    `).join('')}
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">My Active Assignments</span><a href="#" onclick="navigate('assignments');return false" style="font-size:12px;color:var(--blue);text-decoration:none">View all →</a></div>
    <div style="display:flex;flex-direction:column;gap:12px;padding:16px 20px">
      ${[
        {id:'CLM125240520044',claimant:'Priya K.',type:'Baggage Loss',loc:'Mumbai, MH',by:'20 May 2025',priority:'High'},
        {id:'CLM125240520038',claimant:'Alice T.',type:'Medical Verify',loc:'Dubai, UAE',by:'22 May 2025',priority:'Medium'},
        {id:'CLM125240520036',claimant:'Kumar S.',type:'Property Damage',loc:'Chennai, TN',by:'25 May 2025',priority:'Low'},
      ].map(a => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-100)">
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:2px">${a.id} – ${a.claimant}</div>
            <div style="font-size:12px;color:var(--gray-500)">${a.type} • ${a.loc}</div>
            <div style="font-size:11px;color:var(--gray-400)">Due by: ${a.by}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="badge ${a.priority==='High'?'badge-red':a.priority==='Medium'?'badge-yellow':'badge-green'}">${a.priority}</span>
            <button class="btn btn-primary btn-sm" onclick="navigate('submit-report')">Submit Report</button>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function renderAssignments() {
  return `
  <div class="page-header"><h1 class="page-title">My Assignments</h1><p class="page-sub">3 active field investigations</p></div>
  <div style="display:flex;flex-direction:column;gap:14px">
    ${[
      {id:'CLM125240520044',claimant:'Priya K.',type:'Baggage Loss',loc:'Mumbai, MH',by:'20 May 2025',priority:'High',st:'In Progress'},
      {id:'CLM125240520038',claimant:'Alice T.',type:'Medical Verification',loc:'Dubai, UAE',by:'22 May 2025',priority:'Medium',st:'Pending Start'},
      {id:'CLM125240520036',claimant:'Kumar S.',type:'Property Damage',loc:'Chennai, TN',by:'25 May 2025',priority:'Low',st:'Pending Start'},
    ].map(a => `
      <div class="card card-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
              <span style="font-size:14px;font-weight:700;color:var(--navy)">${a.id}</span>
              <span class="badge ${a.priority==='High'?'badge-red':a.priority==='Medium'?'badge-yellow':'badge-green'}">${a.priority}</span>
            </div>
            <div style="font-size:13px;color:var(--gray-800);margin-bottom:4px">Claimant: <strong>${a.claimant}</strong> • Type: ${a.type}</div>
            <div style="font-size:12px;color:var(--gray-500)">Location: ${a.loc}</div>
            <div style="font-size:12px;color:var(--gray-400)">Due by: ${a.by}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="badge ${a.st==='In Progress'?'badge-blue':'badge-gray'}">${a.st}</span>
            <button class="btn btn-primary btn-sm" onclick="navigate('submit-report')">Submit Report</button>
          </div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function renderSubmitReport() {
  return `
  <div class="page-header">
    <button class="btn btn-ghost btn-sm" onclick="navigate('assignments')" style="color:var(--blue);padding-left:0;margin-bottom:8px">← Back to Assignments</button>
    <h1 class="page-title">Submit Field Report</h1><p class="page-sub">Claim: CLM125240520044 – Priya K. (Baggage Loss)</p>
  </div>
  <div class="card card-body" style="max-width:680px">
    <div class="form-group">
      <label class="form-label">Date of Inspection</label><input type="date" class="form-input" value="2025-05-20">
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Location Visited</label><input type="text" class="form-input" value="Mumbai International Airport, T2"></div>
      <div class="form-group"><label class="form-label">Claimant Present?</label>
        <select class="form-select"><option>Yes</option><option>No</option></select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Investigation Findings</label>
      <textarea class="form-input" rows="5" placeholder="Describe your findings in detail..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Recommendation</label>
      <select class="form-select">
        <option>Approve – Claim is valid and documents match</option>
        <option>Partial Approval – Partial loss verified</option>
        <option>Reject – Claim appears fraudulent or inaccurate</option>
        <option>Need Further Investigation</option>
      </select>
    </div>
    <div class="upload-area" onclick="showToast('Upload investigation photos/docs','info')" style="margin-bottom:20px">
      <div style="font-size:28px;margin-bottom:8px">📎</div>
      <div style="font-size:13px;color:var(--gray-600)">Upload investigation photos & supporting documents</div>
      <div style="font-size:11px;color:var(--gray-400)">JPG, PNG, PDF – Max 10MB each</div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-secondary" onclick="navigate('assignments')">Cancel</button>
      <button class="btn btn-primary btn-lg" onclick="showToast('Field report submitted successfully!','success');setTimeout(()=>navigate('completed'),800)">Submit Report</button>
    </div>
  </div>`;
}

function renderCompleted() {
  return `
  <div class="page-header"><h1 class="page-title">Completed Assignments</h1><p class="page-sub">12 investigations completed this month</p></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Claim ID</th><th>Claimant</th><th>Type</th><th>Location</th><th>Completed On</th><th>Recommendation</th></tr></thead>
        <tbody>
          ${[
            {id:'CLM125240520039',name:'Kumar S.',type:'Medical',loc:'Chennai, TN',date:'19 May 2025',rec:'Approve',recC:'badge-green'},
            {id:'CLM125240520033',name:'Nair P.',type:'Baggage',loc:'Kochi, KL',date:'17 May 2025',rec:'Partial Approve',recC:'badge-yellow'},
            {id:'CLM125240520029',name:'Singh R.',type:'Accident',loc:'Delhi, DL',date:'15 May 2025',rec:'Reject',recC:'badge-red'},
          ].map(r => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${r.id}</td>
              <td>${r.name}</td>
              <td style="font-size:12px">${r.type}</td>
              <td style="font-size:12px">${r.loc}</td>
              <td style="font-size:12px;color:var(--gray-400)">${r.date}</td>
              <td><span class="badge ${r.recC}">${r.rec}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderProfile() {
  const user = getSession();
  return `
  <div class="page-header"><h1 class="page-title">My Profile</h1></div>
  <div class="card card-body" style="max-width:560px">
    <div class="form-row">
      <div class="form-group"><label class="form-label">Full Name</label><input type="text" class="form-input" value="${user?.fullName||user?.name||'Field Officer'}"></div>
      <div class="form-group"><label class="form-label">Employee ID</label><input type="text" class="form-input" value="FO-0042" readonly></div>
    </div>
    <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" value="${user?.email||'officer@insure.local'}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Mobile</label><input type="text" class="form-input" value="+91 9876543210"></div>
      <div class="form-group"><label class="form-label">Zone</label><select class="form-select"><option>West – Mumbai</option><option>South – Chennai</option><option>North – Delhi</option></select></div>
    </div>
    <button class="btn btn-primary" onclick="showToast('Profile updated!','success')">Save Changes</button>
  </div>`;
}
