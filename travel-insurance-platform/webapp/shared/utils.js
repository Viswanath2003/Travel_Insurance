/* ================================================================
   PolicyPilot – SHARED UTILITIES
   Session management, toast, auth-guard, logout
================================================================ */

// ===== WEBAPP ROOT (resolved once from this script's src) =====
const WEBAPP_ROOT = (function () {
  const scripts = document.querySelectorAll('script[src]');
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].getAttribute('src');
    if (src && src.includes('shared/utils.js')) {
      const abs = new URL(src, window.location.href).href;
      return abs.slice(0, abs.indexOf('shared/utils.js'));
    }
  }
  // Fallback: strip back to /webapp/ from current URL
  const m = window.location.href.match(/^(.*\/webapp\/)/);
  return m ? m[1] : './';
})();

// ===== SESSION MANAGEMENT =====
const SESSION_KEY = 'ti_session';

// Paths are relative to WEBAPP_ROOT (not to any specific page)
const ROLE_PORTALS = {
  'ROLE_CUSTOMER':             'portals/customer/index.html',
  'ROLE_AGENT':                'portals/agent/index.html',
  'ROLE_UNDERWRITER':          'portals/underwriter/index.html',
  'ROLE_CLAIMS_OFFICER':       'portals/claims-officer/index.html',
  'ROLE_FIELD_OFFICER':        'portals/field-officer/index.html',
  'ROLE_FINANCE':              'portals/finance/index.html',
  'ROLE_RELATIONSHIP_MANAGER': 'portals/relationship-manager/index.html',
};

const ROLE_LABELS = {
  'ROLE_CUSTOMER':             'Customer',
  'ROLE_AGENT':                'Agent / Broker',
  'ROLE_UNDERWRITER':          'Underwriter',
  'ROLE_CLAIMS_OFFICER':       'Claims Officer',
  'ROLE_FIELD_OFFICER':        'Field Officer',
  'ROLE_FINANCE':              'Finance Officer',
  'ROLE_RELATIONSHIP_MANAGER': 'Relationship Manager',
};

const AVATAR_COLORS = {
  'ROLE_CUSTOMER':             '#1E4FD8',
  'ROLE_AGENT':                '#00C2A8',
  'ROLE_UNDERWRITER':          '#F97316',
  'ROLE_CLAIMS_OFFICER':       '#EAB308',
  'ROLE_FIELD_OFFICER':        '#22C55E',
  'ROLE_FINANCE':              '#8B5CF6',
  'ROLE_RELATIONSHIP_MANAGER': '#0891B2',
};

function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch { return null; }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function requireAuth(expectedRole) {
  const user = getSession();
  if (!user) {
    window.location.replace(WEBAPP_ROOT + 'auth/index.html');
    return null;
  }
  if (expectedRole && user.role !== expectedRole) {
    const portal = ROLE_PORTALS[user.role];
    if (portal) window.location.replace(WEBAPP_ROOT + portal);
    return null;
  }
  return user;
}

function requireAnyAuth() {
  const user = getSession();
  if (!user) {
    window.location.replace(WEBAPP_ROOT + 'auth/index.html');
    return null;
  }
  return user;
}

function redirectToPortal(role) {
  const portal = ROLE_PORTALS[role];
  if (portal) window.location.replace(WEBAPP_ROOT + portal);
}

function doLogout() {
  showToast('You have been signed out.', 'info');
  setTimeout(() => {
    clearSession();
    window.location.replace(WEBAPP_ROOT + 'auth/index.html');
  }, 700);
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
  toast.innerHTML = `<span style="font-size:16px">${icons[type] || 'ℹ'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ===== RENDER USER CHIP =====
function renderUserChip(user) {
  const displayName = user.fullName || user.name || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const color = AVATAR_COLORS[user.role] || '#1E4FD8';
  const label = ROLE_LABELS[user.role] || user.role;
  return `
    <div class="user-chip">
      <div class="user-avatar" style="background:${color}">${initials}</div>
      <div>
        <div class="user-name">${displayName}</div>
        <div class="user-role">${label}</div>
      </div>
    </div>`;
}

// ===== COMMON SIDEBAR FOOTER (Logout) =====
function sidebarLogoutBtn() {
  return `
    <div class="sidebar-logout">
      <div class="sidebar-divider"></div>
      <button class="sidebar-item" onclick="doLogout()">
        <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
    </div>`;
}

// ===== SVG ICON LIBRARY =====
const Icons = {
  dashboard:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  shield:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  check:       `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  x:           `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  arrow:       `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  clock:       `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  file:        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  users:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  bell:        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  search:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  settings:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  chart:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  list:        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  warning:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  dollar:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  folder:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  map:         `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  logout:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  user:        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  store:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  clipboard:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  auditLog:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
};

