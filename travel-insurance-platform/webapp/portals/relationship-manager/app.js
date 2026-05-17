/* ================================================================
   RELATIONSHIP MANAGER PORTAL – Navigation + Page Renders
================================================================ */
function navigate(section) {
  document.querySelectorAll('#sidebar .sidebar-item').forEach(b => b.classList.toggle('active', b.dataset.section === section));
  const main = document.getElementById('app-main');
  const renders = { dashboard:renderDashboard, clients:renderClients, policies:renderPolicies, claims:renderClaims, renewals:renderRenewals, performance:renderPerformance, reports:renderReports };
  main.innerHTML = (renders[section] || renderDashboard)();
  main.scrollTop = 0;
}

function renderDashboard() {
  const user = getSession();
  return `
  <div class="page-header"><h1 class="page-title">RM Dashboard</h1><p class="page-sub">Welcome back, ${((user?.fullName||user?.name)||'Manager').split(' ')[0]}! Here's your portfolio at a glance.</p></div>
  <div class="grid-4" style="margin-bottom:20px">
    ${[
      {val:'48',label:'Total Clients',color:'var(--blue)',bg:'var(--blue-pale)'},
      {val:'124',label:'Active Policies',color:'var(--green)',bg:'rgba(34,197,94,0.1)'},
      {val:'12',label:'Renewals Due (30d)',color:'var(--orange)',bg:'rgba(249,115,22,0.1)'},
      {val:'7',label:'Open Claims',color:'var(--red)',bg:'rgba(239,68,68,0.1)'},
    ].map(s => `
      <div class="card stat-card">
        <div><div class="stat-value" style="color:${s.color}">${s.val}</div><div class="stat-label">${s.label}</div></div>
        <div class="stat-icon" style="background:${s.bg}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
      </div>
    `).join('')}
  </div>
  <div class="grid-2" style="gap:20px;margin-bottom:20px">
    <div class="card">
      <div class="card-header"><span class="card-title">Upcoming Renewals</span><a href="#" onclick="navigate('renewals');return false" style="font-size:12px;color:var(--blue);text-decoration:none">View all →</a></div>
      <div style="display:flex;flex-direction:column;gap:0">
        ${[
          {name:'John Doe',policy:'TRV123456',plan:'Explorer Plus',due:'25 May 2025',days:5},
          {name:'Anita Verma',policy:'TRV123459',plan:'Family Protect',due:'28 May 2025',days:8},
          {name:'Rajesh Kumar',policy:'TRV123461',plan:'Basic Shield',due:'02 Jun 2025',days:13},
        ].map(r => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--gray-100)">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${r.name}</div>
              <div style="font-size:11px;color:var(--gray-500)">${r.policy} • ${r.plan}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:12px;font-weight:600;color:${r.days<=7?'var(--red)':'var(--orange)'}">${r.days}d left</div>
              <div style="font-size:11px;color:var(--gray-400)">${r.due}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Active Client Claims</span><a href="#" onclick="navigate('claims');return false" style="font-size:12px;color:var(--blue);text-decoration:none">View all →</a></div>
      <div style="display:flex;flex-direction:column;gap:0">
        ${[
          {name:'Priya K.',claimId:'CLM125240520044',type:'Baggage Loss',st:'Under Investigation',stC:'badge-yellow'},
          {name:'Ravi S.',claimId:'CLM125240520041',type:'Medical',st:'Approved',stC:'badge-green'},
          {name:'Meera T.',claimId:'CLM125240520039',type:'Trip Cancel',st:'Pending Docs',stC:'badge-orange'},
        ].map(c => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--gray-100)">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${c.name} – ${c.type}</div>
              <div style="font-size:11px;color:var(--gray-500)">${c.claimId}</div>
            </div>
            <span class="badge ${c.stC}">${c.st}</span>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  <div class="card card-body">
    <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">Portfolio Health</h3>
    <div class="grid-4">
      ${[
        {label:'Policy Retention Rate',val:'94.2%',color:'var(--green)'},
        {label:'Avg. Premium per Client',val:'₹8,450',color:'var(--blue)'},
        {label:'Claim Ratio (Portfolio)',val:'18%',color:'var(--orange)'},
        {label:'NPS Score',val:'72',color:'var(--navy)'},
      ].map(m => `
        <div style="padding:14px;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-100);text-align:center">
          <div style="font-size:22px;font-weight:700;color:${m.color};margin-bottom:4px">${m.val}</div>
          <div style="font-size:12px;color:var(--gray-500)">${m.label}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function renderClients() {
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">My Clients</h1><p class="page-sub">48 clients in your portfolio</p></div>
    <button class="btn btn-secondary btn-sm" onclick="showToast('Exporting client list...','info')">Export</button>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
    <input type="text" class="form-input" style="max-width:260px" placeholder="Search by name, email or policy...">
    <select class="form-select" style="max-width:180px">
      <option>All Clients</option>
      <option>With Active Policy</option>
      <option>Renewal Due</option>
      <option>With Open Claim</option>
    </select>
    <select class="form-select" style="max-width:160px">
      <option>Sort: Recent</option>
      <option>Sort: Name A-Z</option>
      <option>Sort: Premium High</option>
    </select>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Client</th><th>Email</th><th>Phone</th><th>Policies</th><th>Total Premium</th><th>Last Contact</th><th>Actions</th></tr></thead>
        <tbody>
          ${[
            {name:'John Doe',email:'john.doe@email.com',phone:'+91 9876543210',policies:2,premium:'₹16,900',last:'15 May 2025'},
            {name:'Anita Verma',email:'anita.v@email.com',phone:'+91 9876543211',policies:1,premium:'₹7,999',last:'10 May 2025'},
            {name:'Rajesh Kumar',email:'rajesh.k@email.com',phone:'+91 9876543212',policies:3,premium:'₹24,500',last:'08 May 2025'},
            {name:'Priya Krishnamurthy',email:'priya.k@email.com',phone:'+91 9876543213',policies:1,premium:'₹4,999',last:'20 Apr 2025'},
            {name:'Meera Thomas',email:'meera.t@email.com',phone:'+91 9876543214',policies:2,premium:'₹12,800',last:'18 Apr 2025'},
            {name:'Suresh Nair',email:'suresh.n@email.com',phone:'+91 9876543215',policies:1,premium:'₹5,499',last:'05 Apr 2025'},
            {name:'Fatima Shaikh',email:'fatima.s@email.com',phone:'+91 9876543216',policies:4,premium:'₹38,200',last:'01 Apr 2025'},
          ].map(c => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${c.name}</td>
              <td style="font-size:12px;color:var(--gray-600)">${c.email}</td>
              <td style="font-size:12px;color:var(--gray-600)">${c.phone}</td>
              <td style="text-align:center;font-weight:600">${c.policies}</td>
              <td style="font-weight:700;color:var(--green)">${c.premium}</td>
              <td style="font-size:12px;color:var(--gray-400)">${c.last}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-outline btn-xs" onclick="showToast('Viewing ${c.name} profile','info')">View</button>
                  <button class="btn btn-outline btn-xs" onclick="showToast('Contacting ${c.name}','info')">Contact</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderPolicies() {
  return `
  <div class="page-header"><h1 class="page-title">Client Policies</h1><p class="page-sub">All policies across your client portfolio</p></div>
  <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
    <input type="text" class="form-input" style="max-width:260px" placeholder="Search by policy ID or client...">
    <select class="form-select" style="max-width:160px"><option>All Statuses</option><option>Active</option><option>Expired</option><option>Cancelled</option></select>
    <select class="form-select" style="max-width:180px"><option>All Plans</option><option>Basic Shield</option><option>Explorer Plus</option><option>Family Protect</option><option>Senior Guard</option></select>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Policy ID</th><th>Client</th><th>Plan</th><th>Cover</th><th>Premium</th><th>Start Date</th><th>Expiry</th><th>Status</th></tr></thead>
        <tbody>
          ${[
            {id:'TRV123456',client:'John Doe',plan:'Explorer Plus',cover:'₹15L',premium:'₹4,999',start:'01 Jan 2025',expiry:'31 Dec 2025',st:'Active',stC:'badge-green'},
            {id:'TRV123457',client:'John Doe',plan:'Basic Shield',cover:'₹5L',premium:'₹2,499',start:'15 Feb 2025',expiry:'14 Feb 2026',st:'Active',stC:'badge-green'},
            {id:'TRV123458',client:'Anita Verma',plan:'Family Protect',cover:'₹25L',premium:'₹7,999',start:'10 Mar 2025',expiry:'09 Mar 2026',st:'Active',stC:'badge-green'},
            {id:'TRV123459',client:'Rajesh Kumar',plan:'Senior Guard',cover:'₹10L',premium:'₹5,499',start:'05 Apr 2025',expiry:'04 Apr 2026',st:'Active',stC:'badge-green'},
            {id:'TRV123450',client:'Fatima Shaikh',plan:'Explorer Plus',cover:'₹15L',premium:'₹4,999',start:'20 Nov 2024',expiry:'19 Nov 2025',st:'Active',stC:'badge-green'},
            {id:'TRV123441',client:'Meera Thomas',plan:'Basic Shield',cover:'₹5L',premium:'₹2,499',start:'01 Jun 2024',expiry:'31 May 2025',st:'Expiring',stC:'badge-yellow'},
          ].map(p => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${p.id}</td>
              <td>${p.client}</td>
              <td style="font-size:12px">${p.plan}</td>
              <td style="color:var(--green);font-weight:600">${p.cover}</td>
              <td style="font-weight:700">${p.premium}</td>
              <td style="font-size:12px;color:var(--gray-500)">${p.start}</td>
              <td style="font-size:12px;color:${p.st==='Expiring'?'var(--orange)':'var(--gray-400)'}">${p.expiry}</td>
              <td><span class="badge ${p.stC}">${p.st}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderClaims() {
  return `
  <div class="page-header"><h1 class="page-title">Client Claims</h1><p class="page-sub">Track and follow up on claims from your portfolio</p></div>
  <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
    <select class="form-select" style="max-width:200px"><option>All Statuses</option><option>Pending</option><option>Under Review</option><option>Approved</option><option>Rejected</option><option>Settled</option></select>
    <input type="text" class="form-input" style="max-width:260px" placeholder="Search by claim ID or client...">
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Claim ID</th><th>Client</th><th>Type</th><th>Claimed Amount</th><th>Filed On</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          ${[
            {id:'CLM125240520044',client:'Priya Krishnamurthy',type:'Baggage Loss',amt:'₹22,000',filed:'15 May 2025',st:'Under Investigation',stC:'badge-yellow'},
            {id:'CLM125240520041',client:'Ravi Suresh',type:'Medical Emergency',amt:'₹85,000',filed:'12 May 2025',st:'Approved',stC:'badge-green'},
            {id:'CLM125240520039',client:'Meera Thomas',type:'Trip Cancellation',amt:'₹35,000',filed:'10 May 2025',st:'Pending Docs',stC:'badge-orange'},
            {id:'CLM125240520035',client:'John Doe',type:'Flight Delay',amt:'₹5,000',filed:'05 May 2025',st:'Settled',stC:'badge-gray'},
            {id:'CLM125240520031',client:'Fatima Shaikh',type:'Medical',amt:'₹1,20,000',filed:'28 Apr 2025',st:'Under Review',stC:'badge-blue'},
            {id:'CLM125240520028',client:'Suresh Nair',type:'Baggage Loss',amt:'₹15,000',filed:'20 Apr 2025',st:'Rejected',stC:'badge-red'},
            {id:'CLM125240520024',client:'Anita Verma',type:'Trip Cancel',amt:'₹18,000',filed:'10 Apr 2025',st:'Settled',stC:'badge-gray'},
          ].map(c => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${c.id}</td>
              <td>${c.client}</td>
              <td style="font-size:12px">${c.type}</td>
              <td style="font-weight:700">${c.amt}</td>
              <td style="font-size:12px;color:var(--gray-400)">${c.filed}</td>
              <td><span class="badge ${c.stC}">${c.st}</span></td>
              <td>
                <button class="btn btn-outline btn-xs" onclick="showToast('Following up on ${c.id}','info')">Follow Up</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderRenewals() {
  return `
  <div class="page-header"><h1 class="page-title">Renewals Due</h1><p class="page-sub">12 policies expiring within the next 30 days</p></div>
  <div class="alert alert-info" style="margin-bottom:20px">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    Send renewal reminders to keep your portfolio retention rate high.
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Policy ID</th><th>Client</th><th>Plan</th><th>Premium</th><th>Expiry Date</th><th>Days Left</th><th>Reminder Sent</th><th>Actions</th></tr></thead>
        <tbody>
          ${[
            {id:'TRV123456',client:'John Doe',plan:'Explorer Plus',premium:'₹4,999',expiry:'25 May 2025',days:5,reminded:true},
            {id:'TRV123458',client:'Anita Verma',plan:'Family Protect',premium:'₹7,999',expiry:'28 May 2025',days:8,reminded:true},
            {id:'TRV123461',client:'Rajesh Kumar',plan:'Basic Shield',premium:'₹2,499',expiry:'02 Jun 2025',days:13,reminded:false},
            {id:'TRV123441',client:'Meera Thomas',plan:'Basic Shield',premium:'₹2,499',expiry:'31 May 2025',days:11,reminded:false},
            {id:'TRV123465',client:'Suresh Nair',plan:'Senior Guard',premium:'₹5,499',expiry:'10 Jun 2025',days:21,reminded:false},
            {id:'TRV123468',client:'Priya Krishnamurthy',plan:'Explorer Plus',premium:'₹4,999',expiry:'15 Jun 2025',days:26,reminded:false},
          ].map(r => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${r.id}</td>
              <td>${r.client}</td>
              <td style="font-size:12px">${r.plan}</td>
              <td style="font-weight:700">${r.premium}</td>
              <td style="font-size:12px">${r.expiry}</td>
              <td>
                <span style="font-weight:700;color:${r.days<=7?'var(--red)':r.days<=14?'var(--orange)':'var(--gray-600)'}">${r.days}d</span>
              </td>
              <td style="text-align:center">
                ${r.reminded?'<span class="badge badge-green">Sent</span>':'<span class="badge badge-gray">Not sent</span>'}
              </td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-outline btn-xs" onclick="showToast('Reminder sent to ${r.client}','success')">Send Reminder</button>
                  <button class="btn btn-primary btn-xs" onclick="showToast('Initiating renewal for ${r.id}','info')">Renew</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  <div style="display:flex;justify-content:flex-end;margin-top:14px">
    <button class="btn btn-primary" onclick="showToast('Bulk reminders sent to all 9 clients without reminder','success')">Send All Pending Reminders</button>
  </div>`;
}

function renderPerformance() {
  return `
  <div class="page-header"><h1 class="page-title">My Performance</h1><p class="page-sub">Portfolio metrics for ${new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</p></div>
  <div class="grid-4" style="margin-bottom:20px">
    ${[
      {val:'94.2%',label:'Retention Rate',color:'var(--green)',bg:'rgba(34,197,94,0.1)',target:'Target: 90%'},
      {val:'₹8,450',label:'Avg Premium / Client',color:'var(--blue)',bg:'var(--blue-pale)',target:'Target: ₹7,500'},
      {val:'72',label:'NPS Score',color:'var(--navy)',bg:'rgba(15,27,60,0.06)',target:'Target: 65'},
      {val:'3.2',label:'Policies / Client',color:'var(--orange)',bg:'rgba(249,115,22,0.1)',target:'Target: 3.0'},
    ].map(s => `
      <div class="card stat-card">
        <div>
          <div class="stat-value" style="color:${s.color};font-size:${s.val.length>6?'18px':'24px'}">${s.val}</div>
          <div class="stat-label">${s.label}</div>
          <div style="font-size:11px;color:var(--green);margin-top:4px">${s.target}</div>
        </div>
        <div class="stat-icon" style="background:${s.bg}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
      </div>
    `).join('')}
  </div>
  <div class="grid-2" style="gap:20px;margin-bottom:20px">
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">Monthly Activity</h3>
      ${[
        ['Client Meetings',14,20],
        ['Renewal Follow-ups',18,20],
        ['New Policies Enrolled',6,10],
        ['Claims Assisted',4,8],
        ['Reminders Sent',22,25],
      ].map(([label,done,target]) => `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
            <span>${label}</span>
            <span style="font-weight:600;color:var(--navy)">${done} / ${target}</span>
          </div>
          <div style="height:8px;background:var(--gray-100);border-radius:4px">
            <div style="height:100%;width:${Math.round(done/target*100)}%;background:${done>=target?'var(--green)':'var(--blue)'};border-radius:4px"></div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">Portfolio Breakdown</h3>
      ${[
        ['Explorer Plus',18,'var(--blue)'],
        ['Family Protect',12,'var(--green)'],
        ['Basic Shield',10,'var(--orange)'],
        ['Senior Guard',6,'var(--red)'],
        ['Other',2,'var(--gray-400)'],
      ].map(([plan,count,color]) => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
          <div style="flex:1;font-size:13px;color:var(--gray-700)">${plan}</div>
          <div style="font-size:12px;font-weight:600;color:var(--navy)">${count} policies</div>
        </div>
      `).join('')}
      <div style="padding-top:10px;border-top:1px solid var(--gray-100);display:flex;justify-content:space-between;font-size:13px;font-weight:700">
        <span>Total Active Policies</span><span style="color:var(--navy)">48</span>
      </div>
    </div>
  </div>
  <div class="card card-body" style="background:var(--navy);color:white">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:14px;opacity:0.7;margin-bottom:4px">Total Portfolio Premium (MTD)</div>
        <div style="font-size:28px;font-weight:700;color:var(--accent)">₹4,05,600</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px;opacity:0.7;margin-bottom:4px">Target</div>
        <div style="font-size:20px;font-weight:700">₹5,00,000</div>
        <div style="font-size:12px;color:var(--accent)">81.1% achieved</div>
      </div>
    </div>
  </div>`;
}

function renderReports() {
  return `
  <div class="page-header"><h1 class="page-title">Reports</h1><p class="page-sub">Portfolio and client reports</p></div>
  <div class="grid-2" style="gap:16px">
    ${[
      {title:'Portfolio Summary',desc:'Complete overview of all clients, policies and premium totals',icon:'📊'},
      {title:'Renewal Pipeline',desc:'All renewals due in the next 30, 60, and 90 days',icon:'🔄'},
      {title:'Client Claims Report',desc:'Claims filed by your clients with status breakdown',icon:'📋'},
      {title:'Retention Analysis',desc:'Clients who renewed, lapsed or cancelled this period',icon:'📈'},
      {title:'New Business Report',desc:'New policies enrolled through your portfolio this month',icon:'🆕'},
      {title:'Client Contact Log',desc:'Interactions, follow-ups and meeting history',icon:'📞'},
    ].map(r => `
      <div class="card card-body" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px" onclick="showToast('Generating ${r.title}...','info')">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="font-size:28px">${r.icon}</div>
          <div><div style="font-size:14px;font-weight:700;color:var(--navy)">${r.title}</div><div style="font-size:12px;color:var(--gray-500)">${r.desc}</div></div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();showToast('Downloading...','info')">Download PDF</button>
      </div>
    `).join('')}
  </div>`;
}
