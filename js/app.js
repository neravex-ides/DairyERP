/********************************************
 * 1. FIREBASE INIT – आपकी config (compat)
 ********************************************/
const firebaseConfig = {
  apiKey: "AIzaSyAQRlN1mhknTMzVi2JNJNrGb_a2S0fKr-s",
  authDomain: "dairy-flow-53832.firebaseapp.com",
  projectId: "dairy-flow-53832",
  storageBucket: "dairy-flow-53832.firebasestorage.app",
  messagingSenderId: "276001416186",
  appId: "1:276001416186:web:40a950dafc7594bc4afa43",
  measurementId: "G-VZ8LWHV9KZ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

/********************************************
 * 2. LOCAL STORAGE STATE (ERP DATA)
 ********************************************/
const STORAGE_KEY = 'dairyERP_FULL';

const defaultData = {
  users: [],         // {id,email,name}
  currentUserId: null,
  farmers: [],       // {id,code,name,phone,address}
  customers: [],     // {id,name,phone,address}
  milkEntries: [],   // {id,date,farmerId,shift,qty,rate,amount}
  payments: [],      // {id,date,partyType,partyId,mode,amount,notes}
  settings: {
    dairyName: '',
    owner: '',
    defaultMilkRate: 0
  }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);
    const parsed = JSON.parse(raw);
    return Object.assign(structuredClone(defaultData), parsed);
  } catch (e) {
    console.error(e);
    return structuredClone(defaultData);
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
let state = loadState();

/********************************************
 * 3. HELPERS
 ********************************************/
function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function formatDateISO(date) {
  return date.toISOString().slice(0, 10);
}
function formatCurrency(n) {
  return '₹' + Number(n || 0).toFixed(2);
}
function showToast(message) {
  const toast = document.getElementById('app-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'flex';
  setTimeout(() => { toast.style.display = 'none'; }, 2200);
}

function getCurrentUser() {
  if (!state.currentUserId) return null;
  return state.users.find(u => u.id === state.currentUserId) || null;
}

/********************************************
 * 4. AUTH GUARD + SIDEBAR + LOGOUT
 ********************************************/
function requireAuthOnAppPages() {
  const path = window.location.pathname;
  const isAppPage = path.includes('/pages/');
  const isAuthPage =
    path.endsWith('login.html') ||
    path.endsWith('register.html') ||
    path.endsWith('/index.html') ||
    path.endsWith('/') ||
    path === '';

  const user = getCurrentUser();

  if (isAppPage && !user) {
    window.location.href = '../login.html';
  }

  if (!isAppPage && isAuthPage && user) {
    window.location.href = 'pages/dashboard.html';
  }
}

function initSidebarUser() {
  const user = getCurrentUser();
  if (!user) return;
  const nameEl   = document.getElementById('sidebar-user-name');
  const roleEl   = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = user.name || 'User';
  if (roleEl) roleEl.textContent = 'Admin';
  if (avatarEl) {
    const initials = (user.name || 'U')
      .split(' ')
      .map(p => p[0])
      .join('')
      .slice(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
}

function initLogout() {
  const btn = document.getElementById('btn-logout');
  if (!btn) return;
  btn.addEventListener('click', () => {
    auth.signOut().catch(console.error);
    state.currentUserId = null;
    saveState();
    window.location.href = '../login.html';
  });
}

/********************************************
 * 5. AUTH FORMS (Email + Google + Forgot)
 ********************************************/

// Landing page
function initLandingLogin() {
  const form = document.getElementById('landing-login-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('landing-email').value.trim();
    window.location.href =
      'login.html' + (email ? ('?email=' + encodeURIComponent(email)) : '');
  });

  document.querySelectorAll('[data-auth="google-landing"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then(result => {
          const userFB = result.user;
          const uid    = userFB.uid;
          state.currentUserId = uid;
          const userLocal = {
            id: uid,
            email: userFB.email,
            name: userFB.displayName || 'Google User'
          };
          state.users = state.users.filter(u => u.id !== uid);
          state.users.push(userLocal);
          saveState();
          window.location.href = 'pages/dashboard.html';
        })
        .catch(err => {
          console.error(err);
          showToast(err.message || 'Google sign-in failed.');
        });
    });
  });

  const forgot = document.getElementById('landing-forgot');
  if (forgot) {
    forgot.addEventListener('click', () => {
      showToast('Use main login page to reset password.');
    });
  }
}

