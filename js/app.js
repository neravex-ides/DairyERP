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
const STORAGE_KEY = 'dairyERP';

const defaultData = {
  users: [],
  currentUserId: null,
  farmers: [],
  customers: [],
  milkEntries: [],
  sales: [],
  feedStock: [],
  feedIssues: [],
  payments: [],
  settings: {
    dairyName: '',
    owner: '',
    phone: '',
    address: '',
    defaultMilkRate: 0,
    language: 'en'
  }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);
    const parsed = JSON.parse(raw);
    return Object.assign(structuredClone(defaultData), parsed);
  } catch (e) {
    console.error('Error loading state', e);
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

/********************************************
 * 4. AUTH HELPERS
 ********************************************/
function getCurrentUser() {
  if (!state.currentUserId) return null;
  return state.users.find(u => u.id === state.currentUserId) || null;
}

function requireAuthOnAppPages() {
  const path = window.location.pathname;
  const isAppPage = path.includes('/pages/');
  const isAuthPage =
    path.endsWith('login.html') ||
    path.endsWith('register.html') ||
    path.endsWith('/index.html') ||
    path.endsWith('/') ||
    path === '';

  if (isAppPage && !getCurrentUser()) {
    window.location.href = '../login.html';
  }

  if (!isAppPage && isAuthPage && getCurrentUser()) {
    window.location.href = 'pages/dashboard.html';
  }
}

function initSidebarUser() {
  const user = getCurrentUser();
  const nameEl   = document.getElementById('sidebar-user-name');
  const roleEl   = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (!user || !nameEl || !roleEl || !avatarEl) return;

  nameEl.textContent = user.name || 'Dairy User';
  roleEl.textContent = 'Admin';

  const initials = (user.name || 'D E')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  avatarEl.textContent = initials;
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

// Landing page – email लेकर login पर भेजो + Google login
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
          const uidFB  = userFB.uid;
          state.currentUserId = uidFB;
          return db.collection('users').doc(uidFB).set({
            name:      userFB.displayName || 'Google User',
            dairyName: 'My Dairy',
            email:     userFB.email,
            type:      'both',
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true }).then(() => userFB);
        })
        .then(userFB => {
          const uidFB = userFB.uid;
          const userLocal = {
            id:        uidFB,
            name:      userFB.displayName || 'Google User',
            dairyName: 'My Dairy',
            email:     userFB.email,
            password:  '',
            type:      'both'
          };
          state.users = state.users.filter(u => u.id !== uidFB);
          state.users.push(userLocal);
          state.settings.dairyName = 'My Dairy';
          state.settings.owner     = userLocal.name;
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
    forgot.style.cursor = 'pointer';
    forgot.addEventListener('click', () => {
      showToast('Use the main login page to reset password.');
    });
  }
}

// Login page – Email + Google + reset
function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const prefillEmail = params.get('email');
  if (prefillEmail) {
    const emailInput = document.getElementById('login-email');
    if (emailInput) emailInput.value = prefillEmail;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
        const uidFB = cred.user.uid;
        state.currentUserId = uidFB;
        return db.collection('users').doc(uidFB).get();
      })
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          const userLocal = {
            id:        doc.id,
            name:      data.name      || 'Dairy User',
            dairyName: data.dairyName || '',
            email:     data.email     || '',
            password:  '',
            type:      data.type      || 'both'
          };
          state.users = state.users.filter(u => u.id !== doc.id);
          state.users.push(userLocal);
          state.settings.dairyName = data.dairyName || state.settings.dairyName;
          state.settings.owner     = data.name      || state.settings.owner;
          saveState();
        }
        window.location.href = 'pages/dashboard.html';
      })
      .catch(err => {
        console.error(err);
        showToast(err.message || 'Login failed.');
      });
  });

  document.querySelectorAll('[data-auth="google-login"]').forEach(btn => {
  btn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    console.log('[Google] Starting signInWithPopup...');
    auth.signInWithPopup(provider)
      .then(result => {
        console.log('[Google] Popup result:', result);
        const userFB = result.user;
        const uidFB  = userFB.uid;
        state.currentUserId = uidFB;
        return db.collection('users').doc(uidFB).set({
          name:      userFB.displayName || 'Google User',
          dairyName: 'My Dairy',
          email:     userFB.email,
          type:      'both',
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => userFB);
      })
      .then(userFB => {
        console.log('[Google] After Firestore save, redirecting...', userFB);
        const uidFB = userFB.uid;
        const userLocal = {
          id:        uidFB,
          name:      userFB.displayName || 'Google User',
          dairyName: 'My Dairy',
          email:     userFB.email,
          password:  '',
          type:      'both'
        };
        state.users = state.users.filter(u => u.id !== uidFB);
        state.users.push(userLocal);
        state.settings.dairyName = 'My Dairy';
        state.settings.owner     = userLocal.name;
        saveState();
        window.location.href = 'pages/dashboard.html';
      })
      .catch(err => {
        console.error('[Google] Error:', err);
        showToast(err.message || 'Google sign-in failed.');
      });
  });
});
  

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

