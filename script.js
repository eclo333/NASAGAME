// NASA API key — used to access the Astronomy Picture of the Day API
const API_KEY = 'Xrm4ekdMBPT8KrBHIXHS2LJu5Z1pZFuqhMQeXC4m';

// ── Did You Know? ─────────────────────────────────────────────────────────────
// Array of fun space facts displayed randomly each time the page loads
const spaceFacts = [
  'A day on Venus is longer than a year on Venus — it spins incredibly slowly!',
  'Neutron stars can spin at up to 600 rotations per second.',
  'The footprints left by Apollo astronauts on the Moon will last for millions of years.',
  'One million Earths could fit inside the Sun.',
  'The Milky Way galaxy is about 100,000 light-years across.',
  'There are more stars in the universe than grains of sand on all Earth\'s beaches.',
  'Space is completely silent — there is no atmosphere for sound to travel through.',
  'The largest known star, UY Scuti, is about 1,700 times bigger than our Sun.',
  'A teaspoon of neutron star material would weigh about 10 million tons.',
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
  'Saturn\'s rings are mostly ice and rock, and some sections are only ~30 feet thick.',
  'The Great Red Spot on Jupiter is a storm that has been raging for over 350 years.',
];

// Pick a random fact from the array and display it on the page
const randomFact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
const factText = document.getElementById('fact-text');

// Defensive render: if DOM timing changes in deployment, still set the fact
if (factText) {
  factText.textContent = randomFact;
} else {
  document.addEventListener('DOMContentLoaded', () => {
    const delayedFactText = document.getElementById('fact-text');
    if (delayedFactText) {
      delayedFactText.textContent = randomFact;
    }
  });
}

// ── Element References ────────────────────────────────────────────────────────
const fetchBtn         = document.getElementById('fetchBtn');
const gallery          = document.getElementById('gallery');
const modal            = document.getElementById('modal');
const modalClose       = document.getElementById('modalClose');
const modalImage       = document.getElementById('modalImage');
const modalVideo       = document.getElementById('modalVideo');
const modalTitle       = document.getElementById('modalTitle');
const modalDate        = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// ── Date Inputs ───────────────────────────────────────────────────────────────
const startInput = document.getElementById('startDate');
const endInput   = document.getElementById('endDate');

// Set up date pickers via dateRange.js (sets min/max and default 9-day range)
setupDateInputs(startInput, endInput);

// ── Pre-fetch Cache ───────────────────────────────────────────────────────────
// When the user changes the start date, kick off a background fetch immediately.
// If they then click "Get Space Images" for the same dates, we reuse that result
// instead of waiting for a new request — making the UI feel instant.
const prefetchCache = {};

startInput.addEventListener('change', () => {
  // Wait one tick for dateRange.js to auto-update endDate, then pre-fetch
  setTimeout(() => {
    const start = startInput.value;
    const end   = endInput.value;
    if (!start || !end) return;

    const cacheKey = `${start}_${end}`;
    if (prefetchCache[cacheKey]) return; // already cached, skip

    // Start the fetch now but don't await it — store the Promise
    const url = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${start}&end_date=${end}`;
    prefetchCache[cacheKey] = fetch(url)
      .then(res => res.json())
      .catch(() => null); // silently discard pre-fetch errors
  }, 50);
});

// ── Skeleton Loading Helpers ──────────────────────────────────────────────────
// Build one skeleton card that mimics a real gallery card's shape
function createSkeletonCard() {
  return `
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text short"></div>
    </div>
  `;
}

// Show N shimmer skeleton cards while the API request is in-flight
function showSkeletons(count = 9) {
  gallery.innerHTML = Array(count).fill(createSkeletonCard()).join('');
}

// ── Fetch Space Images ────────────────────────────────────────────────────────
fetchBtn.addEventListener('click', fetchSpaceImages);

async function fetchSpaceImages() {
  const startDate = startInput.value;
  const endDate   = endInput.value;

  // Make sure the user has selected both dates before fetching
  if (!startDate || !endDate) {
    alert('Please select both a start and end date.');
    return;
  }

  // Show shimmer skeleton cards while we wait for the API
  showSkeletons(9);

  const cacheKey = `${startDate}_${endDate}`;
  const url = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`;

  try {
    // Use the pre-fetched result if available, otherwise start a fresh request
    const data = await (prefetchCache[cacheKey] || fetch(url).then(res => res.json()));

    // Remove the used cache entry so stale data isn't reused on the next click
    delete prefetchCache[cacheKey];

    // ── View Transitions API ─────────────────────────────────────────────────
    // If the browser supports it, wrap the gallery update in a smooth animated
    // transition. The CSS ::view-transition-old/new rules control the animation.
    if (document.startViewTransition) {
      document.startViewTransition(() => displayGallery(data));
    } else {
      displayGallery(data);
    }
  } catch (error) {
    gallery.innerHTML = '<p class="error-message">Something went wrong. Please try again.</p>';
    console.error('Error fetching NASA APOD data:', error);
  }
}

// ── Display Gallery ───────────────────────────────────────────────────────────
function displayGallery(items) {
  // Clear skeletons / previous results
  gallery.innerHTML = '';

  // The API returns a single object when only one date matches — normalise to array
  if (!Array.isArray(items)) {
    items = [items];
  }

  // Create a card for each item and add it to the gallery
  items.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('gallery-item');

    if (item.media_type === 'video') {
      // Video entries get a play-icon thumbnail
      card.innerHTML = `
        <div class="video-thumb">
          <span class="video-icon">▶️</span>
          <p class="video-label">Video</p>
        </div>
        <p><strong>${item.title}</strong></p>
        <p>${item.date}</p>
      `;
    } else {
      // Photo entries show the image with title and date
      card.innerHTML = `
        <img src="${item.url}" alt="${item.title}" loading="lazy" />
        <p><strong>${item.title}</strong></p>
        <p>${item.date}</p>
      `;
    }

    // Open the detail modal when the user clicks a card
    card.addEventListener('click', () => openModal(item));
    gallery.appendChild(card);
  });
}

// ── YouTube URL Helper ────────────────────────────────────────────────────────
// Converts a regular YouTube URL into an embeddable /embed/ URL for iframes
function getYouTubeEmbedUrl(url) {
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  return url; // already an embed URL or unknown format
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(item) {
  modalTitle.textContent       = item.title;
  modalDate.textContent        = item.date;
  modalExplanation.textContent = item.explanation;

  if (item.media_type === 'video') {
    modalImage.classList.add('hidden');
    modalVideo.classList.remove('hidden');

    if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
      // Embed YouTube videos directly in the modal
      const embedUrl = getYouTubeEmbedUrl(item.url);
      modalVideo.innerHTML = `<iframe src="${embedUrl}" allowfullscreen></iframe>`;
    } else {
      // Non-YouTube: show a clearly labelled external link
      modalVideo.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="video-link">▶ Watch Video</a>`;
    }
  } else {
    // Use high-res hdurl when available, fall back to standard url
    modalImage.src = item.hdurl || item.url;
    modalImage.alt = item.title;
    modalImage.classList.remove('hidden');
    modalVideo.classList.add('hidden');
    modalVideo.innerHTML = '';
  }

  modal.classList.remove('hidden');
}

// Close modal via the × button
modalClose.addEventListener('click', () => {
  modal.classList.add('hidden');
  modalVideo.innerHTML = ''; // stop any playing video
});

// Close modal by clicking the dark overlay (outside the content card)
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
    modalVideo.innerHTML = ''; // stop any playing video
  }
});
