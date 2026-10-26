/**
 * Smart Parking Management System — Shared UI Utilities
 * Accessible dialogs, toast notifications, status badges, formatters, and skeletons.
 * Plain Vanilla JS, loaded as classic script tag.
 * Strict rule: All dynamic data rendered via textContent; zero innerHTML with API data.
 */

// Global tracker for previous focus when opening modals
let lastFocusedElement = null;
let currentModalCloseFn = null;

// Ensure toast container exists in DOM
function getOrCreateToastContainer() {
  let container = document.getElementById('sp-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sp-toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }
  return container;
}

// Ensure modal backdrop exists in DOM with a single attached click listener
function getOrCreateModalBackdrop() {
  let backdrop = document.getElementById('sp-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'sp-modal-backdrop';
    backdrop.className = 'modal-backdrop';
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop && typeof currentModalCloseFn === 'function') {
        currentModalCloseFn();
      }
    });
    document.body.appendChild(backdrop);
  }
  return backdrop;
}

/**
 * Displays an accessible toast notification with distinct textual label.
 * @param {string} message
 * @param {'info'|'success'|'error'} [type='info']
 * @param {number} [duration=4000]
 */
function showToast(message, type = 'info', duration = 4000) {
  const container = getOrCreateToastContainer();

  const toast = document.createElement('div');
  const normalizedType = ['success', 'error'].includes(type) ? type : 'info';
  toast.className = `toast toast--${normalizedType}`;
  toast.setAttribute('role', normalizedType === 'error' ? 'alert' : 'status');

  // Text label ensures status is never conveyed by color alone
  const tag = document.createElement('span');
  tag.className = 'toast-tag';
  tag.textContent = normalizedType === 'success' ? 'Success' : normalizedType === 'error' ? 'Notice' : 'Info';

  const msgSpan = document.createElement('span');
  msgSpan.className = 'toast-msg';
  msgSpan.textContent = String(message);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'toast-close';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.textContent = '×';

  const removeToast = () => {
    toast.classList.remove('is-active');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  };

  closeBtn.addEventListener('click', removeToast);

  toast.appendChild(tag);
  toast.appendChild(msgSpan);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  // Trigger smooth entrance
  requestAnimationFrame(() => {
    toast.classList.add('is-active');
  });

  if (duration > 0) {
    setTimeout(removeToast, duration);
  }
}

/**
 * Opens an accessible modal dialog with focus trap and Esc handling.
 * @param {HTMLElement|string} content
 * @param {object} [options]
 * @param {string} [options.title]
 * @param {function} [options.onClose]
 * @returns {{ backdrop: HTMLElement, close: function }}
 */
function openModal(content, options = {}) {
  lastFocusedElement = document.activeElement;

  const backdrop = getOrCreateModalBackdrop();
  backdrop.innerHTML = '';

  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';

  const titleEl = document.createElement('h3');
  titleEl.className = 'modal-title';
  titleEl.textContent = options.title || 'Details';
  header.appendChild(titleEl);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'modal-close-btn';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.textContent = 'Close';
  header.appendChild(closeBtn);

  dialog.appendChild(header);

  // Body Content
  const body = document.createElement('div');
  body.className = 'modal-body';
  if (typeof content === 'string') {
    body.textContent = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }
  dialog.appendChild(body);

  backdrop.appendChild(dialog);

  const closeModalFn = () => {
    backdrop.classList.remove('is-open');
    document.removeEventListener('keydown', keydownHandler);
    currentModalCloseFn = null;
    if (typeof options.onClose === 'function') {
      options.onClose();
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  };

  currentModalCloseFn = closeModalFn;

  const keydownHandler = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModalFn();
      return;
    }

    // Accessible Focus Trap
    if (e.key === 'Tab') {
      const focusables = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  };

  closeBtn.addEventListener('click', closeModalFn);
  document.addEventListener('keydown', keydownHandler);

  backdrop.classList.add('is-open');

  // Focus first control inside dialog
  requestAnimationFrame(() => {
    const firstFocusable = dialog.querySelector('input, select, textarea, button');
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      closeBtn.focus();
    }
  });

  return { backdrop, close: closeModalFn };
}

/**
 * Closes the currently active modal dialog.
 */
function closeModal() {
  if (typeof currentModalCloseFn === 'function') {
    currentModalCloseFn();
  }
}

