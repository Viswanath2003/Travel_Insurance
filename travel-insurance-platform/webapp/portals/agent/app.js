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
  const policies = getStoredPolicies();

  const commissionRate = plan => {
    const n = (plan||'').toLowerCase();
    if (n.includes('pro'))   return 0.15;
    if (n.includes('plus'))  return 0.12;
    return 0.10; // Basic or unknown
  };

  const totalPolicies  = policies.length;
  const totalPremium   = policies.reduce((s,p) => s + Number(p.premiumTotal||0), 0);
  const totalCommission = policies.reduce((s,p) => s + Number(p.premiumTotal||0) * commissionRate(p.planName||p.planId||''), 0);

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
              const rate = commissionRate(p.planName||p.planId||'');
              const comm = Math.round(Number(p.premiumTotal||0) * rate);
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
      ${(()=>{
        const groups = { Basic: {count:0, premium:0, rate:0.10}, Plus: {count:0, premium:0, rate:0.12}, Pro: {count:0, premium:0, rate:0.15} };
        policies.forEach(p => {
          const n = (p.planName||p.planId||'').toLowerCase();
          const key = n.includes('pro') ? 'Pro' : n.includes('plus') ? 'Plus' : 'Basic';
          groups[key].count++;
          groups[key].premium += Number(p.premiumTotal||0);
        });
        return Object.entries(groups).map(([plan, g]) => {
          const comm = Math.round(g.premium * g.rate);
          return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100)">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${plan} Plan <span style="color:var(--gray-400);font-weight:400">(${Math.round(g.rate*100)}%)</span></div>
              <div style="font-size:11px;color:var(--gray-400)">${g.count} polic${g.count!==1?'ies':'y'} • Premium: ₹${g.premium.toLocaleString('en-IN')}</div>
            </div>
            <span style="font-size:14px;font-weight:700;color:var(--green)">₹${comm.toLocaleString('en-IN')}</span>
          </div>`;
        }).join('');
      })()}
      <div style="padding-top:10px;font-size:13px;display:flex;justify-content:space-between;font-weight:700">
        <span>Total Commission</span><span style="color:var(--green)">${fmtINR(totalCommission)}</span>
      </div>
    </div>
  </div>`;
}

function renderClients() {
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">My Clients</h1><p class="page-sub">142 clients in your portfolio</p></div>
    <button class="btn btn-primary" onclick="showToast('Add new client form','info')">+ Add Client</button>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:16px">
    <input type="text" class="form-input" style="max-width:280px" placeholder="Search by name or email...">
    <select class="form-select" style="max-width:140px"><option>All Clients</option><option>Active</option><option>Expiring</option></select>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Client</th><th>Phone</th><th>Policies</th><th>Total Premium</th><th>Last Activity</th><th>Actions</th></tr></thead>
        <tbody>
          ${[
            {name:'Ravi Sharma',email:'ravi@example.com',phone:'+91 9876543210',count:2,premium:'₹18,200',last:'20 May 2025'},
            {name:'Anita Verma',email:'anita@example.com',phone:'+91 9123456789',count:1,premium:'₹9,450',last:'18 May 2025'},
            {name:'James Wilson',email:'james@example.com',phone:'+44 7777888999',count:3,premium:'₹42,100',last:'17 May 2025'},
            {name:'Fatima K.',email:'fatima@example.com',phone:'+971 555 1234',count:1,premium:'₹6,800',last:'15 May 2025'},
            {name:'Sarah Johnson',email:'sarah@example.com',phone:'+1 555 234 5678',count:2,premium:'₹22,600',last:'12 May 2025'},
          ].map(c => `
            <tr>
              <td><div style="font-weight:600;color:var(--navy)">${c.name}</div><div style="font-size:11px;color:var(--gray-400)">${c.email}</div></td>
              <td style="font-size:12px">${c.phone}</td>
              <td style="text-align:center;font-weight:600">${c.count}</td>
              <td style="font-weight:600">${c.premium}</td>
              <td style="font-size:12px;color:var(--gray-400)">${c.last}</td>
              <td><button class="btn btn-outline btn-xs" onclick="showToast('Client profile','info')">View</button> <button class="btn btn-primary btn-xs" onclick="navigate('quote')">Quote</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderQuote() {
  return `
  <div class="page-header"><h1 class="page-title">Generate Quote</h1><p class="page-sub">Create a new policy quote for your client</p></div>
  <div class="grid-2" style="gap:20px">
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:16px">Client & Trip Details</h3>
      <div class="form-group"><label class="form-label">Select Client</label>
        <select class="form-select"><option>— Select existing client —</option><option>Ravi Sharma</option><option>Anita Verma</option><option>James Wilson</option></select>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Destination</label>
          <select class="form-select"><option>Europe</option><option>Asia Pacific</option><option>USA / Canada</option><option>Middle East</option><option>Worldwide</option></select>
        </div>
        <div class="form-group"><label class="form-label">Trip Type</label>
          <select class="form-select"><option>Leisure</option><option>Business</option><option>Student</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Departure</label><input type="date" class="form-input"></div>
        <div class="form-group"><label class="form-label">Return</label><input type="date" class="form-input"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Adults</label><select class="form-select"><option>1</option><option>2</option><option>3</option></select></div>
        <div class="form-group"><label class="form-label">Children</label><select class="form-select"><option>0</option><option>1</option><option>2</option></select></div>
      </div>
      <button class="btn btn-primary btn-block mt-2" onclick="showToast('Quote generated! See plans on the right.','success')">Generate Quote</button>
    </div>
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:16px">Recommended Plans</h3>
      ${[
        {name:'PolicyPilot Basic',price:'₹150/day',cover:'₹25 Lakh Medical',tag:'',commission:'10%',color:'#1E4FD8'},
        {name:'PolicyPilot Plus',price:'₹300/day',cover:'₹75 Lakh Medical',tag:'Most Popular',commission:'12%',color:'#00C2A8'},
        {name:'PolicyPilot Pro',price:'₹550/day',cover:'₹2 Crore Medical',tag:'Premium',commission:'15%',color:'#F97316'},
      ].map((p,i) => `
        <div class="plan-card ${i===1?'selected':''}" style="margin-bottom:12px" onclick="this.parentNode.querySelectorAll('.plan-card').forEach(c=>c.classList.remove('selected'));this.classList.add('selected')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--navy)">${p.name}</div>
              <div style="font-size:11px;color:var(--gray-500)">Cover: ${p.cover}</div>
              <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:2px">Your commission: ${p.commission}</div>
              ${p.tag?`<span class="badge" style="background:${p.color}22;color:${p.color};margin-top:4px">${p.tag}</span>`:''}
            </div>
            <div style="font-size:16px;font-weight:700;color:${p.color}">${p.price}</div>
          </div>
        </div>
      `).join('')}
      <div style="display:flex;gap:10px;margin-top:12px">
        <button class="btn btn-outline btn-block" onclick="showToast('Quote sent to client email','success')">Email Quote</button>
        <button class="btn btn-primary btn-block" onclick="showToast('Binding policy...','info')">Bind Policy</button>
      </div>
    </div>
  </div>`;
}

function renderPolicies() {
  return `
  <div class="page-header"><h1 class="page-title">Bound Policies</h1><p class="page-sub">38 active policies in your portfolio</p></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Policy No</th><th>Client</th><th>Plan</th><th>Premium</th><th>Valid Till</th><th>Status</th></tr></thead>
        <tbody>
          ${[
            {no:'TRV123456',client:'Ravi Sharma',plan:'Europe Standard',prem:'₹8,200','till':'20 May 2025',st:'Active',stC:'badge-green'},
            {no:'TRV123457',client:'Anita Verma',plan:'Asia Adventure',prem:'₹9,450','till':'10 Aug 2025',st:'Active',stC:'badge-green'},
            {no:'TRV123450',client:'Fatima K.',plan:'Middle East Plan',prem:'₹6,800','till':'25 May 2025',st:'Expiring',stC:'badge-orange'},
            {no:'TRV123448',client:'David R.',plan:'Europe Premium',prem:'₹12,400','till':'01 Jun 2025',st:'Expiring',stC:'badge-orange'},
          ].map(p => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${p.no}</td>
              <td>${p.client}</td>
              <td style="font-size:12px;color:var(--gray-500)">${p.plan}</td>
              <td style="font-weight:600">${p.prem}</td>
              <td style="font-size:12px">${p.till}</td>
              <td><span class="badge ${p.stC}">${p.st}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renewals() {
  return `
  <div class="page-header"><h1 class="page-title">Renewals</h1><p class="page-sub">7 policies due for renewal in the next 30 days</p></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Policy</th><th>Client</th><th>Expiry</th><th>Premium</th><th>Action</th></tr></thead>
        <tbody>
          ${[
            {no:'TRV123450',client:'Fatima K.',exp:'25 May 2025',prem:'₹6,800'},
            {no:'TRV123448',client:'David R.',exp:'01 Jun 2025',prem:'₹12,400'},
            {no:'TRV123445',client:'Priya M.',exp:'05 Jun 2025',prem:'₹8,900'},
            {no:'TRV123443',client:'Ahmed K.',exp:'10 Jun 2025',prem:'₹7,200'},
          ].map(r => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${r.no}</td>
              <td>${r.client}</td>
              <td style="font-size:12px;color:var(--orange);font-weight:600">${r.exp}</td>
              <td style="font-weight:600">${r.prem}</td>
              <td>
                <button class="btn btn-primary btn-xs" onclick="showToast('Renewal initiated','success')">Renew</button>
                <button class="btn btn-secondary btn-xs" onclick="showToast('Reminder sent to client','info')">Remind Client</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderCommission() {
  return `
  <div class="page-header"><h1 class="page-title">My Commission</h1></div>
  <div class="grid-3" style="margin-bottom:20px">
    ${[
      {val:'₹2,40,000',label:'Commission MTD',sub:'Month to date'},
      {val:'₹18,40,000',label:'Commission YTD',sub:'Year to date'},
      {val:'₹6,800',label:'Pending Payout',sub:'Next payout: 1 Jun'},
    ].map(s => `<div class="card stat-card"><div><div class="stat-value" style="color:var(--navy);font-size:20px">${s.val}</div><div class="stat-label">${s.label}</div><div style="font-size:11px;color:var(--gray-400);margin-top:3px">${s.sub}</div></div></div>`).join('')}
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Commission Breakdown</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Policy</th><th>Client</th><th>Premium</th><th>Rate</th><th>Commission</th><th>Status</th></tr></thead>
        <tbody>
          ${[
            {no:'TRV123456',client:'Ravi Sharma',prem:'₹8,200',rate:'15%',comm:'₹1,230',st:'Paid'},
            {no:'TRV123457',client:'Anita Verma',prem:'₹9,450',rate:'15%',comm:'₹1,418',st:'Paid'},
            {no:'TRV123458',client:'James Wilson',prem:'₹42,100',rate:'12%',comm:'₹5,052',st:'Pending'},
          ].map(r => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${r.no}</td>
              <td>${r.client}</td>
              <td>${r.prem}</td>
              <td style="color:var(--blue);font-weight:600">${r.rate}</td>
              <td style="font-weight:700;color:var(--navy)">${r.comm}</td>
              <td><span class="badge ${r.st==='Paid'?'badge-green':'badge-yellow'}">${r.st}</span></td>
            </tr>
          `).join('')}
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