// Register page – Email + Google
function initRegisterPage() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name      = document.getElementById('reg-name').value.trim();
    const dairyName = document.getElementById('reg-dairy-name').value.trim();
    const email     = document.getElementById('reg-email').value.trim().toLowerCase();
    const password  = document.getElementById('reg-password').value;
    const type      = document.getElementById('reg-type').value;

    auth.createUserWithEmailAndPassword(email, password)
      .then(cred => {
        const uidFB = cred.user.uid;
        return db.collection('users').doc(uidFB).set({
          name,
          dairyName,
          email,
          type,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => uidFB);
      })
      .then(uidFB => {
        const user = {
          id:        uidFB,
          name,
          dairyName,
          email,
          password: '',
          type
        };
        state.users = state.users.filter(u => u.id !== uidFB);
        state.users.push(user);
        state.currentUserId     = uidFB;
        state.settings.dairyName = dairyName;
        state.settings.owner     = name;
        saveState();

        showToast('Account created. Redirecting...');
        setTimeout(() => {
          window.location.href = 'pages/dashboard.html';
        }, 800);
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
          const uidFB  = userFB.uid;
          return db.collection('users').doc(uidFB).set({
            name:      userFB.displayName || 'Google User',
            dairyName: 'My Dairy',
            email:     userFB.email,
            type:      'both',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true }).then(() => userFB);
        })
        .then(userFB => {
          const uidFB = userFB.uid;
          const userLocal = {
            id:        uidFB,
            name:      userFB.displayName || 'Google User',
            dairyName: 'My Dairy',
            email:     userFB.email,
            password:  '',
            type:      'both'
          };
          state.users = state.users.filter(u => u.id !== uidFB);
          state.users.push(userLocal);
          state.currentUserId     = uidFB;
          state.settings.dairyName = 'My Dairy';
          state.settings.owner     = userLocal.name;
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
  const dateLabel = document.getElementById('dash-date');
  if (dateLabel) dateLabel.textContent = todayISO;

  const todaysMilk = state.milkEntries.filter(e => e.date === todayISO);
  const totalMilk  = todaysMilk.reduce((sum, e) => sum + Number(e.qty), 0);
  const farmersToday = new Set(todaysMilk.map(e => e.farmerId)).size;

  totalMilkEl.textContent = totalMilk.toFixed(2) + ' L';
  const fCountEl = document.getElementById('stat-total-farmers');
  if (fCountEl) fCountEl.textContent = farmersToday;

  const totalKhalIn  = state.feedStock.filter(f => f.type === 'Khal' ).reduce((s, f) => s + Number(f.qty), 0);
  const totalChuriIn = state.feedStock.filter(f => f.type === 'Churi').reduce((s, f) => s + Number(f.qty), 0);
  const totalKhalOut  = state.feedIssues.filter(f => f.type === 'Khal' ).reduce((s, f) => s + Number(f.qty), 0);
  const totalChuriOut = state.feedIssues.filter(f => f.type === 'Churi').reduce((s, f) => s + Number(f.qty), 0);

  const stockTotal = (totalKhalIn - totalKhalOut) + (totalChuriIn - totalChuriOut);
  const todaysFeedIssues = state.feedIssues.filter(i => i.date === todayISO);
  const todaysFeedQty    = todaysFeedIssues.reduce((s, i) => s + Number(i.qty), 0);

  const feedTodayEl = document.getElementById('stat-total-feed');
  const feedStockEl = document.getElementById('stat-feed-stock');
  if (feedTodayEl) feedTodayEl.textContent = todaysFeedQty.toFixed(2) + ' kg';
  if (feedStockEl) feedStockEl.textContent = stockTotal.toFixed(2);

  const todaysPayments = state.payments.filter(p => p.date === todayISO);
  const received = todaysPayments.filter(p => p.partyType === 'customer').reduce((s, p) => s + Number(p.amount), 0);
  const paid     = todaysPayments.filter(p => p.partyType === 'farmer').reduce((s, p) => s + Number(p.amount), 0);
  const pendingApprox = paid - received;

  const recEl = document.getElementById('stat-payments-received');
  const penEl = document.getElementById('stat-payments-pending');
  if (recEl) recEl.textContent = formatCurrency(received);
  if (penEl) penEl.textContent = formatCurrency(pendingApprox);

  const tableMilkBody = document.querySelector('#table-latest-milk tbody');
  if (tableMilkBody) {
    const latestMilk = [...state.milkEntries]
      .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id))
      .slice(0, 10);
    tableMilkBody.innerHTML = latestMilk.map(e => {
      const farmer = state.farmers.find(f => f.id === e.farmerId);
      return `<tr>
        <td>${e.date}</td>
        <td>${farmer ? farmer.name : 'Unknown'}</td>
        <td>${e.shift}</td>
        <td>${Number(e.qty).toFixed(2)}</td>
        <td>${Number(e.rate).toFixed(2)}</td>
        <td>${Number(e.amount).toFixed(2)}</td>
      </tr>`;
    }).join('');
  }

  const tablePayBody = document.querySelector('#table-latest-payments tbody');
  if (tablePayBody) {
    const latestPay = [...state.payments]
      .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id))
      .slice(0, 10);
    tablePayBody.innerHTML = latestPay.map(p => {
      let name = '';
      if (p.partyType === 'farmer') {
        const f = state.farmers.find(f => f.id === p.partyId);
        name = f ? f.name : 'Farmer';
      } else {
        const c = state.customers.find(c => c.id === p.partyId);
        name = c ? c.name : 'Customer';
      }
      const tagClass = p.partyType === 'customer' ? 'green' : 'red';
      const tagLabel = p.partyType === 'customer' ? 'Received' : 'Paid';
      return `<tr>
        <td>${p.date}</td>
        <td>${name}</td>
        <td><span class="tag ${tagClass}">${tagLabel}</span></td>
        <td>${p.mode}</td>
        <td>${Number(p.amount).toFixed(2)}</td>
        <td>${p.notes || ''}</td>
      </tr>`;
    }).join('');
  }

  document.getElementById('btn-export-milk')?.addEventListener('click', () => {
    exportCSV(state.milkEntries, 'milk-entries.csv');
  });
  document.getElementById('btn-export-payments')?.addEventListener('click', () => {
    exportCSV(state.payments, 'payments.csv');
  });
}

