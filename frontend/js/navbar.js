/**
 * Navbar Mobile Menu Interaction
 * Plain Vanilla JS, zero dependencies, accessible ARIA attributes.
 */
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const primaryNav = document.getElementById('primary-nav');

  if (!navToggle || !primaryNav) return;

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
});
