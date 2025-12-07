import { useStore } from '@nanostores/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { localityTypeLabels, type SearchResult } from '@/lib/types';
import { $searchQuery, $selectedDistrict, $selectedRegion } from '@/stores/search';

type PaginatedResponse = {
  results: SearchResult[];
  nextCursor: number | null;
};

const formatLocation = (result: SearchResult) =>
  [
    `${result.region} вобласць`,
    result.district ? `${result.district} раён` : null,
    result.council ? `${result.council} сельсавет` : null,
  ]
    .filter(Boolean)
    .join(', ');

function ResultSkeleton() {
  return (
    <div className="border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="mt-1 flex gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="mt-1 h-3 w-64" />
    </div>
  );
}

function SearchResults() {
  const query = useStore($searchQuery);
  const selectedRegion = useStore($selectedRegion);
  const selectedDistrict = useStore($selectedDistrict);

  const debouncedQuery = useDebouncedValue(query, 300);

  const { ref: loadMoreRef, inView } = useInView();

  // Fetch search results with infinite scroll
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['search-results', debouncedQuery, selectedRegion, selectedDistrict],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ q: debouncedQuery });
      if (selectedRegion) params.set('region', selectedRegion);
      if (selectedDistrict) params.set('district', selectedDistrict);
      if (pageParam) params.set('cursor', String(pageParam));
      const res = await fetch(`/api/search-paginated?${params.toString()}`);
      return res.json() as Promise<PaginatedResponse>;
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: debouncedQuery.length >= 2,
  });

  const allResults = data?.pages.flatMap((page) => page.results) ?? [];

  // Load more when the sentinel element comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (query.length < 2) {
    return <div className="text-muted-foreground py-12 text-center">Увядзіце мінімум 2 сімвалы для пошуку</div>;
  }

  // Show loading when query changed but debounce hasn't caught up yet
  // This prevents showing stale results during View Transitions
  const isQueryPending = query !== debouncedQuery && query.length >= 2;
  const showLoading = isLoading || isQueryPending;

  return (
    <div className="space-y-4">
      {/* Results count */}
      {!showLoading && (
        <div className="text-muted-foreground text-sm">
          {allResults.length === 0 ? (
            'Нічога не знойдзена'
          ) : (
            <>
              Знойдзена: {allResults.length}
              {hasNextPage && '+'}
            </>
          )}
        </div>
      )}

      {/* Results list */}
      <div className="bg-card rounded-lg border">
        {showLoading ? (
          <>
            <ResultSkeleton />
            <ResultSkeleton />
            <ResultSkeleton />
            <ResultSkeleton />
            <ResultSkeleton />
          </>
        ) : allResults.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">Нічога не знойдзена па вашым запыце</div>
        ) : (
          allResults.map((result) => (
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
          ))
        )}
      </div>

      {/* Infinite scroll sentinel & loader */}
      {allResults.length > 0 && !showLoading && (
        <div ref={loadMoreRef} className="flex items-center justify-center py-4">
          {isFetchingNextPage && <Loader2 className="text-muted-foreground size-6 animate-spin" />}
        </div>
      )}

      {/* Fetching indicator (when filters change) */}
      {isFetching && !showLoading && !isFetchingNextPage && (
        <div className="fixed right-4 bottom-4">
          <div className="bg-background flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Загрузка...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
