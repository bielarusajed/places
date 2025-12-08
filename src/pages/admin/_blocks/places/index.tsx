import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClientProvider } from '@tanstack/react-query';
import { Map, MapPinPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { getQueryClient } from '@/lib/query-client';

import { placeSearchFormSchema } from './form-schema';
import SearchForm from './search-form';
import SearchResults from './search-results';

type Props = {
  regions: string[];
  types: string[];
};

function Places({ regions, types }: Props) {
  const form = useForm<z.infer<typeof placeSearchFormSchema>>({
    resolver: zodResolver(placeSearchFormSchema),
    defaultValues: {
      name: '',
      region: 'all',
      district: 'all',
      type: 'all',
    },
  });

  return (
    <div>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Map /> Населеныя пункты
          </h2>
          <Button asChild>
            <a href="/admin/places/new">
              <MapPinPlus />
              Дадаць
            </a>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <SearchForm regions={regions} types={types} />
            <SearchResults />
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function PlacesWrapper(props: Props) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Places {...props} />
    </QueryClientProvider>
  );
}

export default PlacesWrapper;
