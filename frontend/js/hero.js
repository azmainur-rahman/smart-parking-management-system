/**
 * Smart Parking Management System — Landing Page Hero, Dynamic Locations & Pricing
 * Handles:
 * 1. Hero search form validation, autocompletion datalist & redirection
 * 2. Dynamic loading of live active parking facilities
 * 3. Dynamic loading of system rates & pricing tiers
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Hero Search Form Initialization
  initHeroSearch();

  // 2. Load Dynamic Parking Locations
  await loadDynamicLocations();

  // 3. Load Dynamic Pricing
  await loadDynamicPricing();
});

function initHeroSearch() {
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
      if (dateVal) params.set('date', dateVal);
      if (timeVal) params.set('time', timeVal);
      if (durationVal) params.set('duration', durationVal.toUpperCase());

      // If a specific parking facility is selected from dropdown, navigate directly to facility bays
      if (locationVal && locationVal !== 'ALL') {
        params.set('id', locationVal);
        window.location.href = `pages/parking-details.html?${params.toString()}`;
      } else {
        // Otherwise browse all active locations in the parking directory
        window.location.href = `pages/parking.html?${params.toString()}`;
      }
    });
  }
}

/**
 * Loads dynamic parking locations from /api/public/locations
 */
async function loadDynamicLocations() {
  const grid = document.getElementById('landing-locations-grid') || document.querySelector('.locations-grid');
  const locSelect = document.getElementById('search-location');
  const datalist = document.getElementById('hero-locations-datalist');

  if (typeof apiRequest !== 'function') return;

  try {
    const res = await apiRequest('/public/locations');
    const locations = res && res.locations ? res.locations : [];

    // Populate Hero Search Location Select Dropdown
    if (locSelect && locations.length > 0) {
      locSelect.innerHTML = '';

      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = 'Select a Parking Facility...';
      locSelect.appendChild(defaultOpt);

      const allOpt = document.createElement('option');
      allOpt.value = 'ALL';
      allOpt.textContent = `All Available Facilities (${locations.length} Locations)`;
      locSelect.appendChild(allOpt);

      locations.forEach((loc) => {
        const option = document.createElement('option');
        option.value = loc._id;
        const areaStr = loc.address && loc.address.area ? loc.address.area : '';
        const cityStr = loc.address && loc.address.city ? loc.address.city : 'Dhaka';
        const locLabel = areaStr ? `${loc.name} (${areaStr}, ${cityStr})` : `${loc.name} (${cityStr})`;
        const avail = typeof loc.availableSlots === 'number' ? loc.availableSlots : (loc.totalSlots || 0);
        option.textContent = `${locLabel} — ${avail > 0 ? `${avail} Bays Open` : 'Fully Booked'}`;
        locSelect.appendChild(option);
      });
    }

    // Populate Datalist for autocomplete if present
    if (datalist && locations.length > 0) {
      datalist.innerHTML = '';
      const suggestions = new Set();
      locations.forEach((loc) => {
        if (loc.name) suggestions.add(loc.name);
        if (loc.address && loc.address.area) suggestions.add(loc.address.area);
        if (loc.address && loc.address.city) suggestions.add(loc.address.city);
      });
      suggestions.forEach((val) => {
        const option = document.createElement('option');
        option.value = val;
        datalist.appendChild(option);
      });
    }

    // Populate Dynamic Locations Grid
    if (grid && locations.length > 0) {
      grid.innerHTML = '';

      locations.forEach((loc) => {
        const card = document.createElement('article');
        card.className = 'location-card';

        // Media box
        const mediaWrap = document.createElement('div');
        mediaWrap.className = 'location-media-placeholder';
        mediaWrap.setAttribute('aria-label', `Preview image for ${loc.name}`);

        const total = typeof loc.totalSlots === 'number' ? loc.totalSlots : 0;
        const avail = typeof loc.availableSlots === 'number' ? loc.availableSlots : total;

        const img = document.createElement('img');
        const defaultImg = (loc.name && loc.name.toLowerCase().includes('gulshan')) 
          ? 'images/hero-parking.jpg' 
          : 'images/hero-parking-smart.jpg';
        img.src = (loc.images && loc.images.length > 0) ? loc.images[0] : defaultImg;
        img.alt = loc.name;
        img.className = 'location-img';
        img.loading = 'lazy';
        img.onerror = () => {
          img.src = defaultImg;
        };
        mediaWrap.appendChild(img);

        // Status Badge
        const badge = document.createElement('span');
        if (avail <= 5 && avail > 0) {
          badge.className = 'location-badge is-few';
          badge.textContent = '🔴 Few Slots Left';
        } else if (avail === 0) {
          badge.className = 'location-badge is-few';
          badge.textContent = '⚪ Fully Booked';
        } else {
          badge.className = 'location-badge is-available';
          badge.textContent = '🟢 Available';
        }
        mediaWrap.appendChild(badge);
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
        const areaStr = loc.address && loc.address.area ? loc.address.area : '';
        const cityStr = loc.address && loc.address.city ? loc.address.city : 'Dhaka';
        cityEl.textContent = areaStr ? `📍 ${areaStr}, ${cityStr}` : `📍 ${cityStr}`;

        titleWrap.appendChild(nameEl);
        titleWrap.appendChild(cityEl);
        body.appendChild(titleWrap);

        // Price and Action row
        const priceAction = document.createElement('div');
        priceAction.className = 'location-price-action';

        const rateWrap = document.createElement('div');
        rateWrap.className = 'location-rate-wrap';
        
        const rateAmount = document.createElement('span');
        rateAmount.className = 'location-rate-amount';
        rateAmount.textContent = `৳${loc.fromPrice || 120}`;

        const rateUnit = document.createElement('span');
        rateUnit.className = 'location-rate-unit';
        rateUnit.textContent = '/ hour';

        rateWrap.appendChild(rateAmount);
        rateWrap.appendChild(rateUnit);
        priceAction.appendChild(rateWrap);

        const bookBtn = document.createElement('a');
        bookBtn.href = `pages/parking-details.html?id=${loc._id}`;
        bookBtn.className = 'btn-location-book';
        bookBtn.textContent = 'Book Now →';
        priceAction.appendChild(bookBtn);

        body.appendChild(priceAction);

        // Meta features
        const featuresMeta = document.createElement('div');
        featuresMeta.className = 'location-features-meta';
        featuresMeta.innerHTML = '<span>Indoor</span><span class="meta-dot">•</span><span>Security</span><span class="meta-dot">•</span><span>24/7</span>';
        body.appendChild(featuresMeta);

        card.appendChild(body);
        grid.appendChild(card);
      });
    }
  } catch (err) {
    console.warn('Could not load dynamic locations, preserving fallback:', err);
  }
}

