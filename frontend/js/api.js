/**
 * Smart Parking Management System — Centralized API Client
 * Plain Vanilla JS HTTP client handling headers, authentication, and error normalization.
 */

async function apiRequest(path, options = {}, maybeBody = null) {
  const baseUrl = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : (window.API_BASE_URL || 'http://localhost:5000/api')).replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http://') || path.startsWith('https://') ? path : `${baseUrl}${cleanPath}`;

  let opts = {};
  if (typeof options === 'string') {
    opts.method = options.toUpperCase();
    if (maybeBody !== null && maybeBody !== undefined) {
      opts.body = typeof maybeBody === 'string' ? maybeBody : JSON.stringify(maybeBody);
    }
  } else if (options && typeof options === 'object') {
    opts = { ...options };
    if (opts.body && typeof opts.body === 'object') {
      opts.body = JSON.stringify(opts.body);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };

  const token = localStorage.getItem('sp_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...opts,
    headers
  };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    throw new Error('Network error. Unable to reach server. Please ensure backend is running.');
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseError) {
      data = null;
    }
  }

  if (!response.ok) {
    // 401 Unauthorized handling: clear storage and redirect to login
    if (response.status === 401) {
      localStorage.removeItem('sp_token');
      localStorage.removeItem('sp_user');

      const siteRoot = (typeof window !== 'undefined' && window.SITE_ROOT) ? window.SITE_ROOT : '';
      const loginUrl = siteRoot + 'pages/login.html';
      if (!window.location.href.includes('login.html')) {
        window.location.href = loginUrl;
      }
    }

    // Extract error message: data.message or first data.errors[].message
    let errorMessage = 'An unexpected error occurred.';
    if (data) {
      if (data.message) {
        errorMessage = data.message;
      } else if (Array.isArray(data.errors) && data.errors.length > 0) {
        errorMessage = data.errors[0].message || data.errors[0].msg || errorMessage;
      }
    } else {
      errorMessage = `Request failed with status ${response.status}`;
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

if (typeof window !== 'undefined') {
  window.apiRequest = apiRequest;
}