// ===== STORAGE HELPERS =====
const POLICIES_KEY = 'ti_policies';
const CLAIMS_KEY   = 'ti_claims';

function getStoredPolicies(userEmail) {
  try {
    const all = JSON.parse(localStorage.getItem(POLICIES_KEY) || '[]');
    return userEmail ? all.filter(p => p.userEmail === userEmail) : all;
  } catch { return []; }
}

function storePolicies(policies) {
  const all = JSON.parse(localStorage.getItem(POLICIES_KEY) || '[]');
  policies.forEach(pol => {
    const idx = all.findIndex(p => p.policyNo === pol.policyNo);
    if (idx >= 0) all[idx] = pol; else all.push(pol);
  });
  localStorage.setItem(POLICIES_KEY, JSON.stringify(all));
}

function storePolicy(policy) {
  storePolicies([policy]);
}

function getStoredClaims(userEmail) {
  try {
    const all = JSON.parse(localStorage.getItem(CLAIMS_KEY) || '[]');
    return userEmail ? all.filter(c => c.userEmail === userEmail) : all;
  } catch { return []; }
}

function storeClaim(claim) {
  const all = JSON.parse(localStorage.getItem(CLAIMS_KEY) || '[]');
  const idx = all.findIndex(c => c.claimNo === claim.claimNo);
  if (idx >= 0) all[idx] = claim; else all.push(claim);
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(all));
}

function getNotifications(role) {
  try {
    let list = JSON.parse(localStorage.getItem(`ti_notifications_${role}`) || '[]');
    const user = getSession();
    // Notifications with userEmail are user-specific; without userEmail are role-wide
    if (user) {
      list = list.filter(n => !n.userEmail || n.userEmail === user.email);
    }
    return list;
  } catch { return []; }
}

function addNotification(role, notif) {
  // If a customer triggers a notification for themselves, attach their email automatically
  const user = getSession();
  if (role === 'ROLE_CUSTOMER' && !notif.userEmail && user && user.role === 'ROLE_CUSTOMER') {
    notif.userEmail = user.email;
  }
  
  // Read raw list bypassing the filter
  const rawList = JSON.parse(localStorage.getItem(`ti_notifications_${role}`) || '[]');
  rawList.unshift({ id: Date.now(), read: false, ts: new Date().toLocaleString(), ...notif });
  localStorage.setItem(`ti_notifications_${role}`, JSON.stringify(rawList.slice(0, 50)));
}

function markAllNotificationsRead(role) {
  const rawList = JSON.parse(localStorage.getItem(`ti_notifications_${role}`) || '[]');
  const user = getSession();
  const updatedList = rawList.map(n => {
    // Don't mark notifications targeted at other users
    if (n.userEmail && (!user || n.userEmail !== user.email)) return n;
    return { ...n, read: true };
  });
  localStorage.setItem(`ti_notifications_${role}`, JSON.stringify(updatedList));
}

function getUnreadCount(role) {
  return getNotifications(role).filter(n => !n.read).length;
}

function updateNotifBadge(role) {
  const count = getUnreadCount(role);
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = count > 9 ? '9+' : String(count);
    badge.style.display = count > 0 ? '' : 'none';
  }
}

// ===== NOTIFICATION DRAWER =====
function renderNotifDrawer(role) {
  const notifs = getNotifications(role);
  return `
  <div id="notif-overlay" class="notif-overlay" onclick="closeNotifDrawer()"></div>
  <div id="notif-drawer" class="notif-drawer">
    <div class="notif-drawer-header">
      <span>Notifications</span>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-ghost btn-sm" onclick="markAllRead('${role}')">Mark all read</button>
        <button onclick="closeNotifDrawer()" style="background:none;border:none;cursor:pointer;color:var(--gray-400);font-size:18px">×</button>
      </div>
    </div>
    <div class="notif-drawer-body">
      ${notifs.length ? notifs.map(n => `
        <div class="notif-item${n.read ? '' : ' unread'}">
          <div style="font-size:13px;font-weight:${n.read ? '400' : '600'};color:var(--navy)">${n.title || 'Notification'}</div>
          <div style="font-size:12px;color:var(--gray-400);margin-top:2px">${n.body || ''}</div>
          <div style="font-size:11px;color:var(--gray-300);margin-top:4px">${n.ts || ''}</div>
        </div>
      `).join('') : '<div style="padding:24px;text-align:center;color:var(--gray-400);font-size:13px">No notifications yet</div>'}
    </div>
  </div>`;
}

function openNotifDrawer(role) {
  let el = document.getElementById('notif-drawer-wrap');
  if (!el) { el = document.createElement('div'); el.id = 'notif-drawer-wrap'; document.body.appendChild(el); }
  el.innerHTML = renderNotifDrawer(role);
  requestAnimationFrame(() => {
    document.getElementById('notif-drawer').classList.add('open');
    document.getElementById('notif-overlay').classList.add('open');
  });
}

