'use client';

import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type LocalityType, localityTypeLabels } from '@/lib/types';

type Props = {
  regions: string[];
  types: string[];
};

function PlaceCoreFields({ regions, types }: Props) {
  const form = useFormContext();
  const region = form.watch('region');

  // Fetch districts when region is selected
  const { data: districts = [] } = useQuery({
    queryKey: ['districts', region],
    queryFn: async () => {
      const response = await fetch(`/api/districts?region=${encodeURIComponent(region)}`);
      if (!response.ok) return [];
      return (await response.json()) as string[];
    },
    enabled: !!region,
  });

  return (
    <div className="space-y-6">
      {/* Section 1: Core Identity */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Асноўная інфармацыя</h2>
        </div>

        <div className="flex items-end gap-3">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="w-48 shrink-0">
                <FormLabel>Тып</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Тып" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {localityTypeLabels[type as LocalityType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Назва</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Назва населенага пункта" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-end gap-3">
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Вобласць</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Вобласць" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Раён</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''} disabled={!region}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Раён" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="council"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Сельсавет</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Сельсавет" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      {/* Section 2: Geo Coordinates */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Геаграфічныя каардынаты</h2>
          <span className="text-muted-foreground text-xs">(неабавязкова)</span>
        </div>

        <div className="flex items-end gap-3">
          <FormField
            control={form.control}
            name="osmId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>OSM ID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="OSM ID" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Шырата</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="any" placeholder="52.0000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Даўгата</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="any" placeholder="24.0000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>
    </div>
  );
}

export default PlaceCoreFields;
