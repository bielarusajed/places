import { useQuery } from '@tanstack/react-query';
import { type SubmitHandler, useFormContext } from 'react-hook-form';
import type z from 'zod';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type LocalityType, localityTypeLabels } from '@/lib/types';

import { placeSearchFormSchema } from './form-schema';

type Props = {
  regions: string[];
  types: string[];
};

function SearchForm({ regions, types }: Props) {
  const form = useFormContext<z.infer<typeof placeSearchFormSchema>>();

  const region = form.watch('region');
  const districts = useQuery({
    queryKey: ['districts', region],
    queryFn: async () => {
      const res = await fetch(`/api/districts?region=${encodeURIComponent(region)}`);
      return res.json() as Promise<string[]>;
    },
    enabled: region !== 'all',
  });

  const onSubmit: SubmitHandler<z.infer<typeof placeSearchFormSchema>> = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-flow-col gap-2">
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem className="row-span-2 grid grid-rows-subgrid">
            <FormLabel>Тып</FormLabel>
            <FormControl>
              <Select {...field} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Любы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Любы</SelectItem>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>
                        {localityTypeLabels[t as LocalityType]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="row-span-2 grid grid-rows-subgrid">
            <FormLabel>Назва</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="region"
        render={({ field }) => (
          <FormItem className="row-span-2 grid grid-rows-subgrid">
            <FormLabel>Вобласць</FormLabel>
            <FormControl>
              <Select {...field} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Любая" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Любая</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="district"
        render={({ field }) => (
          <FormItem className="row-span-2 grid grid-rows-subgrid">
            <FormLabel>Раён</FormLabel>
            <FormControl>
              <Select {...field} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Любая" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Любы</SelectItem>
                    {districts.data?.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />
      <Button type="submit" className="row-span-2 self-end">
        Шукаць
      </Button>
    </form>
  );
}

export default SearchForm;
