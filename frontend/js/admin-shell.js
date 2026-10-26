/**
 * Smart Parking Management System — Admin App Shell
 * Renders unified editorial navigation for System Administrators.
 */

const ADMIN_NAV_CONFIG = [
  { key: 'dashboard', label: 'Dashboard', path: 'pages/admin/dashboard.html' },
  { key: 'users', label: 'Users & Roles', path: 'pages/admin/users.html' },
  { key: 'facilities', label: 'Parking Facilities', path: 'pages/admin/facilities.html' },
  { key: 'bookings', label: 'Global Bookings', path: 'pages/admin/bookings.html' },
  { key: 'payments', label: 'Transactions Ledger', path: 'pages/admin/payments.html' },
  { key: 'pricing', label: 'Pricing Rules', path: 'pages/admin/pricing.html' },
  { key: 'profile', label: 'My Account', path: 'pages/admin/profile.html' }
];

/**
 * Initializes and mounts the admin portal app shell around the current view.
 * @param {'dashboard'|'users'|'facilities'|'bookings'|'payments'|'pricing'|'profile'} activeKey
 * @returns {HTMLElement|null} The #app-content container element
 */
function renderAdminShell(activeKey) {
  // 1. Authentication Guard
  if (typeof requireLogin === 'function') {
    if (!requireLogin()) return null;
  }

  const user = typeof getUser === 'function' ? getUser() : null;
  const siteRoot = (typeof window !== 'undefined' && window.SITE_ROOT) ? window.SITE_ROOT : '../../';

  // 2. Role Guard: ADMIN only
  if (!user || user.role !== 'ADMIN') {
    document.body.innerHTML = '';
    const noticeWrap = document.createElement('div');
    noticeWrap.className = 'container';
    noticeWrap.style.paddingBlock = 'var(--space-8)';

    const card = document.createElement('div');
    card.className = 'role-notice-card';
    card.style.background = 'var(--color-surface)';
    card.style.border = '1px solid var(--color-border)';
    card.style.padding = 'var(--space-8)';
    card.style.maxWidth = '600px';
    card.style.margin = '40px auto';

    const h2 = document.createElement('h2');
    h2.className = 'empty-state-title';
    h2.textContent = 'Administrator Access Restricted';
    h2.style.marginBottom = 'var(--space-3)';

    const p = document.createElement('p');
    p.className = 'empty-state-text';
    p.textContent = `You are currently signed in as ${user ? user.role : 'Guest'}. This section requires System Administrator authorization.`;
    p.style.marginBottom = 'var(--space-5)';

    const homeLink = document.createElement('a');
    homeLink.className = 'btn btn-primary';
    homeLink.style.display = 'inline-block';
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

  const fullName = user && user.name ? user.name.trim() : 'Administrator';

  // --------------------------------------------------------------------------
  // Desktop Sidebar (>= 1024px)
  // --------------------------------------------------------------------------
  const sidebar = document.createElement('aside');
  sidebar.className = 'app-sidebar';
  sidebar.setAttribute('aria-label', 'Admin portal navigation');

  const sidebarTop = document.createElement('div');

  const brandSummary = document.createElement('div');
  brandSummary.className = 'sidebar-brand-summary';

  const logoLink = document.createElement('a');
  logoLink.href = `${siteRoot}index.html`;
  logoLink.className = 'sidebar-brand-link';
  logoLink.setAttribute('aria-label', 'Return to Smart Parking Home');
  logoLink.innerHTML = `<img src="${siteRoot}images/smart-parking-logo.svg" alt="Smart Parking System" class="sidebar-logo-img">`;

  const portalLabel = document.createElement('span');
  portalLabel.className = 'sidebar-portal-label';
  portalLabel.textContent = 'System Administration';

  const userNameEl = document.createElement('h2');
  userNameEl.className = 'sidebar-user-name';
  userNameEl.textContent = fullName;

  brandSummary.appendChild(logoLink);
  brandSummary.appendChild(portalLabel);
  brandSummary.appendChild(userNameEl);
  sidebarTop.appendChild(brandSummary);

  const navList = document.createElement('ul');
  navList.className = 'sidebar-nav-list';

  ADMIN_NAV_CONFIG.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'sidebar-nav-item';

    const a = document.createElement('a');
    a.className = `sidebar-nav-link ${item.key === activeKey ? 'is-active' : ''}`;
    a.href = `${siteRoot}${item.path}`;
    if (item.key === activeKey) {
      a.setAttribute('aria-current', 'page');
    }
    a.textContent = item.label;

    li.appendChild(a);
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
  mobileTabBar.setAttribute('aria-label', 'Mobile admin navigation');

  ADMIN_NAV_CONFIG.forEach((item) => {
    const a = document.createElement('a');
    a.className = `mobile-tab-link ${item.key === activeKey ? 'is-active' : ''}`;
    a.href = `${siteRoot}${item.path}`;
    if (item.key === activeKey) {
      a.setAttribute('aria-current', 'page');
    }
    a.textContent = item.label;
    mobileTabBar.appendChild(a);
  });

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

  shellRoot.appendChild(mobileTabBar);

  // --------------------------------------------------------------------------
  // Main Content Mount Point & Unified Footer
  // --------------------------------------------------------------------------
  const main = document.createElement('main');
  main.className = 'app-main';
  main.id = 'main-content';
  main.setAttribute('tabindex', '-1');
  main.style.display = 'flex';
  main.style.flexDirection = 'column';
  main.style.minHeight = '100vh';

  const appContent = document.createElement('div');
  appContent.id = 'app-content';
  appContent.style.flexGrow = '1';
  main.appendChild(appContent);

  shellRoot.appendChild(main);

  return appContent;
}

if (typeof window !== 'undefined') {
  window.renderAdminShell = renderAdminShell;
}
