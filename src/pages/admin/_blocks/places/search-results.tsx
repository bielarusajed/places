import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit } from 'lucide-react';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import type z from 'zod';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { localityTypeLabels, type SearchResult } from '@/lib/types';

import type { placeSearchFormSchema } from './form-schema';

const columnHelper = createColumnHelper<SearchResult>();
const columns = [
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('name', { header: 'Назва' }),
  columnHelper.accessor('type', {
    header: 'Тып',
    cell: (props) => localityTypeLabels[props.getValue()],
  }),
  columnHelper.accessor('region', { header: 'Вобласць' }),
  columnHelper.accessor('district', { header: 'Раён' }),
  columnHelper.accessor('council', { header: 'Сельсавет' }),
  columnHelper.display({
    id: 'actions',
    header: 'Дзеянні',
    cell: (props) => {
      const row = props.row.original;
      return (
        <Button variant="ghost" size="icon" asChild title="Рэдагаваць">
          <a href={`/admin/places/${row.id}/edit`}>
            <Edit className="h-4 w-4" />
          </a>
        </Button>
      );
    },
  }),
];

const emptyResults: SearchResult[] = [];

function SearchResults() {
  const form = useFormContext<z.infer<typeof placeSearchFormSchema>>();
  const name = form.watch('name');
  const region = form.watch('region');
  const district = form.watch('district');
  const type = form.watch('type');

  const queryKey = useMemo(() => ['places', name, region, district, type] as const, [name, region, district, type]);

  const { data, isFetching, error } = useQuery({
    queryKey,
    queryFn: async ({ queryKey: [, name, region, district, type] }) => {
      const searchParams = new URLSearchParams();
      if (name) searchParams.set('q', name);
      if (region && region !== 'all') searchParams.set('region', region);
      if (district && district !== 'all') searchParams.set('district', district);
      if (type && type !== 'all') searchParams.set('type', type);
      const response = await fetch(`/api/search?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Адбылася памылка пры пошуку');
      const data = (await response.json()) as { results: SearchResult[]; nextCursor: string | null };
      return data;
    },
    enabled: name.length >= 3,
    placeholderData: { results: emptyResults, nextCursor: null },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data?.results ?? emptyResults,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {!!error && 'Памылка: ' + (error instanceof Error ? error.message : String(error))}
                {isFetching && 'Загрузка...'}
                {!isFetching && !error && 'Нічога няма.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default SearchResults;