/********************************************
 * 7. MILK
 ********************************************/
function initMilkCollection() {
  const form = document.getElementById('milk-entry-form');
  if (!form) return;

  const dateLabel = document.getElementById('milk-date');
  if (dateLabel) dateLabel.textContent = formatDateISO(new Date());

  const dateInput = document.getElementById('milk-date-input');
  if (dateInput) dateInput.value = formatDateISO(new Date());

  const farmerSelect = document.getElementById('milk-farmer');
  if (farmerSelect) {
    if (state.farmers.length === 0) {
      farmerSelect.innerHTML = '<option value="">No farmers yet (add in Farmers)</option>';
    } else {
      farmerSelect.innerHTML = state.farmers
        .map(f => `<option value="${f.id}">${f.code || ''} ${f.name}</option>`).join('');
    }
  }

  const qtyInput    = document.getElementById('milk-qty');
  const rateInput   = document.getElementById('milk-rate');
  const amountInput = document.getElementById('milk-amount');
  const autoBtn     = document.getElementById('milk-auto-amount');

  if (state.settings.defaultMilkRate && rateInput) {
    rateInput.value = state.settings.defaultMilkRate;
  }

  function calcAmount() {
    const q = Number(qtyInput.value || 0);
    const r = Number(rateInput.value || 0);
    amountInput.value = (q * r).toFixed(2);
  }

  qtyInput.addEventListener('input', calcAmount);
  rateInput.addEventListener('input', calcAmount);
  if (autoBtn) autoBtn.addEventListener('click', calcAmount);

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

  document.getElementById('btn-filter-today')?.addEventListener('click', () => {
    dateInput.value = formatDateISO(new Date());
    renderMilkTable();
  });

  dateInput.addEventListener('change', renderMilkTable);

  function renderMilkTable() {
    const tbody = document.querySelector('#table-milk-entries tbody');
    if (!tbody) return;
    const selectedDate = dateInput.value;
    const rows = state.milkEntries
      .filter(e => e.date === selectedDate)
      .map(e => {
        const farmer = state.farmers.find(f => f.id === e.farmerId);
        return `<tr>
          <td>${e.date}</td>
          <td>${farmer ? farmer.name : 'Unknown'}</td>
          <td>${e.shift}</td>
          <td>${Number(e.qty).toFixed(2)}</td>
          <td>${Number(e.rate).toFixed(2)}</td>
          <td>${Number(e.amount).toFixed(2)}</td>
          <td><button data-id="${e.id}" class="btn-outline btn-delete-milk" style="font-size:11px;">Delete</button></td>
        </tr>`;
      }).join('');
    tbody.innerHTML = rows;

    document.querySelectorAll('.btn-delete-milk').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        state.milkEntries = state.milkEntries.filter(e => e.id !== id);
        saveState();
        renderMilkTable();
        initDashboard();
        showToast('Entry deleted.');
      });
    });
  }

  renderMilkTable();

  document.getElementById('btn-export-milk-all')?.addEventListener('click', () => {
    exportCSV(state.milkEntries, 'milk-entries-all.csv');
  });
}

