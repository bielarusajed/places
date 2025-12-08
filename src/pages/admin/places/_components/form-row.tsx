'use client';

import { Edit, Save, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FormType } from '@/lib/types';

import { insertStressMark, parseStressedString, renderStressedString } from './stress';

const formTypeLabels: Record<string, string> = {
  main: 'Асноўная',
  alias: 'Альтэрнатыўная',
  'alias-ru': 'Альтэрнатыўная (RU)',
  transliteration: 'Транслітарацыя',
  russian: 'Руская',
};

const genderOptions = [
  { value: 'none', label: '—' },
  { value: 'm', label: 'Мужчынскі' },
  { value: 'f', label: 'Жаночы' },
  { value: 'n', label: 'Ніякі' },
  { value: 'p', label: 'Множны' },
];

type EditableForm = {
  id?: number;
  type: FormType;
  form: string;
  gender: 'm' | 'f' | 'n' | 'p' | null;
  stressIndexes: number[] | null;
  isNew?: boolean;
};

type Props = {
  form: EditableForm;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: { form: string; type: string; gender?: string; stressIndexes: number[] }) => void;
  onDelete: () => void;
};

function FormRow({ form, isEditing, onEdit, onCancel, onSave, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Initialize from props - key-based reset handles sync when switching modes
  const [formValue, setFormValue] = useState(() => renderStressedString(form.form, form.stressIndexes || []));
  const [type, setType] = useState(form.type);
  const [gender, setGender] = useState<string>(form.gender || 'none');

  const handleSave = () => {
    const { form: plainForm, stressIndexes } = parseStressedString(formValue);
    onSave({
      form: plainForm,
      type,
      gender: gender === 'none' ? undefined : gender,
      stressIndexes,
    });
  };

  const handleInsertStress = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const input = inputRef.current;
    if (input) {
      insertStressMark(input);
      setFormValue(input.value);
    }
  };

  const displayForm = renderStressedString(form.form, form.stressIndexes || []);

  return (
    <div className="rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-[1fr_2fr_1fr_auto]">
        {/* Column 1: Type */}
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">ТЫП</label>
          {isEditing ? (
            <Select value={type} onValueChange={(v) => setType(v as FormType)}>
              <SelectTrigger>
                <SelectValue placeholder="Тып формы" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(formTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm font-medium">{formTypeLabels[form.type] || form.type}</div>
          )}
        </div>

        {/* Column 2: Form */}
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">ФОРМА</label>
          {isEditing ? (
            <div className="space-y-2">
              <InputGroup>
                <InputGroupInput
                  ref={inputRef}
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="Форма"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton type="button" size="icon-xs" onClick={handleInsertStress} title="Уставіць націск">
                    {'\u25cc\u0301'}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          ) : (
            <div>
              <p className="font-semibold">{displayForm}</p>
              {!isEditing && (!form.stressIndexes || form.stressIndexes.length === 0) && (
                <div className="text-muted-foreground mt-1 text-xs">Без націску</div>
              )}
            </div>
          )}
        </div>

        {/* Column 3: Gender */}
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">РОД</label>
          {isEditing ? (
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Род" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm">
              {form.gender && <div>{genderOptions.find((o) => o.value === form.gender)?.label || form.gender}</div>}
            </div>
          )}
        </div>

        {/* Column 4: Actions */}
        <div className="flex items-start gap-1">
          {isEditing ? (
            <>
              <Button type="button" variant="ghost" size="icon" onClick={handleSave} title="Захаваць">
                <Save className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={onCancel} title="Адмена">
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" size="icon" onClick={onEdit} title="Рэдагаваць">
                <Edit className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={onDelete} title="Выдаліць">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FormRow;