/**
 * Loads dynamic pricing from /api/public/pricing
 */
async function loadDynamicPricing() {
  if (typeof apiRequest !== 'function') return;

  try {
    const res = await apiRequest('/public/pricing');
    if (!res || !res.success || !res.pricing) return;

    const { rates, freeCancellationHours } = res.pricing;

    // 1. Hourly Card Elements
    const hourlyAmt = document.getElementById('pricing-hourly-amount');
    const hourlySub = document.getElementById('pricing-hourly-subrates');
    const cancelFeature = document.getElementById('pricing-cancellation-feature');

    if (rates && rates.hourly) {
      if (hourlyAmt && rates.hourly.car != null) {
        hourlyAmt.textContent = `৳${rates.hourly.car}`;
      }
      if (hourlySub) {
        const parts = [];
        if (rates.hourly.motorcycle != null) parts.push(`Motorcycle: ৳${rates.hourly.motorcycle}/hr`);
        if (rates.hourly.suv != null) parts.push(`SUV: ৳${rates.hourly.suv}/hr`);
        if (parts.length > 0) {
          hourlySub.textContent = parts.join(' • ');
        }
      }
    }

    if (cancelFeature && freeCancellationHours != null) {
      cancelFeature.textContent = `Free cancellation up to ${freeCancellationHours} hrs before`;
    }

    // 2. Daily Card Elements
    const dailyAmt = document.getElementById('pricing-daily-amount');
    const dailySub = document.getElementById('pricing-daily-subrates');

    if (rates && rates.daily) {
      if (dailyAmt && rates.daily.car != null) {
        dailyAmt.textContent = `৳${rates.daily.car}`;
      }
      if (dailySub) {
        const parts = [];
        if (rates.daily.motorcycle != null) parts.push(`Motorcycle: ৳${rates.daily.motorcycle}/day`);
        if (rates.daily.suv != null) parts.push(`SUV: ৳${rates.daily.suv}/day`);
        if (parts.length > 0) {
          dailySub.textContent = parts.join(' • ');
        }
      }
    }
  } catch (err) {
    console.warn('Could not load dynamic pricing, preserving fallback values:', err);
  }
}