/********************************************
 * 8. SALES
 ********************************************/
function initSalesPage() {
  const form = document.getElementById('sales-entry-form');
  if (!form) return;

  const dateLabel = document.getElementById('sales-date');
  if (dateLabel) dateLabel.textContent = formatDateISO(new Date());

  const dateInput = document.getElementById('sales-date-input');
  if (dateInput) dateInput.value = formatDateISO(new Date());

  const custSelect = document.getElementById('sales-customer');
  if (state.customers.length === 0) {
    custSelect.innerHTML = '<option value="">No customers yet (add in Customers)</option>';
  } else {
    custSelect.innerHTML = state.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  const qty    = document.getElementById('sales-qty');
  const rate   = document.getElementById('sales-rate');
  const amount = document.getElementById('sales-amount');
  const autoBtn = document.getElementById('sales-auto-amount');

  if (state.settings.defaultMilkRate && rate) {
    rate.value = state.settings.defaultMilkRate;
  }

  function calcAmount() {
    amount.value = (Number(qty.value || 0) * Number(rate.value || 0)).toFixed(2);
  }

  qty.addEventListener('input', calcAmount);
  rate.addEventListener('input', calcAmount);
  if (autoBtn) autoBtn.addEventListener('click', calcAmount);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const sale = {
      id:         uid(),
      date:       dateInput.value,
      customerId: custSelect.value,
      qty:        Number(qty.value || 0),
      rate:       Number(rate.value || 0),
      amount:     Number(amount.value || 0)
    };
    state.sales.push(sale);
    saveState();
    showToast('Sale saved.');
    qty.value    = '';
    amount.value = '';
    renderSalesTable();
  });

  function renderSalesTable() {
    const tbody = document.querySelector('#table-sales tbody');
    if (!tbody) return;
    const rows = [...state.sales]
      .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id))
      .slice(0, 50)
      .map(s => {
        const c = state.customers.find(cu => cu.id === s.customerId);
        return `<tr>
          <td>${s.date}</td>
          <td>${c ? c.name : 'Customer'}</td>
          <td>${Number(s.qty).toFixed(2)}</td>
          <td>${Number(s.rate).toFixed(2)}</td>
          <td>${Number(s.amount).toFixed(2)}</td>
          <td></td>
        </tr>`;
      }).join('');
    tbody.innerHTML = rows;
  }

  renderSalesTable();

  document.getElementById('btn-export-sales-all')?.addEventListener('click', () => {
    exportCSV(state.sales, 'sales-all.csv');
  });
}

/********************************************
 * 9. FEED
 ********************************************/
