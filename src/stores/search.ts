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

// Initialize from URL params (for SSR hydration) - only once
export function initSearchFromUrl(url: URL) {
  if ($isInitialized.get()) return;

  const q = url.searchParams.get('q') || '';
  const region = url.searchParams.get('region') || '';

  $searchQuery.set(q);
  $searchRegion.set(region);
  prevRegion = region;
  $isInitialized.set(true);
}