function closeNotifDrawer() {
  const d = document.getElementById('notif-drawer');
  const o = document.getElementById('notif-overlay');
  if (d) d.classList.remove('open');
  if (o) o.classList.remove('open');
  setTimeout(() => { const w = document.getElementById('notif-drawer-wrap'); if (w) w.innerHTML = ''; }, 300);
}

function markAllRead(role) {
  markAllNotificationsRead(role);
  updateNotifBadge(role);
  closeNotifDrawer();
  setTimeout(() => openNotifDrawer(role), 310);
}

// ===== GENERATE POLICY NUMBER =====
function generatePolicyNo() {
  return 'TRV' + Date.now().toString().slice(-7) + Math.floor(Math.random()*100).toString().padStart(2,'0');
}

function generateClaimNo() {
  return 'CLM' + Date.now().toString().slice(-7) + Math.floor(Math.random()*100).toString().padStart(2,'0');
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ===== SHARED PLAN & PRODUCT CATALOG (used across all portals) =====
const SHARED_PLANS = {
  basic: { id:'basic', name:'PolicyPilot Basic', tag:null,           color:'#1E4FD8', bg:'var(--blue-pale)',           dailyRate:150, commissionRate:0.10 },
  plus:  { id:'plus',  name:'PolicyPilot Plus',  tag:'Most Popular', color:'#00C2A8', bg:'rgba(0,194,168,0.08)',        dailyRate:300, commissionRate:0.12 },
  pro:   { id:'pro',   name:'PolicyPilot Pro',   tag:'Premium',      color:'#F97316', bg:'rgba(249,115,22,0.08)',       dailyRate:550, commissionRate:0.15 },
};

const SHARED_DESTINATIONS = [
  { label:'India (Domestic)',         value:'india',      mult:0.7  },
  { label:'South / South-East Asia',  value:'se_asia',    mult:1.0  },
  { label:'Middle East / Africa',     value:'me_africa',  mult:1.3  },
  { label:'Europe',                   value:'europe',     mult:1.5  },
  { label:'Australia / New Zealand',  value:'aus_nz',     mult:1.8  },
  { label:'USA / Canada',             value:'usa_canada', mult:2.0  },
  { label:'Worldwide',                value:'worldwide',  mult:2.5  },
];

const SHARED_ADDONS = [
  { id:'adventure', label:'Adventure Sports Cover',   price:500 },
  { id:'rental',    label:'Rental Car Protection',    price:400 },
  { id:'golf',      label:'Golf Equipment Cover',     price:350 },
  { id:'business',  label:'Business Equipment',       price:600 },
  { id:'preexist',  label:'Pre-existing Conditions',  price:800 },
  { id:'home',      label:'Home Burglary Cover',      price:300 },
];

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// Shared premium calculation (same formula as customer portal)
function calcSharedPremium(planId, days, travelers, destMult, tripMult, addonIds) {
  const plan = SHARED_PLANS[planId];
  if (!plan || !days) return 0;
  const tMult = travelers <= 1 ? 1 : travelers <= 4 ? 1 + (travelers - 1) * 0.6 : 1 + 3 * 0.6 + (travelers - 4) * 0.4;
  const raw = plan.dailyRate * days * tMult * (destMult || 1) * (tripMult || 1);
  const addonCost = (addonIds || []).reduce((s, id) => { const a = SHARED_ADDONS.find(x => x.id === id); return s + (a ? a.price * (travelers || 1) : 0); }, 0);
  const discounted = (raw + addonCost) * 0.95;
  return Math.round(discounted * 1.18);
}

// ===== REAL-TIME SYNC FOR PRESENTATION =====
// When localStorage changes in another tab (e.g. customer buys policy -> underwriter queue updates)
window.addEventListener('storage', (e) => {
  if (e.key === 'ti_policies' || e.key === 'ti_claims' || (e.key && e.key.startsWith('ti_notifications'))) {
    const user = getSession();
    if (user) updateNotifBadge(user.role);
    
    // Only auto-refresh if the user is on a "queue" or "dashboard" to avoid disrupting forms/reviews
    if (typeof navigate === 'function') {
      const activeBtn = document.querySelector('.sidebar-item.active');
      if (activeBtn) {
        const sec = activeBtn.dataset.section;
        // avoid re-rendering review/buy pages to not clear unsaved inputs
        if (!['review', 'buy-policy', 'claims'].includes(sec)) {
          setTimeout(() => navigate(sec), 100);
        }
      } else {
        // If no sidebar is active, try to re-render default dashboard if not auth page
        if (!window.location.pathname.includes('auth')) {
          setTimeout(() => navigate('dashboard'), 100);
        }
      }
    }
  }
});