function initFeedPage() {
  const stockForm = document.getElementById('feed-stock-form');
  if (!stockForm) return;

  const dateLabel = document.getElementById('feed-date');
  if (dateLabel) dateLabel.textContent = formatDateISO(new Date());

  const stockDate = document.getElementById('feed-date-input');
  if (stockDate) stockDate.value = formatDateISO(new Date());

  const issueForm = document.getElementById('feed-issue-form');
  const issueDate = document.getElementById('feed-issue-date');
  if (issueDate) issueDate.value = formatDateISO(new Date());

  const issueFarmerSelect = document.getElementById('feed-issue-farmer');
  if (state.farmers.length === 0) {
    issueFarmerSelect.innerHTML = '<option value="">No farmers yet</option>';
  } else {
    issueFarmerSelect.innerHTML = state.farmers
      .map(f => `<option value="${f.id}">${f.code || ''} ${f.name}</option>`).join('');
  }

  stockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const item = {
      id:   uid(),
      type: document.getElementById('feed-type').value,
      qty:  Number(document.getElementById('feed-qty').value || 0),
      date: stockDate.value
    };
    state.feedStock.push(item);
    saveState();
    showToast('Stock added.');
    document.getElementById('feed-qty').value = '';
    renderFeedStock();
  });

  issueForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const issue = {
      id:       uid(),
      farmerId: issueFarmerSelect.value,
      type:     document.getElementById('feed-issue-type').value,
      qty:      Number(document.getElementById('feed-issue-qty').value || 0),
      date:     issueDate.value
    };
    state.feedIssues.push(issue);
    saveState();
    showToast('Feed issued.');
    document.getElementById('feed-issue-qty').value = '';
    renderFeedStock();
    renderFeedIssues();
    initDashboard();
  });

  function renderFeedStock() {
    const totalKhalIn  = state.feedStock.filter(f => f.type === 'Khal' ).reduce((s, f) => s + Number(f.qty), 0);
    const totalChuriIn = state.feedStock.filter(f => f.type === 'Churi').reduce((s, f) => s + Number(f.qty), 0);
    const totalKhalOut  = state.feedIssues.filter(f => f.type === 'Khal' ).reduce((s, f) => s + Number(f.qty), 0);
    const totalChuriOut = state.feedIssues.filter(f => f.type === 'Churi').reduce((s, f) => s + Number(f.qty), 0);

    const stockKhal  = totalKhalIn  - totalKhalOut;
    const stockChuri = totalChuriIn - totalChuriOut;

    const khalEl  = document.getElementById('stock-khal');
    const churiEl = document.getElementById('stock-churi');
    if (khalEl)  khalEl.textContent  = stockKhal.toFixed(2);
    if (churiEl) churiEl.textContent = stockChuri.toFixed(2);
  }

  function renderFeedIssues() {
    const tbody = document.querySelector('#table-feed-issues tbody');
    if (!tbody) return;
    const rows = [...state.feedIssues]
      .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id))
      .slice(0, 50)
      .map(i => {
        const f = state.farmers.find(f => f.id === i.farmerId);
        return `<tr>
          <td>${i.date}</td>
          <td>${f ? f.name : 'Farmer'}</td>
          <td>${i.type}</td>
          <td>${Number(i.qty).toFixed(2)}</td>
        </tr>`;
      }).join('');
    tbody.innerHTML = rows;
  }

  renderFeedStock();
  renderFeedIssues();
}

/********************************************
 * 10. PAYMENTS
 ********************************************/
function initPaymentsPage() {
  const form = document.getElementById('payment-entry-form');
  if (!form) return;

  const dateLabel = document.getElementById('payments-date');
  if (dateLabel) dateLabel.textContent = formatDateISO(new Date());
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
      .slice(0, 100)
      .map(p => {
        let name = '';
        if (p.partyType === 'farmer') {
          const f = state.farmers.find(f => f.id === p.partyId);
          name = f ? f.name : 'Farmer';
        } else {
          const c = state.customers.find(c => c.id === p.partyId);
          name = c ? c.name : 'Customer';
        }
        const tagClass = p.partyType === 'customer' ? 'green' : 'red';
        const tagLabel = p.partyType === 'customer' ? 'Received' : 'Paid';
        return `<tr>
          <td>${p.date}</td>
          <td>${name}</td>
          <td><span class="tag ${tagClass}">${tagLabel}</span></td>
          <td>${p.mode}</td>
          <td>${Number(p.amount).toFixed(2)}</td>
          <td>${p.notes || ''}</td>
        </tr>`;
      }).join('');
    tbody.innerHTML = rows;
  }

  renderPaymentsTable();

  document.getElementById('btn-export-payments-all')?.addEventListener('click', () => {
    exportCSV(state.payments, 'payments-all.csv');
  });
}

