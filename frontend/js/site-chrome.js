/**
 * Smart Parking Management System — Shared Public Site Chrome
 * Renders consistent header and footer into #site-header and #site-footer placeholders.
 * Pure Vanilla JS, zero dependencies, tokens only, mobile-first accessible.
 */

function renderSiteChrome(activeKey = '') {
  const siteRoot = (typeof window !== 'undefined' && window.SITE_ROOT) ? window.SITE_ROOT : '../';
  const homeUrl = `${siteRoot}index.html`;

  // 1. Render Site Header
  const headerMount = document.getElementById('site-header');
  if (headerMount) {
    headerMount.className = 'site-header';
    headerMount.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'container nav-container';

    // Brand Logo
    const brand = document.createElement('a');
    brand.href = homeUrl;
    brand.className = 'brand-logo';
    brand.setAttribute('aria-label', 'Smart Parking Home');
    brand.innerHTML = `
      <img src="${siteRoot}images/smart-parking-logo.svg" alt="Smart Parking System" style="height: 38px; width: auto; display: block;" onerror="this.outerHTML='<span style=\\'font-family:var(--font-display); font-weight:700; font-size:1.25rem; color:var(--color-ink);\\'>Smart Parking</span>'">
    `;
    container.appendChild(brand);

    // Mobile Navigation Hamburger Toggle Button
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-controls', 'primary-nav');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Toggle navigation menu');

    for (let i = 0; i < 3; i++) {
      const bar = document.createElement('span');
      bar.className = 'nav-toggle-bar';
      toggle.appendChild(bar);
    }
    container.appendChild(toggle);

    // Primary Nav Container
    const nav = document.createElement('nav');
    nav.id = 'primary-nav';
    nav.className = 'primary-nav';
    nav.setAttribute('aria-label', 'Main Navigation');

    const ul = document.createElement('ul');
    ul.className = 'nav-links';

    const navItems = [
      { key: 'home', label: 'Home', href: homeUrl },
      { key: 'parking', label: 'Parking Locations', href: `${siteRoot}pages/parking.html` },
      { key: 'how-it-works', label: 'How It Works', href: `${homeUrl}#how-it-works` },
      { key: 'features', label: 'Features', href: `${homeUrl}#features` },
      { key: 'pricing', label: 'Pricing', href: `${homeUrl}#pricing` },
      { key: 'about', label: 'About', href: `${homeUrl}#about` },
      { key: 'contact', label: 'Contact', href: `${homeUrl}#contact` }
    ];

    navItems.forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.href;
      a.className = 'nav-link';
      if (item.key === activeKey) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
      a.textContent = item.label;
      li.appendChild(a);
      ul.appendChild(li);
    });

    nav.appendChild(ul);

    // Auth Action Buttons Placeholder (populated & synchronized by navbar.js)
    const navActions = document.createElement('div');
    navActions.className = 'nav-actions';
    nav.appendChild(navActions);

    container.appendChild(nav);
    headerMount.appendChild(container);

    // Initialize navbar event handlers and auth synchronization if available
    if (typeof window.initNavbar === 'function') {
      window.initNavbar();
    }
  }

  // 2. Render Site Footer (Restricted strictly to index.html and pages/parking.html)
  const footerMount = document.getElementById('site-footer');
  if (footerMount) {
    const pathname = window.location.pathname || '';
    const isParkingPage = pathname.endsWith('/parking.html') || pathname.endsWith('/parking');
    const isIndexPage = pathname.endsWith('/index.html') || pathname === '/' || pathname.endsWith('/');

    if (isParkingPage || isIndexPage) {
      footerMount.className = 'site-footer';
      footerMount.innerHTML = getSharedFooterHTML(siteRoot);
    } else {
      footerMount.innerHTML = '';
      if (typeof footerMount.remove === 'function') {
        footerMount.remove();
      }
    }
  }
}

/**
 * Returns standardized markup for the unified site footer across all portal and public pages.
 * @param {string} siteRoot
 * @returns {string}
 */
function getSharedFooterHTML(siteRoot = '../') {
  const homeUrl = `${siteRoot}index.html`;
  const parkingUrl = `${siteRoot}pages/parking.html`;

  return `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand-col">
          <a href="${homeUrl}" class="brand-logo footer-logo" aria-label="Smart Parking Home">
            <img src="${siteRoot}images/smart-parking-logo.svg" alt="Smart Parking System" style="height: 36px; width: auto; display: block;" onerror="this.outerHTML='<span style=\\'font-family:var(--font-display); font-weight:700; font-size:1.25rem; color:var(--color-ink);\\'>Smart Parking</span>'">
          </a>
          <p class="footer-tagline">Curated, reliable urban space reservations designed for intentional mobility.</p>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">Company</h4>
          <ul class="footer-links">
            <li><a href="${homeUrl}#about">About</a></li>
            <li><a href="${homeUrl}#contact">Contact</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">Product</h4>
          <ul class="footer-links">
            <li><a href="${parkingUrl}">Parking Locations</a></li>
            <li><a href="${homeUrl}#pricing">Pricing</a></li>
            <li><a href="${homeUrl}#how-it-works">How It Works</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">Legal</h4>
          <ul class="footer-links">
            <li><a href="${homeUrl}#privacy">Privacy</a></li>
            <li><a href="${homeUrl}#terms">Terms</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="footer-copyright">&copy; 2026 Smart Parking System. All rights reserved.</p>
      </div>
    </div>
  `;
}

// Auto-run on DOMContentLoaded if placeholders exist
document.addEventListener('DOMContentLoaded', () => {
  const headerMount = document.getElementById('site-header');
  const footerMount = document.getElementById('site-footer');
  if ((headerMount && !headerMount.hasChildNodes()) || (footerMount && !footerMount.hasChildNodes())) {
    renderSiteChrome();
  }
});

if (typeof window !== 'undefined') {
  window.renderSiteChrome = renderSiteChrome;
  window.getSharedFooterHTML = getSharedFooterHTML;
}
