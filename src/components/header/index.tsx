import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { localityTypeLabels, type SearchResult } from '@/lib/types';

type Props = {
  variant?: 'centered' | 'top';
};

const formatLocation = (result: SearchResult) =>
  [
    `${result.region} вобласць`,
    result.district ? `${result.district} раён` : null,
    result.council ? `${result.council} сельсавет` : null,
  ]
    .filter(Boolean)
    .join(', ');

function Header({ variant = 'top' }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      return res.json() as Promise<SearchResult[]>;
    },
    enabled: debouncedQuery.length >= 2,
    placeholderData: keepPreviousData,
  });

  const showSuggestions = isOpen && query.length >= 2;

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
          <InputGroup>
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
            />
            {isFetching && (
              <InputGroupAddon align="inline-end">
                <Loader2 className="animate-spin" />
              </InputGroupAddon>
            )}
          </InputGroup>

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
