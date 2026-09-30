/**
 * Smart Parking Management System — Public Contact Form Handler
 * Submits inquiry to POST /api/contact with inline accessibility alerts and pending state.
 */

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  // Ensure or create an inline status alert container
  let statusBox = document.getElementById('contact-status-alert');
  if (!statusBox) {
    statusBox = document.createElement('div');
    statusBox.id = 'contact-status-alert';
    statusBox.style.display = 'none';
    statusBox.style.padding = 'var(--space-3) var(--space-4)';
    statusBox.style.marginBottom = 'var(--space-4)';
    statusBox.style.fontSize = '0.9375rem';
    statusBox.style.lineHeight = '1.5';
    contactForm.parentNode.insertBefore(statusBox, contactForm);
  }

  const submitBtn = contactForm.querySelector('button[type="submit"]');

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Reset status box
    statusBox.style.display = 'none';
    statusBox.textContent = '';
    statusBox.removeAttribute('role');

    const formData = new FormData(contactForm);
    const name = (formData.get('name') || '').trim();
    const email = (formData.get('email') || '').trim();
    const subject = (formData.get('subject') || '').trim();
    const message = (formData.get('message') || '').trim();

    if (!name || !email || !subject || !message) {
      statusBox.textContent = 'Please complete all required fields.';
      statusBox.setAttribute('role', 'alert');
      statusBox.style.border = '1px solid var(--color-accent)';
      statusBox.style.color = varToHex('--color-accent', '#A8532E');
      statusBox.style.backgroundColor = '#FAF8F3';
      statusBox.style.display = 'block';
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending Message...';
    }

    try {
      const payload = { name, email, subject, message };
      const res = await apiRequest('/contact', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Success feedback
      statusBox.textContent = res.message || 'Thank you for contacting us. Your message has been received.';
      statusBox.setAttribute('role', 'status');
      statusBox.style.border = '1px solid #2D6A4F';
      statusBox.style.color = '#2D6A4F';
      statusBox.style.backgroundColor = '#FAF8F3';
      statusBox.style.display = 'block';

      contactForm.reset();
    } catch (err) {
      console.error('Contact submission error:', err);
      statusBox.textContent = err.message || 'Unable to submit your message. Please verify your details or try again later.';
      statusBox.setAttribute('role', 'alert');
      statusBox.style.border = '1px solid var(--color-accent)';
      statusBox.style.color = '#A8532E';
      statusBox.style.backgroundColor = '#FAF8F3';
      statusBox.style.display = 'block';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || 'Send Message';
      }
    }
  });

  function varToHex(varName, fallback) {
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      const val = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return val || fallback;
    }
    return fallback;
  }
});
