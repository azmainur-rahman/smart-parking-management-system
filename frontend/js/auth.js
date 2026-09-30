/**
 * Smart Parking Management System — Authentication Utilities
 * Manages token storage, user session state, and navigation guards.
 */

const SP_TOKEN_KEY = 'sp_token';
const SP_USER_KEY = 'sp_user';

/**
 * Retrieve current JWT token from local storage.
 * @returns {string|null}
 */
function getToken() {
  return localStorage.getItem(SP_TOKEN_KEY);
}

/**
 * Retrieve current user object from local storage.
 * @returns {object|null}
 */
function getUser() {
  const raw = localStorage.getItem(SP_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Check if a valid session exists in storage.
 * @returns {boolean}
 */
function isLoggedIn() {
  return Boolean(getToken());
}

/**
 * Internal helper to persist token and user session data.
 * @param {string} token
 * @param {object} user
 */
function saveSession(token, user) {
  if (token) {
    localStorage.setItem(SP_TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(SP_USER_KEY, JSON.stringify(user));
  }
}

/**
 * Authenticate user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>}
 */
async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (data && data.token && data.user) {
    saveSession(data.token, data.user);
  }

  return data;
}

/**
 * Register a new customer user.
 * Note: Never send a role field to the backend.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} [params.phone]
 * @param {string} params.password
 * @returns {Promise<object>}
 */
async function register({ name, email, phone, password }) {
  const payload = {
    name: name ? name.trim() : '',
    email: email ? email.trim() : '',
    password
  };

  if (phone && phone.trim()) {
    payload.phone = phone.trim();
  }

  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (data && data.token && data.user) {
    saveSession(data.token, data.user);
  }

  return data;
}

/**
 * Terminate user session and clear storage.
 */
async function logout() {
  try {
    if (isLoggedIn()) {
      await apiRequest('/auth/logout', { method: 'POST' });
    }
  } catch (err) {
    // Non-blocking: continue local logout even if server endpoint fails
    console.warn('[Auth] Server logout notification error:', err.message);
  } finally {
    localStorage.removeItem(SP_TOKEN_KEY);
    localStorage.removeItem(SP_USER_KEY);

    const siteRoot = (typeof window !== 'undefined' && window.SITE_ROOT) ? window.SITE_ROOT : '';
    window.location.href = siteRoot + 'pages/login.html';
  }
}

/**
 * Route protection guard. Redirects to login.html if unauthenticated.
 * @returns {boolean}
 */
function requireLogin() {
  if (!isLoggedIn()) {
    const siteRoot = (typeof window !== 'undefined' && window.SITE_ROOT) ? window.SITE_ROOT : '';
    if (!window.location.pathname.includes('login.html')) {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      window.location.href = siteRoot + 'pages/login.html?next=' + encodeURIComponent(currentPath);
    }
    return false;
  }
  return true;
}

// Global browser scope registration
if (typeof window !== 'undefined') {
  window.getToken = getToken;
  window.getUser = getUser;
  window.isLoggedIn = isLoggedIn;
  window.login = login;
  window.register = register;
  window.logout = logout;
  window.requireLogin = requireLogin;
}
