// Configurations
const TOTAL_FRAMES = 116;
const LERP_FACTOR = 0.06; // Adjust between 0.05 (slower/smoother) and 0.15 (faster response)

// Canvas Elements
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');

// Preloader Elements
const loader = document.getElementById('loader');
const loaderPercentage = document.getElementById('loader-percentage');
const loaderBar = document.getElementById('loader-bar');

// State Variables
let images = [];
let loadedCount = 0;
let currentFrameIndex = 0;
let targetFrameIndex = 0;
let lastRenderedIndex = -1;
let isLoaded = false;
let isLocked = true;

// Function to generate the filename for a frame index
function getFramePath(index) {
  // Pad with zeroes (e.g., 1 -> '001', 12 -> '012')
  const paddedIndex = String(index).padStart(3, '0');
  return `/frames/ezgif-frame-${paddedIndex}.jpg`;
}

// Draw the image onto the canvas with an "object-fit: cover" effect
function drawImageCover(img) {
  if (!img || !img.complete) return;

  const devicePixelRatio = window.devicePixelRatio || 1;
  const canvasWidth = window.innerWidth * devicePixelRatio;
  const canvasHeight = window.innerHeight * devicePixelRatio;
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  const ratioX = canvasWidth / imgWidth;
  const ratioY = canvasHeight / imgHeight;
  const ratio = Math.max(ratioX, ratioY); // Cover strategy

  const newWidth = imgWidth * ratio;
  const newHeight = imgHeight * ratio;

  // Center the image
  const x = (canvasWidth - newWidth) / 2;
  const y = (canvasHeight - newHeight) / 2;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, x, y, newWidth, newHeight);
}

// Handle window resizing
function handleResize() {
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  // Force-redraw the current frame on resize
  const roundedIndex = Math.round(currentFrameIndex);
  if (images[roundedIndex]) {
    drawImageCover(images[roundedIndex]);
  }
}

// Calculate the frame target based on scroll position within the hero section
const hero = document.getElementById('hero');

function handleWheel(e) {
  const currentScroll = window.scrollY || document.documentElement.scrollTop;
  
  // Re-lock at the top if scrolling UP
  if (!isLocked && currentScroll <= 2 && e.deltaY < 0) {
    isLocked = true;
    document.body.classList.add('lock-scroll');
  }

  if (isLocked) {
    e.preventDefault();
    const delta = e.deltaY * 0.12; // Controls scrolling speed/sensitivity
    targetFrameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, targetFrameIndex + delta));
  }
}

let touchStartY = 0;
function handleTouchStart(e) {
  touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
  const currentScroll = window.scrollY || document.documentElement.scrollTop;
  const touchY = e.touches[0].clientY;
  const deltaY = touchStartY - touchY; // positive when swiping up (scrolling down)
  touchStartY = touchY;

  // Re-lock at top if swiping down (scrolling up)
  if (!isLocked && currentScroll <= 2 && deltaY < 0) {
    isLocked = true;
    document.body.classList.add('lock-scroll');
  }

  if (isLocked) {
    e.preventDefault();
    const delta = deltaY * 0.5; // Swipe sensitivity
    targetFrameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, targetFrameIndex + delta));
  }
}

// Butter-smooth interpolation loop
function tick() {
  // Interpolate current index toward target
  currentFrameIndex += (targetFrameIndex - currentFrameIndex) * LERP_FACTOR;

  // Round index for array lookup
  const roundedIndex = Math.round(currentFrameIndex);

  // Redraw if the frame has changed or needs initial draw
  if (roundedIndex !== lastRenderedIndex && images[roundedIndex]) {
    drawImageCover(images[roundedIndex]);
    lastRenderedIndex = roundedIndex;
  }

  // Release the scroll lock once the animation frames are completed
  if (isLocked && Math.round(currentFrameIndex) === TOTAL_FRAMES - 1 && targetFrameIndex === TOTAL_FRAMES - 1) {
    isLocked = false;
    document.body.classList.remove('lock-scroll');
  }

  requestAnimationFrame(tick);
}

// Initialize application preloading
function preloadImages() {
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFramePath(i);
    img.onload = () => {
      loadedCount++;
      const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
      
      // Update UI Progress
      loaderPercentage.textContent = `${percent}%`;
      loaderBar.style.width = `${percent}%`;

      if (loadedCount === TOTAL_FRAMES) {
        onAllImagesLoaded();
      }
    };
    img.onerror = () => {
      console.error(`Failed to load frame: ${img.src}`);
      // Treat as loaded to prevent lockup
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES) {
        onAllImagesLoaded();
      }
    };
    images.push(img);
  }
}

// Triggered once all frames are preloaded
function onAllImagesLoaded() {
  isLoaded = true;

  const currentScroll = window.scrollY || document.documentElement.scrollTop;
  if (currentScroll > 5) {
    isLocked = false;
    document.body.classList.remove('lock-scroll');
    targetFrameIndex = TOTAL_FRAMES - 1;
    currentFrameIndex = TOTAL_FRAMES - 1;
  } else {
    isLocked = true;
    document.body.classList.add('lock-scroll');
    targetFrameIndex = 0;
    currentFrameIndex = 0;
  }
  
  // Initial draw
  const initialIndex = Math.round(currentFrameIndex);
  if (images[initialIndex]) {
    drawImageCover(images[initialIndex]);
    lastRenderedIndex = initialIndex;
  }

  // Fade out loader
  loader.classList.add('fade-out');

  // Set up events and animation loop
  window.addEventListener('resize', handleResize);
  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('touchstart', handleTouchStart, { passive: false });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  
  // Start the render loop
  requestAnimationFrame(tick);
}

// Start preloading immediately
preloadImages();
// Set up canvas visual dimensions initially
canvas.style.width = window.innerWidth + 'px';
canvas.style.height = window.innerHeight + 'px';
