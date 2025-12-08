'use client';

import { Languages, Plus } from 'lucide-react';
import React, { useImperativeHandle, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { FormType, PlaceForm } from '@/lib/types';

import FormRow from './form-row';

type EditableForm = {
  id?: number;
  type: FormType;
  form: string;
  gender: 'm' | 'f' | 'n' | 'p' | null;
  stressIndexes: number[] | null;
  paradigmVariant: string | null;
  paradigmTag: string | null;
  isNew?: boolean;
  isEditing?: boolean;
};

export type FormsSectionHandle = {
  getForms: () => Array<{ id?: number; form: string; type: string; gender?: string; stressIndexes: number[] }>;
};

type Props = {
  initialForms: PlaceForm[];
};

const FormsSection = React.forwardRef<FormsSectionHandle, Props>(function FormsSection({ initialForms }, ref) {
  const [forms, setForms] = useState<EditableForm[]>(initialForms.map((f) => ({ ...f, isEditing: false })));

  useImperativeHandle(
    ref,
    () => ({
      getForms: () =>
        forms.map((f) => ({
          id: f.id,
          form: f.form,
          type: f.type,
          gender: f.gender || undefined,
          stressIndexes: f.stressIndexes || [],
        })),
    }),
    [forms],
  );

  const handleAddNew = () => {
    setForms((prev) => [
      ...prev,
      {
        id: undefined,
        type: 'main',
        form: '',
        gender: null,
        stressIndexes: [],
        paradigmVariant: null,
        paradigmTag: null,
        isNew: true,
        isEditing: true,
      },
    ]);
  };

  const handleEdit = (index: number) => {
    setForms((prev) => prev.map((f, i) => (i === index ? { ...f, isEditing: true } : { ...f, isEditing: false })));
  };

  const handleCancel = (index: number) => {
    setForms((prev) => {
      const form = prev[index];
      if (form.isNew) {
        // Remove new form
        return prev.filter((_, i) => i !== index);
      } else {
        // Reset to original
        const original = initialForms.find((f) => f.id === form.id);
        if (original) {
          return prev.map((f, i) => (i === index ? { ...original, isEditing: false } : f));
        } else {
          return prev.map((f, i) => (i === index ? { ...f, isEditing: false } : f));
        }
      }
    });
  };

  const handleSaveRow = (
    index: number,
    data: { form: string; type: string; gender?: string; stressIndexes: number[] },
  ) => {
    setForms((prev) =>
      prev.map((f, i) =>
        i === index
          ? {
              ...f,
              ...data,
              type: data.type as FormType,
              gender: (data.gender as 'm' | 'f' | 'n' | 'p') || null,
              isEditing: false,
              isNew: false,
            }
          : f,
      ),
    );
  };

  const handleDelete = (index: number) => {
    const form = forms[index];
    if (form.id && !window.confirm('Вы ўпэўнены, што хочаце выдаліць гэтую форму?')) {
      return;
    }
    setForms((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Languages className="text-muted-foreground h-4 w-4" />
        <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Альтэрнатыўныя формы</h2>
      </div>

      <div className="space-y-3">
        {forms.map((form, index) => (
          <FormRow
            key={`${form.id ?? `new-${index}`}-${form.isEditing ? 'edit' : 'view'}`}
            form={form}
            isEditing={form.isEditing ?? false}
            onEdit={() => handleEdit(index)}
            onCancel={() => handleCancel(index)}
            onSave={(data) => handleSaveRow(index, data)}
            onDelete={() => handleDelete(index)}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={handleAddNew}
        title="Дадаць новую форму"
      >
        <Plus className="mr-2 h-4 w-4" />
        Дадаць новую форму
      </Button>
    </section>
  );
});

export default FormsSection;
