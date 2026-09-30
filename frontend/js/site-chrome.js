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
    brand.textContent = 'Smart Parking';
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

  // 2. Render Site Footer
  const footerMount = document.getElementById('site-footer');
  if (footerMount) {
    footerMount.className = 'site-footer';
    footerMount.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'container';

    const grid = document.createElement('div');
    grid.className = 'footer-grid';

    // Column 1: Brand & Tagline
    const brandCol = document.createElement('div');
    brandCol.className = 'footer-brand-col';

    const fLogo = document.createElement('a');
    fLogo.href = homeUrl;
    fLogo.className = 'brand-logo footer-logo';
    fLogo.textContent = 'Smart Parking';

    const fTagline = document.createElement('p');
    fTagline.className = 'footer-tagline';
    fTagline.textContent = 'Curated, reliable urban space reservations designed for intentional mobility.';

    brandCol.appendChild(fLogo);
    brandCol.appendChild(fTagline);
    grid.appendChild(brandCol);

    // Columns 2, 3, 4: Company, Product, Legal
    const cols = [
      {
        heading: 'Company',
        links: [
          { label: 'About', href: `${homeUrl}#about` },
          { label: 'Contact', href: `${homeUrl}#contact` }
        ]
      },
      {
        heading: 'Product',
        links: [
          { label: 'Parking Locations', href: `${siteRoot}pages/parking.html` },
          { label: 'Pricing', href: `${homeUrl}#pricing` },
          { label: 'How It Works', href: `${homeUrl}#how-it-works` }
        ]
      },
      {
        heading: 'Legal',
        links: [
          { label: 'Privacy', href: `${homeUrl}#privacy` },
          { label: 'Terms', href: `${homeUrl}#terms` }
        ]
      }
    ];

    cols.forEach((colData) => {
      const col = document.createElement('div');
      col.className = 'footer-col';

      const heading = document.createElement('h4');
      heading.className = 'footer-heading';
      heading.textContent = colData.heading;
      col.appendChild(heading);

      const list = document.createElement('ul');
      list.className = 'footer-links';

      colData.links.forEach((l) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = l.href;
        link.textContent = l.label;
        item.appendChild(link);
        list.appendChild(item);
      });

      col.appendChild(list);
      grid.appendChild(col);
    });

    container.appendChild(grid);

    // Footer Bottom Copyright
    const bottom = document.createElement('div');
    bottom.className = 'footer-bottom';

    const copyright = document.createElement('p');
    copyright.className = 'footer-copyright';
    copyright.textContent = '© 2026 Smart Parking System. All rights reserved.';

    bottom.appendChild(copyright);
    container.appendChild(bottom);

    footerMount.appendChild(container);
  }
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
}