// Login page
function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const prefillEmail = params.get('email');
  if (prefillEmail) {
    const emailInput = document.getElementById('login-email');
    if (emailInput) emailInput.value = prefillEmail;
  }

  // Email login
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
        const userFB = cred.user;
        const uid    = userFB.uid;
        state.currentUserId = uid;
        const userLocal = {
          id: uid,
          email: userFB.email,
          name: userFB.displayName || 'Dairy User'
        };
        state.users = state.users.filter(u => u.id !== uid);
        state.users.push(userLocal);
        saveState();
        window.location.href = 'pages/dashboard.html';
      })
      .catch(err => {
        console.error(err);
        showToast(err.message || 'Login failed.');
      });
  });

  // Google login
  document.querySelectorAll('[data-auth="google-login"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then(result => {
          const userFB = result.user;
          const uid    = userFB.uid;
          state.currentUserId = uid;
          const userLocal = {
            id: uid,
            email: userFB.email,
            name: userFB.displayName || 'Google User'
          };
          state.users = state.users.filter(u => u.id !== uid);
          state.users.push(userLocal);
          saveState();
          window.location.href = 'pages/dashboard.html';
        })
        .catch(err => {
          console.error(err);
          showToast(err.message || 'Google sign-in failed.');
        });
    });
  });

  // Forgot password
  const forgot = document.getElementById('login-forgot-link');
  if (forgot) {
    forgot.addEventListener('click', () => {
      const email = document.getElementById('login-email').value.trim();
      if (!email) {
        showToast('Enter your email first.');
        return;
      }
      auth.sendPasswordResetEmail(email)
        .then(() => showToast('Password reset email sent.'))
        .catch(err => {
          console.error(err);
          showToast(err.message || 'Could not send reset email.');
        });
    });
  }
}

// Register page
function initRegisterPage() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name      = document.getElementById('reg-name').value.trim();
    const dairyName = document.getElementById('reg-dairy-name') ?
                      document.getElementById('reg-dairy-name').value.trim() : '';
    const email     = document.getElementById('reg-email').value.trim().toLowerCase();
    const password  = document.getElementById('reg-password').value;

    auth.createUserWithEmailAndPassword(email, password)
      .then(cred => {
        const userFB = cred.user;
        const uid    = userFB.uid;
        state.currentUserId = uid;
        const userLocal = {
          id: uid,
          email: userFB.email,
          name: name || userFB.displayName || 'Dairy User'
        };
        state.users = state.users.filter(u => u.id !== uid);
        state.users.push(userLocal);
        state.settings.dairyName = dairyName;
        state.settings.owner     = name;
        saveState();
        showToast('Account created. Redirecting...');
        setTimeout(() => {
          window.location.href = 'pages/dashboard.html';
        }, 500);
      })
      .catch(err => {
        console.error(err);
        showToast(err.message || 'Could not create account.');
      });
  });

  document.querySelectorAll('[data-auth="google-register"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then(result => {
          const userFB = result.user;
          const uid    = userFB.uid;
          state.currentUserId = uid;
          const userLocal = {
            id: uid,
            email: userFB.email,
            name: userFB.displayName || 'Google User'
          };
          state.users = state.users.filter(u => u.id !== uid);
          state.users.push(userLocal);
          saveState();
          window.location.href = 'pages/dashboard.html';
        })
        .catch(err => {
          console.error(err);
          showToast(err.message || 'Google sign-up failed.');
        });
    });
  });
}

/********************************************
 * 6. DASHBOARD
 ********************************************/
