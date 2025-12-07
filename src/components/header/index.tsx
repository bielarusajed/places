import { useStore } from '@nanostores/react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { navigate } from 'astro:transitions/client';
import { ArrowRight, Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { localityTypeLabels, type SearchResult } from '@/lib/types';
import { $searchDistrict, $searchQuery, $searchRegion, $selectedRegion, initSearchFromUrl } from '@/stores/search';

type Props = {
  variant?: 'centered' | 'top' | 'search';
  regions?: string[];
};

const formatLocation = (result: SearchResult) =>
  [
    `${result.region} вобласць`,
    result.district ? `${result.district} раён` : null,
    result.council ? `${result.council} сельсавет` : null,
  ]
    .filter(Boolean)
    .join(', ');

function Header({ variant = 'top', regions = [] }: Props) {
  // For search variant, use nanostores
  const storeQuery = useStore($searchQuery);
  const storeRegion = useStore($searchRegion);
  const storeDistrict = useStore($searchDistrict);
  const storeSelectedRegion = useStore($selectedRegion);

  // For non-search variants, use local state
  const [localQuery, setLocalQuery] = useState('');
  const [localRegion, setLocalRegion] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Initialize stores on mount for search variant
  useEffect(() => {
    if (variant === 'search') {
      initSearchFromUrl(new URL(window.location.href));
    }
  }, [variant]);

  // Determine which state to use based on variant
  const isSearchVariant = variant === 'search';
  const query = isSearchVariant ? storeQuery : localQuery;
  const region = isSearchVariant ? storeRegion : localRegion;
  const selectedRegion = isSearchVariant
    ? storeSelectedRegion
    : localRegion && localRegion !== 'all'
      ? localRegion
      : '';

  const setQuery = isSearchVariant ? (v: string) => $searchQuery.set(v) : setLocalQuery;
  const setRegion = isSearchVariant ? (v: string) => $searchRegion.set(v) : setLocalRegion;

  const debouncedQuery = useDebouncedValue(query, 300);

  // Fetch districts for search variant
  const { data: districts = [] } = useQuery({
    queryKey: ['districts', storeSelectedRegion],
    queryFn: async () => {
      if (!storeSelectedRegion) return [];
      const res = await fetch(`/api/districts?region=${encodeURIComponent(storeSelectedRegion)}`);
      return res.json() as Promise<string[]>;
    },
    enabled: isSearchVariant && !!storeSelectedRegion,
  });

  const handleSearch = () => {
    if (query.trim().length < 2) return;
    const params = new URLSearchParams({ q: query.trim() });
    if (selectedRegion) params.set('region', selectedRegion);
    navigate(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearchVariant) {
      e.preventDefault();
      handleSearch();
    }
  };

  // Suggestions query (only for non-search variants)
  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', debouncedQuery, selectedRegion],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      const params = new URLSearchParams({ q: debouncedQuery });
      if (selectedRegion) params.set('region', selectedRegion);
      const res = await fetch(`/api/search?${params.toString()}`);
      return res.json() as Promise<SearchResult[]>;
    },
    enabled: !isSearchVariant && debouncedQuery.length >= 2,
    placeholderData: keepPreviousData,
  });

  const showSuggestions = !isSearchVariant && isOpen && query.length >= 2;

  // Search variant layout
  if (isSearchVariant) {
    return (
      <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 border-b px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <a
            href="/"
            className="text-foreground hover:text-foreground/80 shrink-0 font-sans text-lg font-bold tracking-widest uppercase"
            style={{ viewTransitionName: 'site-title' }}
          >
            Places
          </a>

          <div className="flex flex-1 items-center gap-3" style={{ viewTransitionName: 'search-box' }}>
            <InputGroup className="flex-1">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                placeholder="Пошук"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>

            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-40 shrink-0">
                <SelectValue placeholder="Вобласць" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усе вобласці</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={storeDistrict} onValueChange={(v) => $searchDistrict.set(v)} disabled={!storeSelectedRegion}>
              <SelectTrigger className="w-44 shrink-0">
                <SelectValue placeholder={storeSelectedRegion ? 'Раён' : 'Спачатку вобласць'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усе раёны</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
    );
  }

  // Centered and top variants
  return (
    <header
      className={`w-full ${variant === 'centered' ? 'flex min-h-[60vh] flex-col items-center justify-center px-4' : 'bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 border-b px-4 py-3 backdrop-blur'}`}
    >
      <div className={`w-full ${variant === 'centered' ? 'max-w-md' : 'mx-auto flex max-w-2xl items-center gap-4'}`}>
        <a
          href="/"
          className="text-foreground hover:text-foreground/80 block shrink-0 font-sans text-lg font-bold tracking-widest uppercase"
          style={{ viewTransitionName: 'site-title' }}
        >
          Places
        </a>

        <div className="relative flex-1" style={{ viewTransitionName: 'search-box' }}>
          <div className={`flex gap-2 ${variant === 'centered' ? 'flex-col-reverse sm:flex-row' : ''}`}>
            <InputGroup className="flex-1">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                placeholder="Пачніце набіраць назву для пошуку"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                onKeyDown={handleKeyDown}
              />
              {isFetching && (
                <InputGroupAddon align="inline-end">
                  <Loader2 className="animate-spin" />
                </InputGroupAddon>
              )}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={handleSearch}
                disabled={query.trim().length < 2}
                aria-label="Пошук"
              >
                <ArrowRight className="size-4" />
              </Button>
            </InputGroup>
            {regions.length > 0 && (
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className={variant === 'centered' ? 'w-full sm:w-auto' : 'w-auto shrink-0'}>
                  <SelectValue placeholder="Вобласць" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усе вобласці</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {showSuggestions && (
            <div className="bg-popover absolute top-full right-0 left-0 z-50 mt-1 max-h-[60vh] overflow-y-auto rounded-lg border shadow-lg">
              {results.length === 0 && !isFetching && (
                <div className="text-muted-foreground px-4 py-8 text-center text-sm">Нічога не знойдзена</div>
              )}
              {results.map((result) => (
                <a
                  key={result.id}
                  href={`/${result.id}`}
                  className="hover:bg-accent block border-b px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {localityTypeLabels[result.type]}
                    </Badge>
                    <span className="text-lg leading-none font-medium">{result.name}</span>
                  </div>
                  <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 text-sm">
                    {result.transliteration && <span>{result.transliteration}</span>}
                    {result.russian && <span className="text-muted-foreground/70">{result.russian}</span>}
                  </div>
                  <div className="text-muted-foreground/60 mt-1 text-xs">{formatLocation(result)}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
