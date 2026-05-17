/* ================================================================
   FINANCE OFFICER PORTAL – Navigation + Page Renders
================================================================ */
function navigate(section) {
  document.querySelectorAll('#sidebar .sidebar-item').forEach(b => b.classList.toggle('active', b.dataset.section === section));
  const main = document.getElementById('app-main');
  const renders = { dashboard:renderDashboard, premiums:renderPremiums, payouts:renderPayouts, reconciliation:renderReconciliation, reports:renderReports, audit:renderAudit };
  main.innerHTML = (renders[section] || renderDashboard)();
  main.scrollTop = 0;
}

function renderDashboard() {
  const policies = getStoredPolicies();
  const claims   = getStoredClaims();

  const totalPremium    = policies.reduce((s,p) => s + Number(p.premiumTotal||0), 0);
  const activePolicies  = policies.filter(p => p.status === 'Active').length;
  const pendingPayouts  = claims.filter(c => c.status === 'Approved').length;
  const settledClaims   = claims.filter(c => c.status === 'Settled').length;

  const fmtINR = n => {
    if (n >= 10000000) return '₹' + (n/10000000).toFixed(1) + 'Cr';
    if (n >= 100000)   return '₹' + (n/100000).toFixed(1) + 'L';
    if (n >= 1000)     return '₹' + (n/1000).toFixed(1) + 'K';
    return '₹' + n.toLocaleString('en-IN');
  };

  const recentPolicies = [...policies]
    .sort((a,b) => new Date(b.purchasedOn||0) - new Date(a.purchasedOn||0))
    .slice(0, 6);

  const stats = [
    {val: fmtINR(totalPremium), label:'Total Premium Collected', color:'var(--green)',  bg:'rgba(34,197,94,0.1)'},
    {val: activePolicies,       label:'Active Policies',         color:'var(--blue)',   bg:'var(--blue-pale)'},
    {val: pendingPayouts,       label:'Pending Payouts',         color:'var(--orange)', bg:'rgba(249,115,22,0.1)'},
    {val: settledClaims,        label:'Claims Settled',          color:'var(--navy)',   bg:'rgba(15,27,60,0.06)'},
  ];

  return `
  <div class="page-header"><h1 class="page-title">Finance Dashboard</h1><p class="page-sub">Financial overview for ${new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</p></div>
  <div class="grid-4" style="margin-bottom:20px">
    ${stats.map(s => `
      <div class="card stat-card">
        <div><div class="stat-value" style="color:${s.color};font-size:${String(s.val).length>6?'18px':'26px'}">${s.val}</div><div class="stat-label">${s.label}</div></div>
        <div class="stat-icon" style="background:${s.bg}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
      </div>
    `).join('')}
  </div>
  <div class="grid-2" style="gap:20px">
    <div class="card">
      <div class="card-header"><span class="card-title">Recent Premium Transactions</span><a href="#" onclick="navigate('premiums');return false" style="font-size:12px;color:var(--blue);text-decoration:none">View all →</a></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Policy No</th><th>Policyholder</th><th>Plan</th><th>Premium</th><th>Purchased On</th></tr></thead>
          <tbody>
            ${recentPolicies.length ? recentPolicies.map(p => `
              <tr>
                <td style="font-weight:600;color:var(--navy)">${p.policyNo}</td>
                <td>${p.userName||p.userEmail||'—'}</td>
                <td style="font-size:12px;color:var(--gray-500)">${p.planName||'—'}</td>
                <td style="font-weight:700;color:var(--green)">₹${Number(p.premiumTotal||0).toLocaleString('en-IN')}</td>
                <td style="font-size:12px;color:var(--gray-400)">${p.purchasedOn ? formatDate(p.purchasedOn) : '—'}</td>
              </tr>
            `).join('') : `<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:20px">No policies found</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:16px">Revenue Breakdown</h3>
      ${(()=>{
        const rev    = totalPremium;
        const claims_  = getStoredClaims();
        const clPaid   = claims_.filter(c=>c.status==='Settled').reduce((s,c)=>s+Number(c.amount||0),0);
        const commission = rev * 0.15;
        const opCost     = rev * 0.10;
        const netProfit  = rev - clPaid - commission - opCost;
        const rows = [
          ['Premium Revenue',   fmtINR(rev),        100,         'var(--green)'],
          ['Claims Payouts',    fmtINR(clPaid),      rev?Math.round(clPaid/rev*100):0, 'var(--red)'],
          ['Agent Commission',  fmtINR(commission),  15,          'var(--blue)'],
          ['Operational Cost',  fmtINR(opCost),      10,          'var(--orange)'],
        ];
        return rows.map(([l,v,p,c]) => `
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
              <span>${l}</span><span style="font-weight:600;color:var(--navy)">${v}</span>
            </div>
            <div style="height:8px;background:var(--gray-100);border-radius:4px"><div style="height:100%;width:${Math.min(p,100)}%;background:${c};border-radius:4px"></div></div>
          </div>
        `).join('') + `
        <div style="padding-top:8px;border-top:1px solid var(--gray-100);font-size:13px;display:flex;justify-content:space-between;font-weight:700">
          <span>Net Profit</span><span style="color:var(--green)">${fmtINR(Math.max(0,netProfit))}</span>
        </div>`;
      })()}
    </div>
  </div>`;
}

function renderPremiums() {
  return `
  <div class="page-header flex justify-between items-center">
    <div><h1 class="page-title">Premium Collections</h1><p class="page-sub">All policy premium payments</p></div>
    <button class="btn btn-secondary btn-sm" onclick="showToast('Exporting report...','info')">Export CSV</button>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:16px">
    <select class="form-select" style="max-width:150px"><option>All Months</option><option>May 2025</option><option>Apr 2025</option></select>
    <input type="text" class="form-input" style="max-width:220px" placeholder="Search by policy or claimant...">
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Transaction ID</th><th>Policy</th><th>Policyholder</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          ${[
            {txn:'TXN20250520001',policy:'TRV123456',holder:'John Doe',amt:'₹8,450',method:'Credit Card',date:'20 May 2025',st:'Confirmed',stC:'badge-green'},
            {txn:'TXN20250519002',policy:'TRV123457',holder:'Anita V.',amt:'₹9,450',method:'UPI',date:'19 May 2025',st:'Confirmed',stC:'badge-green'},
            {txn:'TXN20250518003',policy:'TRV123458',holder:'James W.',amt:'₹42,100',method:'Net Banking',date:'18 May 2025',st:'Pending',stC:'badge-yellow'},
            {txn:'TXN20250517004',policy:'TRV123450',holder:'Fatima K.',amt:'₹6,800',method:'UPI',date:'17 May 2025',st:'Confirmed',stC:'badge-green'},
          ].map(r => `
            <tr>
              <td style="font-size:12px;font-weight:600;color:var(--navy)">${r.txn}</td>
              <td style="font-size:12px">${r.policy}</td>
              <td>${r.holder}</td>
              <td style="font-weight:700">${r.amt}</td>
              <td style="font-size:12px;color:var(--gray-500)">${r.method}</td>
              <td style="font-size:12px;color:var(--gray-400)">${r.date}</td>
              <td><span class="badge ${r.stC}">${r.st}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderPayouts() {
  return `
  <div class="page-header"><h1 class="page-title">Claims Payouts</h1><p class="page-sub">6 payouts pending processing</p></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Claim ID</th><th>Claimant</th><th>Approved Amount</th><th>Bank Account</th><th>Approved On</th><th>Action</th></tr></thead>
        <tbody>
          ${[
            {id:'CLM125240520042',name:'Sara W.',amt:'₹1,200.00',bank:'**** 5678',date:'20 May 2025'},
            {id:'CLM125240520037',name:'Nair M.',amt:'₹18,000',bank:'**** 9012',date:'19 May 2025'},
            {id:'CLM125240520033',name:'Priya K.',amt:'₹320.00',bank:'**** 3456',date:'18 May 2025'},
            {id:'CLM125240520029',name:'David R.',amt:'₹25,000',bank:'**** 7890',date:'17 May 2025'},
          ].map(r => `
            <tr>
              <td style="font-weight:600;color:var(--navy)">${r.id}</td>
              <td>${r.name}</td>
              <td style="font-weight:700;color:var(--green)">${r.amt}</td>
              <td style="font-size:12px;color:var(--gray-500)">${r.bank}</td>
              <td style="font-size:12px;color:var(--gray-400)">${r.date}</td>
              <td>
                <button class="btn btn-success btn-xs" onclick="showToast('Payout processed for ${r.name}','success')">Process Payout</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderReconciliation() {
  return `
  <div class="page-header"><h1 class="page-title">Reconciliation</h1><p class="page-sub">Monthly ledger reconciliation</p></div>
  <div class="alert alert-info" style="margin-bottom:20px">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    Reconciliation for May 2025. All entries are final after approval.
  </div>
  <div class="grid-2" style="gap:20px;margin-bottom:20px">
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">Income Ledger</h3>
      ${[['Premium Collections','₹48,20,000'],['Investment Returns','₹1,80,000'],['Other Income','₹20,000'],['Total Income','₹50,20,000']].map(([k,v],i) => `
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:7px 0;border-bottom:1px solid var(--gray-100);${i===3?'font-weight:700;color:var(--navy)':''}"><span>${k}</span><span style="color:var(--green)">${v}</span></div>
      `).join('')}
    </div>
    <div class="card card-body">
      <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px">Expense Ledger</h3>
      ${[['Claims Payouts','₹12,60,000'],['Agent Commission','₹7,20,000'],['Operational','₹4,80,000'],['Total Expenses','₹24,60,000']].map(([k,v],i) => `
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:7px 0;border-bottom:1px solid var(--gray-100);${i===3?'font-weight:700;color:var(--navy)':''}"><span>${k}</span><span style="color:var(--red)">${v}</span></div>
      `).join('')}
    </div>
  </div>
  <div class="card card-body" style="background:var(--navy);color:white">
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:18px;font-weight:700">
      <span>Net Profit (May 2025)</span><span style="color:var(--accent)">₹25,60,000</span>
    </div>
  </div>
  <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">
    <button class="btn btn-secondary" onclick="showToast('Reconciliation saved as draft','info')">Save Draft</button>
    <button class="btn btn-primary" onclick="showToast('Reconciliation approved and locked','success')">Approve & Lock</button>
  </div>`;
}

function renderReports() {
  return `
  <div class="page-header"><h1 class="page-title">Financial Reports</h1></div>
  <div class="grid-2" style="gap:16px">
    ${[
      {title:'P&L Statement',desc:'Profit & Loss for current and previous months',icon:'📊'},
      {title:'Premium Collection Report',desc:'All premium transactions and reconciliation',icon:'💰'},
      {title:'Claims Payout Report',desc:'Claims paid and pending, by type and date',icon:'📤'},
      {title:'Loss Ratio Report',desc:'Claims vs premium ratio analysis',icon:'📉'},
      {title:'Agent Commission Report',desc:'Commission payouts to agents by period',icon:'🤝'},
      {title:'Tax Summary',desc:'GST and tax liability summary',icon:'🧾'},
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

function renderAudit() {
  return `
  <div class="page-header"><h1 class="page-title">Audit Ledger</h1></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Timestamp</th><th>Transaction</th><th>Type</th><th>Amount</th><th>Officer</th></tr></thead>
        <tbody>
          ${[
            {time:'20 May 11:30 AM',txn:'TXN20250520001',type:'Premium Received',amt:'₹8,450',officer:'Finance Officer'},
            {time:'20 May 10:00 AM',txn:'PAY20250520001',type:'Claim Payout',amt:'₹1,200',officer:'Finance Officer'},
            {time:'19 May 04:00 PM',txn:'TXN20250519002',type:'Premium Received',amt:'₹9,450',officer:'Finance Officer'},
          ].map(r => `
            <tr>
              <td style="font-size:12px;color:var(--gray-500)">${r.time}</td>
              <td style="font-weight:600;color:var(--navy)">${r.txn}</td>
              <td><span class="badge ${r.type.includes('Payout')?'badge-red':'badge-green'}">${r.type}</span></td>
              <td style="font-weight:700">${r.amt}</td>
              <td style="font-size:12px">${r.officer}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}