/**
 * Opens an accessible confirmation dialog and returns a Promise<boolean>.
 * @param {string} title
 * @param {string} message
 * @param {string} [confirmLabel='Confirm']
 * @param {string} [cancelLabel='Cancel']
 * @returns {Promise<boolean>}
 */
function confirmDialog(title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel') {
  return new Promise((resolve) => {
    const wrapper = document.createElement('div');

    const msgP = document.createElement('p');
    msgP.style.marginBottom = 'var(--space-5)';
    msgP.style.color = 'var(--color-ink)';
    msgP.textContent = message;
    wrapper.appendChild(msgP);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = cancelLabel;

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn-primary';
    confirmBtn.textContent = confirmLabel;

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    wrapper.appendChild(footer);

    let modalRef = null;

    cancelBtn.addEventListener('click', () => {
      resolve(false);
      modalRef.close();
    });

    confirmBtn.addEventListener('click', () => {
      resolve(true);
      modalRef.close();
    });

    modalRef = openModal(wrapper, {
      title,
      onClose: () => resolve(false)
    });
  });
}

/**
 * Generates an accessible status badge pill with text label.
 * @param {string} status
 * @returns {HTMLElement}
 */
function statusBadge(status) {
  const pill = document.createElement('span');
  const raw = String(status || '').toUpperCase().trim();
  const normalizedClass = raw.toLowerCase().replace(/[^a-z0-9]/g, '_');
  pill.className = `status-pill status-pill--${normalizedClass}`;
  pill.textContent = raw.replace('_', ' ');
  return pill;
}

/**
 * Generates an accessible empty state component.
 * @param {string} title
 * @param {string} text
 * @param {string} [actionLabel]
 * @param {string} [actionHref]
 * @returns {HTMLElement}
 */
function emptyState(title, text, actionLabel, actionHref) {
  const container = document.createElement('div');
  container.className = 'empty-state';

  const heading = document.createElement('h4');
  heading.className = 'empty-state-title';
  heading.textContent = title;
  container.appendChild(heading);

  const desc = document.createElement('p');
  desc.className = 'empty-state-text';
  desc.textContent = text;
  container.appendChild(desc);

  if (actionLabel && actionHref) {
    const btn = document.createElement('a');
    btn.className = 'empty-state-btn';
    btn.href = actionHref;
    btn.textContent = actionLabel;
    container.appendChild(btn);
  }

  return container;
}

/**
 * Creates loading skeleton blocks.
 * @param {number} [count=3]
 * @param {'card'|'text'} [type='text']
 * @returns {HTMLElement}
 */
function loadingSkeleton(count = 3, type = 'text') {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('aria-busy', 'true');
  wrapper.setAttribute('aria-label', 'Loading content');

  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.className = `skeleton-box skeleton-${type}`;
    wrapper.appendChild(item);
  }

  return wrapper;
}

/**
 * Date Formatter: "Sep 30, 2026"
 * @param {Date|string} dateInput
 * @returns {string}
 */
function formatDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Time Formatter: "02:30 PM"
 * @param {Date|string} dateInput
 * @returns {string}
 */
function formatTime(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Money Formatter: "৳250"
 * @param {number|string} amount
 * @returns {string}
 */
function formatMoney(amount) {
  const num = Number(amount) || 0;
  return `৳${num.toLocaleString('en-US')}`;
}

/**
 * Stat Card Component Generator
 * @param {string} label
 * @param {string|number} value
 * @param {string} [subtext]
 * @returns {HTMLElement}
 */
function createStatCard(label, value, subtext = '') {
  const card = document.createElement('div');
  card.className = 'stat-card';

  const lbl = document.createElement('span');
  lbl.className = 'stat-card-label';
  lbl.textContent = label;

  const val = document.createElement('div');
  val.className = 'stat-card-value';
  val.textContent = value;

  card.appendChild(lbl);
  card.appendChild(val);

  if (subtext) {
    const sub = document.createElement('span');
    sub.className = 'stat-card-sub';
    sub.textContent = subtext;
    card.appendChild(sub);
  }

  return card;
}

// Global browser registration for classic script tag includes
if (typeof window !== 'undefined') {
  window.showToast = showToast;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.confirmDialog = confirmDialog;
  window.statusBadge = statusBadge;
  window.emptyState = emptyState;
  window.loadingSkeleton = loadingSkeleton;
  window.formatDate = formatDate;
  window.formatTime = formatTime;
  window.formatMoney = formatMoney;
  window.createStatCard = createStatCard;
}
