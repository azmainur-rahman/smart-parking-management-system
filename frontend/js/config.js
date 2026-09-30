/**
 * Smart Parking Management System — Configuration
 * Single source of truth for API endpoints and root path resolution across the frontend application.
 */

// change for production
const API_BASE_URL = "http://localhost:5000/api";

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
