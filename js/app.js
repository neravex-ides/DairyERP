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
 * 2. LOCAL STATE (केवल current user)
 ********************************************/
const STORAGE_KEY = 'dairyERP_MINI';

const defaultData = {
  users: [],         // {id,email,name}
  currentUserId: null
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
  if (roleEl) roleEl.textContent = 'Logged in';
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
 * 5. LANDING PAGE – सिर्फ redirect logic
 ********************************************/
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
    forgot.style.cursor = 'pointer';
    forgot.addEventListener('click', () => {
      showToast('Use main login page to reset password.');
    });
  }
}

/********************************************
 * 6. LOGIN PAGE – Email + Google + Forgot
 ********************************************/
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

  // Google login – SIMPLE redirect, कोई Firestore नहीं
  document.querySelectorAll('[data-auth="google-login"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      console.log('[Google] Starting signInWithPopup...');
      auth.signInWithPopup(provider)
        .then(result => {
          console.log('[Google] Popup result:', result);
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
          console.log('[Google] Redirecting to dashboard.html');
          window.location.href = 'pages/dashboard.html';
        })
        .catch(err => {
          console.error('[Google] Error:', err);
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

/********************************************
 * 7. REGISTER PAGE – Email + Google
 ********************************************/
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
 * 8. DASHBOARD INIT (सिर्फ welcome text)
 ********************************************/
function initDashboard() {
  const user = getCurrentUser();
  const main = document.querySelector('.app-main');
  if (!main || !user) return;
  const h = main.querySelector('h1');
  if (h) h.textContent = `Welcome, ${user.name || 'DairyERP user'}`;
}

/********************************************
 * 9. INIT ON LOAD
 ********************************************/
document.addEventListener('DOMContentLoaded', () => {
  requireAuthOnAppPages();
  initSidebarUser();
  initLogout();

  initLandingLogin();
  initLoginPage();
  initRegisterPage();
  initDashboard();
});