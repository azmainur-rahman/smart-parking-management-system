/**
 * Hero Search Form Handling
 * Vanilla JS, prevents reload, logs search parameters to console.
 */
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('hero-search-form');

  if (!searchForm) return;

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(searchForm);
    const searchParams = {
      location: formData.get('location'),
      date: formData.get('date'),
      time: formData.get('time'),
      duration: formData.get('duration')
    };

    console.log('[Smart Parking] Search submitted:', searchParams);
  });
});
