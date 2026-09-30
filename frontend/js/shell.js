/**
 * Smart Parking Management System — Customer App Shell
 * Renders unified editorial navigation: Desktop sidebar & Mobile horizontal tab bar.
 */

const NAV_CONFIG = [
  { key: 'dashboard', label: 'Dashboard', path: 'pages/customer/dashboard.html', enabled: true },
  { key: 'bookings', label: 'My Bookings', path: 'pages/customer/bookings.html', enabled: true },
  { key: 'vehicles', label: 'My Vehicles', path: 'pages/customer/vehicles.html', enabled: true },
  { key: 'find_parking', label: 'Find Parking', path: 'pages/parking.html', enabled: true },
  { key: 'payments', label: 'Payments', path: 'pages/customer/payments.html', enabled: true },
  { key: 'profile', label: 'Profile', path: 'pages/customer/profile.html', enabled: true }
];

/**
 * Initializes and mounts the customer app shell around the current view.
 * @param {'dashboard'|'bookings'|'vehicles'|'find_parking'|'payments'|'profile'} activeKey
 * @returns {HTMLElement|null} The #app-content container element for the page to inject content into
 */
function renderShell(activeKey) {
  // 1. Authentication Guard
  if (typeof requireLogin === 'function') {
    if (!requireLogin()) return null;
  }

  const user = typeof getUser === 'function' ? getUser() : null;
  const siteRoot = (typeof window !== 'undefined' && window.SITE_ROOT) ? window.SITE_ROOT : '../../';

  // 2. Role Check: Customer Only
  if (user && user.role !== 'CUSTOMER') {
    document.body.innerHTML = '';
    const noticeWrap = document.createElement('div');
    noticeWrap.className = 'container';
    const card = document.createElement('div');
    card.className = 'role-notice-card';

    const h2 = document.createElement('h2');
    h2.className = 'empty-state-title';
    h2.textContent = 'Customer Area';

    const p = document.createElement('p');
    p.className = 'empty-state-text';
    p.textContent = `You are currently signed in with the role of ${user.role}. This portal is specifically tailored for vehicle customer accounts. Administrative and manager consoles are maintained separately.`;

    const homeLink = document.createElement('a');
    homeLink.className = 'btn-primary';
    homeLink.href = `${siteRoot}index.html`;
    homeLink.textContent = 'Return to Home';

    card.appendChild(h2);
    card.appendChild(p);
    card.appendChild(homeLink);
    noticeWrap.appendChild(card);
    document.body.appendChild(noticeWrap);
    return null;
  }

  // 3. Locate or create app shell container
  let shellRoot = document.getElementById('app-shell-root');
  if (!shellRoot) {
    shellRoot = document.createElement('div');
    shellRoot.id = 'app-shell-root';
    shellRoot.className = 'app-layout';
    document.body.appendChild(shellRoot);
  } else {
    shellRoot.innerHTML = '';
  }

  const firstName = user && user.name ? user.name.trim().split(' ')[0] : 'Customer';
  const fullName = user && user.name ? user.name.trim() : 'Customer';

  // --------------------------------------------------------------------------
  // Desktop Sidebar
  // --------------------------------------------------------------------------
  const sidebar = document.createElement('aside');
  sidebar.className = 'app-sidebar';
  sidebar.setAttribute('aria-label', 'Customer portal navigation');

  const sidebarTop = document.createElement('div');

  const brandSummary = document.createElement('div');
  brandSummary.className = 'sidebar-brand-summary';

  const portalLabel = document.createElement('span');
  portalLabel.className = 'sidebar-portal-label';
  portalLabel.textContent = 'Customer Portal';

  const userNameEl = document.createElement('h2');
  userNameEl.className = 'sidebar-user-name';
  userNameEl.textContent = fullName;

  brandSummary.appendChild(portalLabel);
  brandSummary.appendChild(userNameEl);
  sidebarTop.appendChild(brandSummary);

  const navList = document.createElement('ul');
  navList.className = 'sidebar-nav-list';

  NAV_CONFIG.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'sidebar-nav-item';

    if (item.enabled) {
      const a = document.createElement('a');
      a.className = `sidebar-nav-link ${item.key === activeKey ? 'is-active' : ''}`;
      a.href = `${siteRoot}${item.path}`;
      if (item.key === activeKey) {
        a.setAttribute('aria-current', 'page');
      }
      a.textContent = item.label;
      li.appendChild(a);
    } else {
      const span = document.createElement('div');
      span.className = 'sidebar-nav-link';
      span.setAttribute('aria-disabled', 'true');

      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label;

      const soonTag = document.createElement('span');
      soonTag.className = 'nav-soon-tag';
      soonTag.textContent = 'Soon';

      span.appendChild(labelSpan);
      span.appendChild(soonTag);
      li.appendChild(span);
    }

    navList.appendChild(li);
  });

  sidebarTop.appendChild(navList);
  sidebar.appendChild(sidebarTop);

  const sidebarFooter = document.createElement('div');
  sidebarFooter.className = 'sidebar-footer';

  const logoutBtn = document.createElement('button');
  logoutBtn.type = 'button';
  logoutBtn.className = 'sidebar-logout-btn';
  logoutBtn.textContent = 'Log Out';
  logoutBtn.addEventListener('click', async () => {
    if (typeof logout === 'function') {
      await logout();
    } else {
      localStorage.removeItem('sp_token');
      localStorage.removeItem('sp_user');
      window.location.href = `${siteRoot}pages/login.html`;
    }
  });

  sidebarFooter.appendChild(logoutBtn);
  sidebar.appendChild(sidebarFooter);

  shellRoot.appendChild(sidebar);

  // --------------------------------------------------------------------------
  // Mobile Horizontal Scrollable Tab Bar (< 1024px)
  // --------------------------------------------------------------------------
  const mobileTabBar = document.createElement('nav');
  mobileTabBar.className = 'mobile-tab-bar';
  mobileTabBar.setAttribute('aria-label', 'Mobile portal navigation');

  NAV_CONFIG.forEach((item) => {
    if (item.enabled) {
      const a = document.createElement('a');
      a.className = `mobile-tab-link ${item.key === activeKey ? 'is-active' : ''}`;
      a.href = `${siteRoot}${item.path}`;
      if (item.key === activeKey) {
        a.setAttribute('aria-current', 'page');
      }
      a.textContent = item.label;
      mobileTabBar.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.className = 'mobile-tab-link';
      span.setAttribute('aria-disabled', 'true');
      span.textContent = `${item.label} (Soon)`;
      mobileTabBar.appendChild(span);
    }
  });

  // Mobile Log Out item
  const mobileLogout = document.createElement('button');
  mobileLogout.type = 'button';
  mobileLogout.className = 'mobile-tab-link';
  mobileLogout.style.background = 'none';
  mobileLogout.style.border = 'none';
  mobileLogout.style.cursor = 'pointer';
  mobileLogout.textContent = 'Log Out';
  mobileLogout.addEventListener('click', async () => {
    if (typeof logout === 'function') {
      await logout();
    } else {
      localStorage.removeItem('sp_token');
      localStorage.removeItem('sp_user');
      window.location.href = `${siteRoot}pages/login.html`;
    }
  });
  mobileTabBar.appendChild(mobileLogout);

  // --------------------------------------------------------------------------
  // Main Content Landmark & app-content container
  // --------------------------------------------------------------------------
  const main = document.createElement('main');
  main.className = 'app-main';
  main.id = 'main-content';

  main.appendChild(mobileTabBar);

  const appContent = document.createElement('div');
  appContent.id = 'app-content';
  main.appendChild(appContent);

  shellRoot.appendChild(main);

  return appContent;
}

if (typeof window !== 'undefined') {
  window.renderShell = renderShell;
}
