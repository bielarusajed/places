import { useStore } from '@nanostores/react';
import { keepPreviousData, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { navigate } from 'astro:transitions/client';
import { ArrowRight, Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getQueryClient } from '@/lib/query-client';
import { localityTypeLabels, type SearchResult } from '@/lib/types';
import { cn } from '@/lib/utils';
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
  const isSearchVariant = variant === 'search';
  const isCenteredVariant = variant === 'centered';

  // For search variant, use nanostores
  const storeQuery = useStore($searchQuery);
  const storeRegion = useStore($searchRegion);
  const storeDistrict = useStore($searchDistrict);
  const storeSelectedRegion = useStore($selectedRegion);

  // For non-search variants, use local state
  const [localQuery, setLocalQuery] = useState('');
  const [localRegion, setLocalRegion] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Initialize stores on mount for search variant (View Transitions handled globally in store)
  useEffect(() => {
    if (isSearchVariant) {
      initSearchFromUrl(new URL(window.location.href), true);
    }
  }, [isSearchVariant]);

  // Determine which state to use based on variant
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
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSearch();
    }
  };

  // Suggestions query (only for non-search variants)
  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', debouncedQuery, selectedRegion],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      const params = new URLSearchParams({ q: debouncedQuery, pageSize: '40' });
      if (selectedRegion) params.set('region', selectedRegion);
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = (await res.json()) as { results: SearchResult[]; nextCursor: string | null };
      return data.results;
    },
    enabled: !isSearchVariant && debouncedQuery.length >= 2,
    placeholderData: keepPreviousData,
  });

  const showSuggestions = !isSearchVariant && isOpen && query.length >= 2;

  const searchInput = (
    <div
      className="relative z-10 order-last min-w-0 flex-1 basis-full sm:order-0 sm:basis-0"
      style={{ viewTransitionName: 'search-box' }}
    >
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder={isSearchVariant ? 'Пошук' : 'Пачніце набіраць назву'}
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={!isSearchVariant ? () => setIsOpen(true) : undefined}
          onBlur={!isSearchVariant ? () => setTimeout(() => setIsOpen(false), 200) : undefined}
          onKeyDown={!isSearchVariant ? handleKeyDown : undefined}
        />
        {!isSearchVariant && (
          <div className="flex w-4 shrink-0 items-center justify-center">
            {isFetching && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
          </div>
        )}
        {!isSearchVariant && (
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
        )}
      </InputGroup>

      {/* Suggestions dropdown (non-search variants only) */}
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
  );

  const regionSelect = regions.length > 0 && (
    <div className="w-full shrink-0 sm:w-auto" style={{ viewTransitionName: 'region-select' }}>
      <Select value={region} onValueChange={setRegion}>
        <SelectTrigger className={cn(isCenteredVariant ? 'w-full sm:w-auto' : 'w-full sm:w-36')}>
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
    </div>
  );

  const districtSelect = isSearchVariant && (
    <div className="w-full shrink-0 sm:w-auto">
      <Select value={storeDistrict} onValueChange={(v) => $searchDistrict.set(v)} disabled={!storeSelectedRegion}>
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Раён" />
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
  );

  return (
    <header
      className={cn(
        'w-full px-4',
        isCenteredVariant
          ? 'flex min-h-[60vh] flex-col items-center justify-center'
          : 'bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 border-b py-2 backdrop-blur sm:py-3',
      )}
    >
      <div
        className={cn(
          'mx-auto w-full',
          isCenteredVariant ? 'max-w-md' : 'flex max-w-4xl flex-wrap items-center gap-2 sm:gap-3',
        )}
      >
        <a
          href="/"
          className="text-foreground hover:text-foreground/80 shrink-0 font-sans text-lg font-bold tracking-widest uppercase"
          style={{ viewTransitionName: 'site-title' }}
        >
          Places
        </a>

        {isCenteredVariant ? (
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row">
            {searchInput}
            {regionSelect}
          </div>
        ) : (
          <>
            {searchInput}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
              {regionSelect}
              {districtSelect}
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function HeaderWrapper({ variant, regions = [] }: Props) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Header variant={variant} regions={regions} />
    </QueryClientProvider>
  );
}

export default HeaderWrapper;
