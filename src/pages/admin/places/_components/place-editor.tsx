'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { getQueryClient } from '@/lib/query-client';
import type { LocalityType, PlaceDetails } from '@/lib/types';

import FormsSection, { type FormsSectionHandle } from './forms-section';
import PlaceCoreFields from './place-core-fields';

const placeFormSchema = z.object({
  name: z.string().min(1, 'Назва абавязковая'),
  type: z.string().min(1, 'Тып абавязковы'),
  region: z.string().min(1, 'Вобласць абавязковая'),
  district: z.string().optional(),
  council: z.string().optional(),
  osmId: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type PlaceFormValues = z.infer<typeof placeFormSchema>;

type Props = {
  mode: 'create' | 'edit';
  place?: PlaceDetails;
  coordinates?: { lat: number; lng: number } | null;
  osmId?: string | null;
  regions: string[];
  types: string[];
};

function PlaceEditor({ mode, place, coordinates, osmId, regions, types }: Props) {
  const formsRef = useRef<FormsSectionHandle>(null);

  const form = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: {
      name: place?.name ?? '',
      type: place?.type ?? (types[0] as LocalityType),
      region: place?.region ?? '',
      district: place?.district ?? '',
      council: place?.council ?? '',
      osmId: osmId ?? '',
      latitude: coordinates?.lat.toString() ?? '',
      longitude: coordinates?.lng.toString() ?? '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (
      data: PlaceFormValues & {
        forms: Array<{ id?: number; form: string; type: string; gender?: string; stressIndexes: number[] }>;
      },
    ) => {
      const payload = {
        name: data.name,
        type: data.type,
        region: data.region,
        district: data.district || null,
        council: data.council || null,
        osmId: data.osmId || null,
        coordinates:
          data.latitude && data.longitude ? { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) } : null,
        forms: data.forms,
      };

      const url = mode === 'create' ? '/api/admin/places' : `/api/admin/places/${place?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
        throw new Error(errorData.error || errorData.message || 'Памылка захавання');
      }

      return response.json();
    },
    onSuccess: () => {
      window.location.href = '/admin';
    },
    onError: (error: Error) => {
      form.setError('root', { message: error.message });
    },
  });

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  const handleSave = () => {
    form.handleSubmit((values) => {
      const forms = formsRef.current?.getForms() ?? [];
      saveMutation.mutate({ ...values, forms });
    })();
  };

  return (
    <main className="container mx-auto flex-1 space-y-8 px-4 py-8">
      {/* Title row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'create' ? 'Дадаць населены пункт' : 'Рэдагаваць населены пункт'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === 'create'
              ? 'Стварыць новы населены пункт і яго альтэрнатыўныя формы.'
              : 'Абнавіць асноўную інфармацыю, каардынаты і альтэрнатыўныя формы.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Адмена
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Захаваць
          </Button>
        </div>
      </div>

      {/* Main form card */}
      <Form {...form}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            {form.formState.errors.root && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {form.formState.errors.root.message}
              </div>
            )}
            <PlaceCoreFields regions={regions} types={types} />
            <FormsSection ref={formsRef} initialForms={place?.forms ?? []} />
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-6">
            <Button variant="outline" onClick={handleCancel}>
              Адмена
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              Захаваць
            </Button>
          </CardFooter>
        </Card>
      </Form>
    </main>
  );
}

function PlaceEditorWrapper(props: Props) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <PlaceEditor {...props} />
    </QueryClientProvider>
  );
}

export default PlaceEditorWrapper;
