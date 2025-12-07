import { atom, computed } from 'nanostores';

export const $searchQuery = atom('');
export const $searchRegion = atom('');
export const $searchDistrict = atom('');
export const $isInitialized = atom(false);

// Computed values that handle 'all' as empty
export const $selectedRegion = computed($searchRegion, (region) => (region && region !== 'all' ? region : ''));
export const $selectedDistrict = computed($searchDistrict, (district) =>
  district && district !== 'all' ? district : '',
);

// Reset district when region changes
let prevRegion = '';
$searchRegion.listen((region) => {
  if ($isInitialized.get() && region !== prevRegion) {
    $searchDistrict.set('');
  }
  prevRegion = region;
});

// Initialize from URL params
export function initSearchFromUrl(url: URL, force = false) {
  if (!force && $isInitialized.get()) return;

  const q = url.searchParams.get('q') || '';
  const region = url.searchParams.get('region') || '';

  $searchQuery.set(q);
  $searchRegion.set(region);
  $searchDistrict.set('');
  prevRegion = region;
  $isInitialized.set(true);
}

// Global View Transitions handler - update store BEFORE components render
// This runs before React hydration so components get fresh values
if (typeof document !== 'undefined') {
  document.addEventListener('astro:before-swap', () => {
    // Reset initialization so next page can reinitialize from URL
    $isInitialized.set(false);
  });

  document.addEventListener('astro:after-swap', () => {
    // If navigating to search page, initialize from URL immediately
    const url = new URL(window.location.href);
    if (url.pathname === '/search') {
      initSearchFromUrl(url, true);
    }
  });
}