/********************************************
 * 11. REPORTS
 ********************************************/
function initReportsPage() {
  const milkForm = document.getElementById('report-milk-form');
  if (!milkForm) return;

  const fromMilk = document.getElementById('report-milk-from');
  const toMilk   = document.getElementById('report-milk-to');
  const fromPay  = document.getElementById('report-pay-from');
  const toPay    = document.getElementById('report-pay-to');

  const today = formatDateISO(new Date());
  fromMilk.value = today;
  toMilk.value   = today;
  fromPay.value  = today;
  toPay.value    = today;

  const farmerSelect = document.getElementById('report-milk-farmer');
  farmerSelect.innerHTML = '<option value="">All farmers</option>' +
    state.farmers.map(f => `<option value="${f.id}">${f.code || ''} ${f.name}</option>`).join('');

  document.getElementById('btn-report-milk-export').addEventListener('click', () => {
    const from = fromMilk.value;
    const to   = toMilk.value;
    const farmerId = farmerSelect.value;
    const filtered = state.milkEntries.filter(e => {
      return e.date >= from && e.date <= to && (!farmerId || e.farmerId === farmerId);
    });
    exportCSV(filtered, 'milk-report.csv');
  });

  document.getElementById('btn-report-payments-export').addEventListener('click', () => {
    const from = fromPay.value;
    const to   = toPay.value;
    const filtered = state.payments.filter(p => p.date >= from && p.date <= to);
    exportCSV(filtered, 'payments-report.csv');
  });
}

/********************************************
 * 12. SETTINGS
 ********************************************/
function initSettingsPage() {
  const dairyForm = document.getElementById('settings-dairy-form');
  if (!dairyForm) return;

  const d = state.settings;
  document.getElementById('set-dairy-name').value    = d.dairyName || '';
  document.getElementById('set-dairy-owner').value   = d.owner     || '';
  document.getElementById('set-dairy-phone').value   = d.phone     || '';
  document.getElementById('set-dairy-address').value = d.address   || '';

  dairyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.settings.dairyName = document.getElementById('set-dairy-name').value;
    state.settings.owner     = document.getElementById('set-dairy-owner').value;
    state.settings.phone     = document.getElementById('set-dairy-phone').value;
    state.settings.address   = document.getElementById('set-dairy-address').value;
    saveState();
    showToast('Dairy profile saved.');
  });

  const defForm = document.getElementById('settings-defaults-form');
  document.getElementById('set-default-milk-rate').value = d.defaultMilkRate || '';
  document.getElementById('set-default-language').value  = d.language       || 'en';

  defForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.settings.defaultMilkRate = Number(document.getElementById('set-default-milk-rate').value || 0);
    state.settings.language        = document.getElementById('set-default-language').value;
    saveState();
    showToast('Defaults saved.');
  });
}

/********************************************
 * 13. FARMERS
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
    const rows = state.farmers.map(f => `
      <tr>
        <td>${f.code}</td>
        <td>${f.name}</td>
        <td>${f.phone}</td>
        <td>${f.address}</td>
      </tr>
    `).join('');
    tbody.innerHTML = rows;
  }

  renderFarmers();
}

/********************************************
 * 14. CUSTOMERS
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
    const rows = state.customers.map(c => `
      <tr>
        <td>${c.name}</td>
        <td>${c.phone}</td>
        <td>${c.address}</td>
      </tr>
    `).join('');
    tbody.innerHTML = rows;
  }

  renderCustomers();
}

/********************************************
 * 15. EXPORT CSV
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
 * 16. INIT ON LOAD
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
  initSalesPage();
  initFeedPage();
  initPaymentsPage();
  initReportsPage();
  initSettingsPage();
  initFarmersPage();
  initCustomersPage();
});