function initDashboard() {
  const totalMilkEl = document.getElementById('stat-total-milk');
  if (!totalMilkEl) return;

  const todayISO = formatDateISO(new Date());

  const todaysMilk = state.milkEntries.filter(e => e.date === todayISO);
  const totalMilk  = todaysMilk.reduce((sum, e) => sum + Number(e.qty), 0);
  const farmersToday = new Set(todaysMilk.map(e => e.farmerId)).size;

  totalMilkEl.textContent = totalMilk.toFixed(2) + ' L';
  const fCountEl = document.getElementById('stat-total-farmers');
  if (fCountEl) fCountEl.textContent = farmersToday;

  const todaysPayments = state.payments.filter(p => p.date === todayISO);
  const received = todaysPayments
    .filter(p => p.partyType === 'customer')
    .reduce((s, p) => s + Number(p.amount), 0);
  const paid = todaysPayments
    .filter(p => p.partyType === 'farmer')
    .reduce((s, p) => s + Number(p.amount), 0);
  const pending = paid - received;

  const recEl = document.getElementById('stat-payments-received');
  const penEl = document.getElementById('stat-payments-pending');
  if (recEl) recEl.textContent = formatCurrency(received);
  if (penEl) penEl.textContent = formatCurrency(pending);

  const milkBody = document.querySelector('#table-latest-milk tbody');
  if (milkBody) {
    const latest = [...state.milkEntries]
      .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id))
      .slice(0, 10);
    milkBody.innerHTML = latest.map(e => {
      const f = state.farmers.find(x => x.id === e.farmerId);
      return `<tr>
        <td>${e.date}</td>
        <td>${f ? f.name : 'Farmer'}</td>
        <td>${e.shift}</td>
        <td>${Number(e.qty).toFixed(2)}</td>
        <td>${Number(e.rate).toFixed(2)}</td>
        <td>${Number(e.amount).toFixed(2)}</td>
      </tr>`;
    }).join('');
  }

  const payBody = document.querySelector('#table-latest-payments tbody');
  if (payBody) {
    const latest = [...state.payments]
      .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id))
      .slice(0, 10);
    payBody.innerHTML = latest.map(p => {
      let name = '';
      if (p.partyType === 'farmer') {
        const f = state.farmers.find(x => x.id === p.partyId);
        name = f ? f.name : 'Farmer';
      } else {
        const c = state.customers.find(x => x.id === p.partyId);
        name = c ? c.name : 'Customer';
      }
      const label = p.partyType === 'customer' ? 'Received' : 'Paid';
      return `<tr>
        <td>${p.date}</td>
        <td>${name}</td>
        <td>${label}</td>
        <td>${p.mode}</td>
        <td>${Number(p.amount).toFixed(2)}</td>
        <td>${p.notes || ''}</td>
      </tr>`;
    }).join('');
  }
}

/********************************************
 * 7. MILK COLLECTION PAGE
 ********************************************/
function initMilkCollection() {
  const form = document.getElementById('milk-entry-form');
  if (!form) return;

  const dateInput   = document.getElementById('milk-date-input');
  const farmerSelect = document.getElementById('milk-farmer');
  const qtyInput    = document.getElementById('milk-qty');
  const rateInput   = document.getElementById('milk-rate');
  const amountInput = document.getElementById('milk-amount');

  if (dateInput) dateInput.value = formatDateISO(new Date());

  if (farmerSelect) {
    if (state.farmers.length === 0) {
      farmerSelect.innerHTML = '<option value="">No farmers yet (add in Farmers)</option>';
    } else {
      farmerSelect.innerHTML = state.farmers
        .map(f => `<option value="${f.id}">${f.code || ''} ${f.name}</option>`).join('');
    }
  }

  function calcAmount() {
    const q = Number(qtyInput.value || 0);
    const r = Number(rateInput.value || 0);
    amountInput.value = (q * r).toFixed(2);
  }

  qtyInput.addEventListener('input', calcAmount);
  rateInput.addEventListener('input', calcAmount);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const entry = {
      id:       uid(),
      farmerId: farmerSelect.value,
      date:     dateInput.value,
      shift:    document.getElementById('milk-shift').value,
      qty:      Number(qtyInput.value || 0),
      rate:     Number(rateInput.value || 0),
      amount:   Number(amountInput.value || 0)
    };
    state.milkEntries.push(entry);
    saveState();
    showToast('Milk entry saved.');
    qtyInput.value    = '';
    amountInput.value = '';
    renderMilkTable();
    initDashboard();
  });

  function renderMilkTable() {
    const tbody = document.querySelector('#table-milk-entries tbody');
    if (!tbody) return;
    const selectedDate = dateInput.value;
    const rows = state.milkEntries
      .filter(e => e.date === selectedDate)
      .map(e => {
        const f = state.farmers.find(x => x.id === e.farmerId);
        return `<tr>
          <td>${e.date}</td>
          <td>${f ? f.name : 'Farmer'}</td>
          <td>${e.shift}</td>
          <td>${Number(e.qty).toFixed(2)}</td>
          <td>${Number(e.rate).toFixed(2)}</td>
          <td>${Number(e.amount).toFixed(2)}</td>
        </tr>`;
      }).join('');
    tbody.innerHTML = rows;
  }

  renderMilkTable();
}

/********************************************
 * 8. PAYMENTS PAGE
 ********************************************/
