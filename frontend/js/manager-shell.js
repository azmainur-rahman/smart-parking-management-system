/**
 * Smart Parking Management System — Manager App Shell
 * Renders unified editorial navigation for Facility Managers & Administrators.
 */

const MANAGER_NAV_CONFIG = [
  { key: 'dashboard', label: 'Dashboard', path: 'pages/manager/dashboard.html' },
  { key: 'bookings', label: 'Bookings', path: 'pages/manager/bookings.html' },
  { key: 'slots', label: 'Parking Slots', path: 'pages/manager/slots.html' },
  { key: 'entry_exit', label: 'Entry / Exit', path: 'pages/manager/entry-exit.html' },
  { key: 'reports', label: 'Reports', path: 'pages/manager/reports.html' },
  { key: 'profile', label: 'Profile', path: 'pages/customer/profile.html' }
];

/**
 * Initializes and mounts the manager portal app shell around the current view.
 * @param {'dashboard'|'bookings'|'slots'|'entry_exit'|'reports'|'profile'} activeKey
 * @returns {HTMLElement|null} The #app-content container element
 */
function renderManagerShell(activeKey) {
  // 1. Authentication Guard
  if (typeof requireLogin === 'function') {
    if (!requireLogin()) return null;
  }

  const user = typeof getUser === 'function' ? getUser() : null;
  const siteRoot = (typeof window !== 'undefined' && window.SITE_ROOT) ? window.SITE_ROOT : '../../';

  // 2. Role Check: Manager or Admin Only
  if (!user || !['MANAGER', 'ADMIN'].includes(user.role)) {
    document.body.innerHTML = '';
    const noticeWrap = document.createElement('div');
    noticeWrap.className = 'container';
    noticeWrap.style.paddingBlock = 'var(--space-8)';

    const card = document.createElement('div');
    card.className = 'role-notice-card';

    const h2 = document.createElement('h2');
    h2.className = 'empty-state-title';
    h2.textContent = 'Restricted Manager Portal';

    const p = document.createElement('p');
    p.className = 'empty-state-text';
    p.textContent = `You are currently signed in as a ${user ? user.role : 'Guest'}. Access to facility management consoles is restricted exclusively to authorized Facility Managers and System Administrators.`;

    const homeLink = document.createElement('a');
    homeLink.className = 'btn-primary';
    homeLink.style.display = 'inline-block';
    homeLink.style.marginTop = 'var(--space-4)';
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

  const fullName = user && user.name ? user.name.trim() : 'Manager';
  const roleLabel = user && user.role === 'ADMIN' ? 'System Administrator' : 'Facility Manager';

  // --------------------------------------------------------------------------
  // Desktop Sidebar (>= 1024px)
  // --------------------------------------------------------------------------
  const sidebar = document.createElement('aside');
  sidebar.className = 'app-sidebar';
  sidebar.setAttribute('aria-label', 'Manager portal navigation');

  const sidebarTop = document.createElement('div');

  const brandSummary = document.createElement('div');
  brandSummary.className = 'sidebar-brand-summary';

  const portalLabel = document.createElement('span');
  portalLabel.className = 'sidebar-portal-label';
  portalLabel.textContent = roleLabel;

  const userNameEl = document.createElement('h2');
  userNameEl.className = 'sidebar-user-name';
  userNameEl.textContent = fullName;

  brandSummary.appendChild(portalLabel);
  brandSummary.appendChild(userNameEl);
  sidebarTop.appendChild(brandSummary);

  const navList = document.createElement('ul');
  navList.className = 'sidebar-nav-list';

  MANAGER_NAV_CONFIG.forEach((item) => {
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
  mobileTabBar.setAttribute('aria-label', 'Mobile manager navigation');

  MANAGER_NAV_CONFIG.forEach((item) => {
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

  // --------------------------------------------------------------------------
  // Main Content Landmark & #app-content container
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
  window.renderManagerShell = renderManagerShell;
}
