/**
 * Navbar Mobile Menu Interaction & Auth State Management
 * Plain Vanilla JS, zero dependencies, accessible ARIA attributes.
 */
function initNavbar() {
  const navToggle = document.querySelector('.nav-toggle');
  const primaryNav = document.getElementById('primary-nav');

  if (navToggle && primaryNav && !navToggle.dataset.hasListener) {
    navToggle.dataset.hasListener = 'true';
    const toggleNav = (forceState) => {
      const isCurrentlyExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      const shouldOpen = forceState !== undefined ? forceState : !isCurrentlyExpanded;

      navToggle.setAttribute('aria-expanded', String(shouldOpen));
      primaryNav.classList.toggle('is-open', shouldOpen);
    };

    // Click toggle
    navToggle.addEventListener('click', () => {
      toggleNav();
    });

    // Close when pressing Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        toggleNav(false);
        navToggle.focus();
      }
    });

    // Close when clicking outside of the header area
    document.addEventListener('click', (event) => {
      const isClickInside = navToggle.contains(event.target) || primaryNav.contains(event.target);
      if (!isClickInside && navToggle.getAttribute('aria-expanded') === 'true') {
        toggleNav(false);
      }
    });

    // Reset menu if window resized to tablet/desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && navToggle.getAttribute('aria-expanded') === 'true') {
        toggleNav(false);
      }
    });

    // Close menu when clicking any nav link on mobile
    primaryNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 768 && navToggle.getAttribute('aria-expanded') === 'true') {
          toggleNav(false);
        }
      });
    });
  }

  // Update navigation links to point to SITE_ROOT + 'index.html#section'
  updateNavbarLinks();

  // Synchronize authentication state & action links
  initNavbarAuth();
}

document.addEventListener('DOMContentLoaded', initNavbar);

/**
 * Normalizes all header links to resolve reliably whether viewed from index or pages/*
 */
function updateNavbarLinks() {
  const siteRoot = (typeof window !== 'undefined' && window.SITE_ROOT) ? window.SITE_ROOT : '';
  const homeUrl = siteRoot ? `${siteRoot}index.html` : 'index.html';

  const brandLogo = document.querySelector('.brand-logo');
  if (brandLogo) {
    brandLogo.setAttribute('href', homeUrl);
  }

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    const text = link.textContent.trim().toLowerCase();
    const href = link.getAttribute('href');
    if (!href) return;

    if (text.includes('parking location') || href.includes('parking-locations') || href.includes('parking.html')) {
      link.setAttribute('href', `${siteRoot}pages/parking.html`);
    } else if (href === '#' || href === 'index.html' || href === '../index.html') {
      link.setAttribute('href', homeUrl);
    } else if (href.startsWith('#')) {
      link.setAttribute('href', `${homeUrl}${href}`);
    } else if (href.includes('#')) {
      const hash = href.substring(href.indexOf('#'));
      link.setAttribute('href', `${homeUrl}${hash}`);
    }
  });
}

/**
 * Updates navbar action buttons based on user authentication state.
 * Uses textContent exclusively when rendering user data to avoid innerHTML injection.
 */
function initNavbarAuth() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  const siteRoot = (typeof window !== 'undefined' && window.SITE_ROOT) ? window.SITE_ROOT : '';
  const loginPath = siteRoot ? `${siteRoot}pages/login.html` : 'pages/login.html';
  const registerPath = siteRoot ? `${siteRoot}pages/register.html` : 'pages/register.html';

  const token = localStorage.getItem('sp_token');
  let user = null;
  try {
    const raw = localStorage.getItem('sp_user');
    if (raw) user = JSON.parse(raw);
  } catch (err) {
    user = null;
  }

  if (token && user) {
    const firstName = user.name ? user.name.trim().split(' ')[0] : 'User';

    const greeting = document.createElement('a');
    greeting.className = 'nav-user-greeting';
    if (user.role === 'ADMIN') {
      greeting.href = `${siteRoot}pages/admin/dashboard.html`;
    } else if (user.role === 'MANAGER') {
      greeting.href = `${siteRoot}pages/manager/dashboard.html`;
    } else {
      greeting.href = `${siteRoot}pages/customer/dashboard.html`;
    }
    greeting.textContent = `Hi, ${firstName}`;

    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'btn-logout';
    logoutBtn.id = 'nav-logout-btn';
    logoutBtn.setAttribute('aria-label', 'Log out of account');
    logoutBtn.textContent = 'Log Out';

    logoutBtn.addEventListener('click', async () => {
      if (typeof window.logout === 'function') {
        await window.logout();
      } else {
        localStorage.removeItem('sp_token');
        localStorage.removeItem('sp_user');
        window.location.href = loginPath;
      }
    });

    // Clear previous actions safely and append verified elements
    navActions.replaceChildren(greeting, logoutBtn);
  } else {
    const loginLink = document.createElement('a');
    loginLink.href = loginPath;
    loginLink.className = 'nav-login';
    loginLink.textContent = 'Log In';

    const signupLink = document.createElement('a');
    signupLink.href = registerPath;
    signupLink.className = 'btn-signup';
    signupLink.textContent = 'Sign Up';

    navActions.replaceChildren(loginLink, signupLink);
  }
}

if (typeof window !== 'undefined') {
  window.initNavbar = initNavbar;
}