function initPaymentsPage() {
  const form = document.getElementById('payment-entry-form');
  if (!form) return;

  const dateInput = document.getElementById('payment-date-input');
  if (dateInput) dateInput.value = formatDateISO(new Date());

  const partyTypeSelect = document.getElementById('payment-party-type');
  const partySelect     = document.getElementById('payment-party');

  function refreshPartyOptions() {
    const type = partyTypeSelect.value;
    if (type === 'farmer') {
      if (state.farmers.length === 0) {
        partySelect.innerHTML = '<option value="">No farmers yet</option>';
      } else {
        partySelect.innerHTML = state.farmers
          .map(f => `<option value="${f.id}">${f.code || ''} ${f.name}</option>`).join('');
      }
    } else {
      if (state.customers.length === 0) {
        partySelect.innerHTML = '<option value="">No customers yet</option>';
      } else {
        partySelect.innerHTML = state.customers
          .map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      }
    }
  }

  partyTypeSelect.addEventListener('change', refreshPartyOptions);
  refreshPartyOptions();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payment = {
      id:       uid(),
      date:     dateInput.value,
      partyType: partyTypeSelect.value,
      partyId:  partySelect.value,
      mode:     document.getElementById('payment-mode').value,
      amount:   Number(document.getElementById('payment-amount').value || 0),
      notes:    document.getElementById('payment-notes').value.trim()
    };
    state.payments.push(payment);
    saveState();
    showToast('Payment recorded.');
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-notes').value  = '';
    renderPaymentsTable();
    initDashboard();
  });

  function renderPaymentsTable() {
    const tbody = document.querySelector('#table-payments tbody');
    if (!tbody) return;
    const rows = [...state.payments]
      .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id))
      .slice(0, 50)
      .map(p => {
        let name = '';
        if (p.partyType === 'farmer') {
          const f = state.farmers.find(x => x.id === p.partyId);
          name = f ? f.name : 'Farmer';
        } else {
          const c = state.customers.find(x => x.id === p.partyId);
          name = c ? c.name : 'Customer';
        }
        const label = p.partyType === 'customer' ? 'Received' : 'Paid';
        return `<tr>
          <td>${p.date}</td>
          <td>${name}</td>
          <td>${label}</td>
          <td>${p.mode}</td>
          <td>${Number(p.amount).toFixed(2)}</td>
          <td>${p.notes || ''}</td>
        </tr>`;
      }).join('');
    tbody.innerHTML = rows;
  }

  renderPaymentsTable();
}

/********************************************
 * 9. FARMERS PAGE
 ********************************************/
function initFarmersPage() {
  const form = document.getElementById('farmer-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const farmer = {
      id:      uid(),
      code:    document.getElementById('farmer-code').value.trim(),
      name:    document.getElementById('farmer-name').value.trim(),
      phone:   document.getElementById('farmer-phone').value.trim(),
      address: document.getElementById('farmer-address').value.trim()
    };
    state.farmers.push(farmer);
    saveState();
    showToast('Farmer added.');
    form.reset();
    renderFarmers();
  });

  function renderFarmers() {
    const tbody = document.querySelector('#table-farmers tbody');
    if (!tbody) return;
    tbody.innerHTML = state.farmers.map(f => `
      <tr>
        <td>${f.code}</td>
        <td>${f.name}</td>
        <td>${f.phone}</td>
        <td>${f.address}</td>
      </tr>
    `).join('');
  }

  renderFarmers();
}

/********************************************
 * 10. CUSTOMERS PAGE
 ********************************************/
function initCustomersPage() {
  const form = document.getElementById('customer-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const customer = {
      id:      uid(),
      name:    document.getElementById('customer-name').value.trim(),
      phone:   document.getElementById('customer-phone').value.trim(),
      address: document.getElementById('customer-address').value.trim()
    };
    state.customers.push(customer);
    saveState();
    showToast('Customer added.');
    form.reset();
    renderCustomers();
  });

  function renderCustomers() {
    const tbody = document.querySelector('#table-customers tbody');
    if (!tbody) return;
    tbody.innerHTML = state.customers.map(c => `
      <tr>
        <td>${c.name}</td>
        <td>${c.phone}</td>
        <td>${c.address}</td>
      </tr>
    `).join('');
  }

  renderCustomers();
}

/********************************************
 * 11. EXPORT CSV (optional)
 ********************************************/
function exportCSV(rows, filename) {
  if (!rows || rows.length === 0) {
    showToast('No data to export.');
    return;
  }
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(','),
    ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Exported ' + rows.length + ' rows.');
}

/********************************************
 * 12. INIT ON LOAD
 ********************************************/
document.addEventListener('DOMContentLoaded', () => {
  requireAuthOnAppPages();
  initSidebarUser();
  initLogout();

  initLandingLogin();
  initLoginPage();
  initRegisterPage();
  initDashboard();
  initMilkCollection();
  initPaymentsPage();
  initFarmersPage();
  initCustomersPage();
});