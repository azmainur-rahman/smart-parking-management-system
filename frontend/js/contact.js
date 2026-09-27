/**
 * Contact Form Handling
 * Vanilla JS, prevents page reload, logs form fields to console.
 */
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');

  if (!contactForm) return;

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const contactData = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    console.log('[Smart Parking] Contact form submitted:', contactData);
  });
});
