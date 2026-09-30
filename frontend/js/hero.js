/**
 * Smart Parking Management System — Landing Page Hero & Dynamic Locations
 * Handles hero search redirection with validation and loads dynamic locations with fallback.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Hero Search Form Initialization
  const searchForm = document.getElementById('hero-search-form');
  const dateInput = document.getElementById('search-date');
  const timeInput = document.getElementById('search-time');
  const locInput = document.getElementById('search-location');
  const durSelect = document.getElementById('search-duration');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  if (dateInput) {
    dateInput.min = todayStr;
    if (!dateInput.value) {
      dateInput.value = todayStr;
    }
  }

  if (timeInput && !timeInput.value) {
    const nextHour = new Date(today.getTime() + 60 * 60 * 1000);
    timeInput.value = `${String(nextHour.getHours()).padStart(2, '0')}:00`;
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const locationVal = locInput ? locInput.value.trim() : '';
      const dateVal = dateInput ? dateInput.value : '';
      const timeVal = timeInput ? timeInput.value : '';
      const durationVal = durSelect ? durSelect.value : '2h';

      // Validation: Date cannot be in the past
      if (dateVal && dateVal < todayStr) {
        if (typeof showToast === 'function') {
          showToast('Booking date cannot be in the past.', 'error');
        } else {
          alert('Booking date cannot be in the past.');
        }
        if (dateInput) dateInput.focus();
        return;
      }

      const params = new URLSearchParams();
      if (locationVal) params.set('q', locationVal);
      if (dateVal) params.set('date', dateVal);
      if (timeVal) params.set('time', timeVal);
      if (durationVal) params.set('duration', durationVal.toUpperCase());

      // Redirect to parking directory
      window.location.href = `pages/parking.html?${params.toString()}`;
    });
  }

  // 2. Dynamic Locations Section with Fallback Preservation
  const grid = document.getElementById('landing-locations-grid') || document.querySelector('.locations-grid');
  if (grid) {
    try {
      if (typeof apiRequest === 'function') {
        const res = await apiRequest('/public/locations');
        const locations = res.locations || [];

        if (locations.length > 0) {
          // Clear static fallback cards only on verified API success
          grid.innerHTML = '';

          locations.forEach((loc) => {
            const card = document.createElement('article');
            card.className = 'location-card';

            // Media box
            const mediaWrap = document.createElement('div');
            mediaWrap.className = 'location-media-placeholder';
            mediaWrap.setAttribute('aria-label', `Preview image for ${loc.name}`);

            if (loc.images && loc.images.length > 0) {
              const img = document.createElement('img');
              img.src = loc.images[0];
              img.alt = loc.name;
              img.className = 'location-img';
              img.style.width = '100%';
              img.style.height = '100%';
              img.style.objectFit = 'cover';
              img.loading = 'lazy';
              mediaWrap.appendChild(img);
            } else {
              const label = document.createElement('span');
              label.className = 'media-placeholder-label';
              label.textContent = 'Preview';
              mediaWrap.appendChild(label);
            }
            card.appendChild(mediaWrap);

            // Body
            const body = document.createElement('div');
            body.className = 'location-body';

            const titleWrap = document.createElement('div');
            titleWrap.className = 'location-title-wrap';

            const nameEl = document.createElement('h3');
            nameEl.className = 'location-name';
            nameEl.textContent = loc.name;

            const cityEl = document.createElement('span');
            cityEl.className = 'location-city';
            cityEl.textContent = loc.address ? `${loc.address.area || ''}, ${loc.address.city || 'Dhaka'}` : 'Dhaka';

            titleWrap.appendChild(nameEl);
            titleWrap.appendChild(cityEl);
            body.appendChild(titleWrap);

            // Details (available slots + hourly rate)
            const details = document.createElement('div');
            details.className = 'location-details';

            const slotsEl = document.createElement('p');
            slotsEl.className = 'location-slots';
            const availCount = typeof loc.availableSlots === 'number' ? loc.availableSlots : loc.totalSlots;
            slotsEl.textContent = `${availCount} slots available`;

            const rateEl = document.createElement('p');
            rateEl.className = 'location-rate';
            rateEl.textContent = `From ৳${loc.fromPrice || 30}/hour`;

            details.appendChild(slotsEl);
            details.appendChild(rateEl);
            body.appendChild(details);

            // Action link
            const actionDiv = document.createElement('div');
            actionDiv.className = 'location-action';

            const link = document.createElement('a');
            link.href = `pages/parking-details.html?id=${loc._id}`;
            link.className = 'location-link';
            link.textContent = 'View Parking →';

            actionDiv.appendChild(link);
            body.appendChild(actionDiv);

            card.appendChild(body);
            grid.appendChild(card);
          });
        }
      }
    } catch (err) {
      console.error('Failed to load live landing page locations, preserving static fallback:', err);
    }
  }
});
