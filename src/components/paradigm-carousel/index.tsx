import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import type { PlaceForm } from '@/lib/types';

const caseLabels = {
  N: 'Назоўны',
  G: 'Родны',
  D: 'Давальны',
  A: 'Вінавальны',
  I: 'Творны',
  L: 'Месны',
  V: 'Клічны',
} as const;

const caseOrder = ['N', 'G', 'D', 'A', 'I', 'L', 'V'] as const;

function formatFormWithStress(form: string, stressIndexes: number[] | null) {
  if (!stressIndexes || stressIndexes.length === 0) {
    return form;
  }

  let result = '';
  for (let i = 0; i < form.length; i++) {
    result += form[i];
    if (stressIndexes.includes(i)) {
      result += '\u0301'; // combining acute accent
    }
  }
  return result;
}

type ParadigmVariant = {
  id: string;
  forms: PlaceForm[];
};

function ParadigmTable({
  variant,
  variantIndex,
  totalVariants,
}: {
  variant: ParadigmVariant;
  variantIndex: number;
  totalVariants: number;
}) {
  const formsMap = new Map<string, PlaceForm>();
  variant.forms.forEach((f) => {
    if (f.paradigmTag) {
      formsMap.set(f.paradigmTag, f);
    }
  });

  const hasSingular = caseOrder.some((c) => formsMap.has(c + 'S'));
  const hasPlural = caseOrder.some((c) => formsMap.has(c + 'P'));
  const casesWithData = caseOrder.filter((c) => formsMap.has(c + 'S') || formsMap.has(c + 'P'));

  if (casesWithData.length === 0) return null;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      {totalVariants > 1 && (
        <div className="bg-muted/50 flex items-center justify-between border-b px-4 py-2">
          <span className="text-muted-foreground text-xs font-medium">
            Варыянт {variantIndex + 1} з {totalVariants}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-muted-foreground px-4 py-3 text-left font-medium">Склон</th>
              {hasSingular && <th className="text-muted-foreground px-4 py-3 text-left font-medium">Адз. лік</th>}
              {hasPlural && <th className="text-muted-foreground px-4 py-3 text-left font-medium">Мн. лік</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {casesWithData.map((caseKey) => {
              const singularForm = formsMap.get(caseKey + 'S');
              const pluralForm = formsMap.get(caseKey + 'P');

              return (
                <tr key={caseKey} className="hover:bg-muted/20 transition-colors">
                  <td className="text-muted-foreground px-4 py-3">{caseLabels[caseKey]}</td>
                  {hasSingular && (
                    <td className="px-4 py-3 font-medium">
                      {singularForm ? formatFormWithStress(singularForm.form, singularForm.stressIndexes) : '—'}
                    </td>
                  )}
                  {hasPlural && (
                    <td className="px-4 py-3 font-medium">
                      {pluralForm ? formatFormWithStress(pluralForm.form, pluralForm.stressIndexes) : '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

type Props = {
  paradigmForms: PlaceForm[];
  mainFormText: string;
};

function ParadigmCarousel({ paradigmForms, mainFormText }: Props) {
  // Group paradigm forms by variant
  const paradigmVariants: ParadigmVariant[] = [];
  const variantMap = new Map<string, PlaceForm[]>();
  paradigmForms.forEach((f) => {
    if (f.paradigmVariant) {
      const existing = variantMap.get(f.paradigmVariant) || [];
      existing.push(f);
      variantMap.set(f.paradigmVariant, existing);
    }
  });
  variantMap.forEach((forms, id) => {
    paradigmVariants.push({ id, forms });
  });

  if (paradigmVariants.length === 0) return null;

  // Sort variants: prioritize those where nominative matches main form
  const sortedVariants = [...paradigmVariants].sort((a, b) => {
    const aNominative = a.forms.find((f) => f.paradigmTag === 'NS' || f.paradigmTag === 'NP');
    const bNominative = b.forms.find((f) => f.paradigmTag === 'NS' || f.paradigmTag === 'NP');

    const aMatches = aNominative?.form === mainFormText ? 1 : 0;
    const bMatches = bNominative?.form === mainFormText ? 1 : 0;

    return bMatches - aMatches;
  });

  if (paradigmVariants.length === 1) {
    return <ParadigmTable variant={sortedVariants[0]} variantIndex={0} totalVariants={1} />;
  }

  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {sortedVariants.map((variant, idx) => (
          <CarouselItem key={variant.id}>
            <ParadigmTable variant={variant} variantIndex={idx} totalVariants={sortedVariants.length} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-4 md:-left-12" />
      <CarouselNext className="-right-4 md:-right-12" />
    </Carousel>
  );
}

export default ParadigmCarousel;
