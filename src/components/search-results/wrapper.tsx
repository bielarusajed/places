import { QueryProvider } from '@/components/providers/query-provider';

import SearchResults from './index';

export function SearchResultsWrapper() {
  return (
    <QueryProvider>
      <SearchResults />
    </QueryProvider>
  );
}
