/**
 * Smart Parking Management System — Configuration
 * Single source of truth for API endpoints and root path resolution across the frontend application.
 */

// Set your deployed Vercel backend URL
const PRODUCTION_BACKEND_URL = "https://smart-parking-backend-smoky.vercel.app";

const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? "http://localhost:5000/api"
  : `${PRODUCTION_BACKEND_URL}/api`;

let SITE_ROOT = '/';
if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
  SITE_ROOT = document.currentScript.src.replace(/js\/config\.js(\?.*)?$/i, '');
  if (!SITE_ROOT.endsWith('/')) {
    SITE_ROOT += '/';
  }
}

if (typeof window !== 'undefined') {
  window.API_BASE_URL = API_BASE_URL;
  window.SITE_ROOT = SITE_ROOT;
}
