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
  'There are more stars in the universe than grains of sand on all of Earth\'s beaches.',
  'Space is completely silent — there is no atmosphere for sound to travel through.',
  'The largest known star, UY Scuti, is about 1,700 times bigger than our Sun.',
  'A teaspoon of neutron star material would weigh about 10 million tons.',
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
  'Saturn\'s rings are mostly ice and rock, and some sections are only ~30 feet thick.',
  'The Great Red Spot on Jupiter is a storm that has been raging for over 350 years.',
];

// Pick a random fact from the array and display it on the page
const randomFact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
document.getElementById('fact-text').textContent = randomFact;

// ── Element References ────────────────────────────────────────────────────────
const fetchBtn        = document.getElementById('fetchBtn');
const gallery         = document.getElementById('gallery');
const modal           = document.getElementById('modal');
const modalClose      = document.getElementById('modalClose');
const modalImage      = document.getElementById('modalImage');
const modalVideo      = document.getElementById('modalVideo');
const modalTitle      = document.getElementById('modalTitle');
const modalDate       = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// ── Date Inputs ───────────────────────────────────────────────────────────────
// Find the date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput   = document.getElementById('endDate');

// Call setupDateInputs from dateRange.js to set min/max and default values
setupDateInputs(startInput, endInput);

// ── Fetch Space Images ────────────────────────────────────────────────────────
// When the button is clicked, fetch images from the NASA APOD API
fetchBtn.addEventListener('click', fetchSpaceImages);

async function fetchSpaceImages() {
  const startDate = startInput.value;
  const endDate   = endInput.value;

  // Make sure the user has selected both dates before fetching
  if (!startDate || !endDate) {
    alert('Please select both a start and end date.');
    return;
  }

  // Show a loading message while we wait for the API to respond
  gallery.innerHTML = '<p class="loading-message">🔄 Loading space photos…</p>';

  // Build the NASA APOD API URL with the date range and our API key
  const url = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`;

  try {
    // Send the request to the NASA API and wait for the response
    const response = await fetch(url);
    const data = await response.json();

    // Build the gallery from the data we received
    displayGallery(data);
  } catch (error) {
    // If something went wrong, show an error message to the user
    gallery.innerHTML = '<p class="error-message">❌ Something went wrong. Please try again.</p>';
    console.error('Error fetching NASA APOD data:', error);
  }
}

// ── Display Gallery ──────────────────────────────────────────────────────────
function displayGallery(items) {
  // Clear out any previous gallery content
  gallery.innerHTML = '';

  // The API returns a single object when only one result is found — wrap it in an array
  if (!Array.isArray(items)) {
    items = [items];
  }

  // Create a card for each item and add it to the gallery
  items.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('gallery-item');

    if (item.media_type === 'video') {
      // For video entries, show a play icon thumbnail
      card.innerHTML = `
        <div class="video-thumb">
          <span class="video-icon">▶️</span>
          <p class="video-label">Video</p>
        </div>
        <p><strong>${item.title}</strong></p>
        <p>${item.date}</p>
      `;
    } else {
      // For image entries, display the photo with title and date
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
// Converts a regular YouTube URL into an embeddable URL for the iframe
function getYouTubeEmbedUrl(url) {
  // Handle: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  // Handle: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  // Return as-is if it's already an embed URL or another format
  return url;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
// Opens the modal and fills it with the selected item's details
function openModal(item) {
  modalTitle.textContent       = item.title;
  modalDate.textContent        = item.date;
  modalExplanation.textContent = item.explanation;

  if (item.media_type === 'video') {
    // Hide the image element and show the video container
    modalImage.classList.add('hidden');
    modalVideo.classList.remove('hidden');

    if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
      // Embed YouTube videos directly in the modal
      const embedUrl = getYouTubeEmbedUrl(item.url);
      modalVideo.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
    } else {
      // For other video types, show a clearly labelled link to the video
      modalVideo.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="video-link">▶ Watch Video</a>`;
    }
  } else {
    // Show the high-res image (hdurl) if available, otherwise the standard url
    modalImage.src = item.hdurl || item.url;
    modalImage.alt = item.title;
    modalImage.classList.remove('hidden');
    modalVideo.classList.add('hidden');
    modalVideo.innerHTML = '';
  }

  // Make the modal visible
  modal.classList.remove('hidden');
}

// Close the modal when the × button is clicked
modalClose.addEventListener('click', () => {
  modal.classList.add('hidden');
  modalVideo.innerHTML = ''; // Stop any video that is currently playing
});

// Close the modal when the user clicks on the dark overlay outside the content
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
    modalVideo.innerHTML = ''; // Stop any video that is currently playing
  }
});

